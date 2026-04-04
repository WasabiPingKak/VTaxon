"""Unit tests for the Circuit Breaker module."""

from unittest.mock import patch

import pytest

from app.services.circuit_breaker import (
    CircuitBreaker,
    CircuitOpenError,
    CircuitState,
    YouTubeQuotaExhaustedError,
)


@pytest.fixture
def cb() -> CircuitBreaker:
    """A circuit breaker with low thresholds for fast testing."""
    return CircuitBreaker("test", failure_threshold=3, recovery_timeout=1.0)


class TestCircuitBreakerStateTransitions:
    def test_starts_closed(self, cb: CircuitBreaker) -> None:
        assert cb.state == CircuitState.CLOSED

    def test_stays_closed_below_threshold(self, cb: CircuitBreaker) -> None:
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 2

    def test_opens_at_threshold(self, cb: CircuitBreaker) -> None:
        for _ in range(3):
            cb.record_failure()
        assert cb.state == CircuitState.OPEN

    def test_success_resets_failure_count(self, cb: CircuitBreaker) -> None:
        cb.record_failure()
        cb.record_failure()
        cb.record_success()
        assert cb.failure_count == 0
        assert cb.state == CircuitState.CLOSED

    def test_open_to_half_open_after_timeout(self) -> None:
        now = 1000.0
        with patch("app.services.circuit_breaker.time.monotonic", return_value=now):
            cb = CircuitBreaker("test", failure_threshold=3, recovery_timeout=1.0)
            for _ in range(3):
                cb.record_failure()
            assert cb.state == CircuitState.OPEN

        with patch("app.services.circuit_breaker.time.monotonic", return_value=now + 2.0):
            assert cb.state == CircuitState.HALF_OPEN

    def test_half_open_to_closed_on_success(self) -> None:
        now = 1000.0
        with patch("app.services.circuit_breaker.time.monotonic", return_value=now):
            cb = CircuitBreaker("test", failure_threshold=3, recovery_timeout=1.0)
            for _ in range(3):
                cb.record_failure()

        with patch("app.services.circuit_breaker.time.monotonic", return_value=now + 2.0):
            assert cb.state == CircuitState.HALF_OPEN
            cb.guard()  # allow probe
            cb.record_success()
            assert cb.state == CircuitState.CLOSED

    def test_half_open_to_open_on_failure(self) -> None:
        now = 1000.0
        with patch("app.services.circuit_breaker.time.monotonic", return_value=now):
            cb = CircuitBreaker("test", failure_threshold=3, recovery_timeout=1.0)
            for _ in range(3):
                cb.record_failure()

        with patch("app.services.circuit_breaker.time.monotonic", return_value=now + 2.0):
            assert cb.state == CircuitState.HALF_OPEN
            cb.guard()  # allow probe
            cb.record_failure()
            assert cb._state == CircuitState.OPEN


class TestGuard:
    def test_guard_passes_when_closed(self, cb: CircuitBreaker) -> None:
        cb.guard()  # should not raise

    def test_guard_raises_when_open(self, cb: CircuitBreaker) -> None:
        for _ in range(3):
            cb.record_failure()
        with pytest.raises(CircuitOpenError) as exc_info:
            cb.guard()
        assert exc_info.value.service_name == "test"
        assert exc_info.value.retry_after >= 0

    def test_guard_allows_one_probe_in_half_open(self) -> None:
        now = 1000.0
        with patch("app.services.circuit_breaker.time.monotonic", return_value=now):
            cb = CircuitBreaker("test", failure_threshold=3, recovery_timeout=1.0)
            for _ in range(3):
                cb.record_failure()

        with patch("app.services.circuit_breaker.time.monotonic", return_value=now + 2.0):
            cb.guard()  # first probe — should pass
            with pytest.raises(CircuitOpenError):
                cb.guard()  # second probe — should fail


class TestTripImmediately:
    def test_trip_immediately_on_matching_exception(self) -> None:
        cb = CircuitBreaker(
            "youtube",
            failure_threshold=5,
            recovery_timeout=300,
            trip_immediately_on=(YouTubeQuotaExhaustedError,),
        )
        cb.record_failure(YouTubeQuotaExhaustedError())
        assert cb.state == CircuitState.OPEN
        # failure_count should be set to threshold
        assert cb.failure_count == 5

    def test_no_trip_on_non_matching_exception(self) -> None:
        cb = CircuitBreaker(
            "youtube",
            failure_threshold=5,
            recovery_timeout=300,
            trip_immediately_on=(YouTubeQuotaExhaustedError,),
        )
        cb.record_failure(ConnectionError("timeout"))
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 1


class TestReset:
    def test_reset_clears_state(self, cb: CircuitBreaker) -> None:
        for _ in range(3):
            cb.record_failure()
        assert cb.state == CircuitState.OPEN
        cb.reset()
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 0


class TestCircuitOpenErrorAttributes:
    def test_error_attributes(self) -> None:
        err = CircuitOpenError("gbif", 42.5)
        assert err.service_name == "gbif"
        assert err.retry_after == 42.5
        assert "gbif" in str(err)
