"""Lightweight Circuit Breaker for external service calls.

Provides per-service circuit breakers that track consecutive failures and
short-circuit calls when a service is persistently unavailable, avoiding
costly timeout waits and protecting downstream resources.

State machine::

    CLOSED  ──[failure_threshold reached]──▶ OPEN
    OPEN    ──[recovery_timeout elapsed]───▶ HALF_OPEN
    HALF_OPEN ──[probe succeeds]───────────▶ CLOSED
    HALF_OPEN ──[probe fails]──────────────▶ OPEN

Usage::

    from .circuit_breaker import gbif_cb, CircuitOpenError

    def call_gbif(...):
        gbif_cb.guard()          # raises CircuitOpenError if OPEN
        try:
            resp = external_session.get(...)
            resp.raise_for_status()
            gbif_cb.record_success()
            return resp
        except requests.RequestException as exc:
            gbif_cb.record_failure(exc)
            raise
"""

import logging
import threading
import time
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitOpenError(Exception):
    """Raised when a call is rejected because the circuit breaker is open."""

    def __init__(self, service_name: str, retry_after: float) -> None:
        self.service_name = service_name
        self.retry_after = retry_after
        super().__init__(f"Circuit breaker open for {service_name}, retry after {retry_after:.0f}s")


class YouTubeQuotaExhaustedError(Exception):
    """YouTube Data API quota exceeded (HTTP 403).

    Triggers immediate circuit open with extended recovery timeout.
    """


class CircuitBreaker:
    """Thread-safe in-process circuit breaker.

    Parameters
    ----------
    name:
        Human-readable service name (used in logs and errors).
    failure_threshold:
        Number of consecutive failures before the circuit opens.
    recovery_timeout:
        Seconds to wait in OPEN state before allowing a probe (HALF_OPEN).
    half_open_max_calls:
        Maximum concurrent probe calls allowed in HALF_OPEN state.
    trip_immediately_on:
        Exception types that trigger an immediate transition to OPEN
        (bypassing the failure_threshold counter).  Useful for errors
        like YouTube quota exhaustion (HTTP 403) that are known to
        persist for an extended period.
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        half_open_max_calls: int = 1,
        trip_immediately_on: tuple[type[BaseException], ...] = (),
    ) -> None:
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls
        self.trip_immediately_on = trip_immediately_on

        self._lock = threading.Lock()
        self._failure_count: int = 0
        self._last_failure_time: float = 0.0
        self._half_open_calls: int = 0
        self._state = CircuitState.CLOSED

    @property
    def state(self) -> CircuitState:
        with self._lock:
            return self._compute_state()

    @property
    def failure_count(self) -> int:
        return self._failure_count

    @property
    def last_failure_time(self) -> float:
        return self._last_failure_time

    def _compute_state(self) -> CircuitState:
        """Compute effective state (must be called under lock)."""
        if self._state == CircuitState.OPEN:
            elapsed = time.monotonic() - self._last_failure_time
            if elapsed >= self.recovery_timeout:
                self._state = CircuitState.HALF_OPEN
                self._half_open_calls = 0
        return self._state

    def guard(self) -> None:
        """Check circuit state before making an external call.

        Raises ``CircuitOpenError`` if the circuit is OPEN.
        In HALF_OPEN state, allows up to ``half_open_max_calls`` probes.
        """
        with self._lock:
            state = self._compute_state()
            if state == CircuitState.OPEN:
                retry_after = self.recovery_timeout - (time.monotonic() - self._last_failure_time)
                raise CircuitOpenError(self.name, max(retry_after, 0.0))
            if state == CircuitState.HALF_OPEN:
                if self._half_open_calls >= self.half_open_max_calls:
                    raise CircuitOpenError(self.name, self.recovery_timeout)
                self._half_open_calls += 1

    def record_success(self) -> None:
        """Record a successful call — resets the circuit to CLOSED."""
        with self._lock:
            if self._failure_count > 0 or self._state != CircuitState.CLOSED:
                logger.info("Circuit breaker '%s' closed (service recovered)", self.name)
            self._failure_count = 0
            self._state = CircuitState.CLOSED
            self._half_open_calls = 0

    def record_failure(self, exc: BaseException | None = None) -> None:
        """Record a failed call — may trip the circuit to OPEN."""
        with self._lock:
            # Immediate trip for known persistent errors
            if exc is not None and self.trip_immediately_on and isinstance(exc, self.trip_immediately_on):
                self._failure_count = self.failure_threshold
                self._last_failure_time = time.monotonic()
                self._state = CircuitState.OPEN
                logger.warning(
                    "Circuit breaker '%s' OPEN (immediate trip: %s)",
                    self.name,
                    type(exc).__name__,
                )
                return

            self._failure_count += 1
            self._last_failure_time = time.monotonic()

            if self._state == CircuitState.HALF_OPEN:
                # Probe failed — reopen
                self._state = CircuitState.OPEN
                logger.warning("Circuit breaker '%s' OPEN (half-open probe failed)", self.name)
            elif self._failure_count >= self.failure_threshold:
                self._state = CircuitState.OPEN
                logger.warning(
                    "Circuit breaker '%s' OPEN (failures: %d/%d)",
                    self.name,
                    self._failure_count,
                    self.failure_threshold,
                )

    def reset(self) -> None:
        """Manually reset the circuit breaker to CLOSED (for testing/admin)."""
        with self._lock:
            self._failure_count = 0
            self._last_failure_time = 0.0
            self._state = CircuitState.CLOSED
            self._half_open_calls = 0


# ---------------------------------------------------------------------------
# Pre-configured instances for each external service
# ---------------------------------------------------------------------------

gbif_cb = CircuitBreaker("gbif", failure_threshold=5, recovery_timeout=60)
wikidata_cb = CircuitBreaker("wikidata", failure_threshold=5, recovery_timeout=120)
taicol_cb = CircuitBreaker("taicol", failure_threshold=5, recovery_timeout=120)
youtube_cb = CircuitBreaker(
    "youtube",
    failure_threshold=3,
    recovery_timeout=300,
    trip_immediately_on=(YouTubeQuotaExhaustedError,),
)
twitch_cb = CircuitBreaker("twitch", failure_threshold=5, recovery_timeout=60)


def get_all_breakers() -> list[dict[str, Any]]:
    """Return status summary of all circuit breakers (for admin endpoint)."""
    breakers = [gbif_cb, wikidata_cb, taicol_cb, youtube_cb, twitch_cb]
    return [
        {
            "name": cb.name,
            "state": cb.state.value,
            "failure_count": cb.failure_count,
            "last_failure_time": cb.last_failure_time,
        }
        for cb in breakers
    ]
