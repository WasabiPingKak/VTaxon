"""Tests for the shared HTTP client with retry configuration."""

import requests
from requests.adapters import HTTPAdapter

from app.services.http_client import _retry_strategy, external_session

# ---------------------------------------------------------------------------
# external_session
# ---------------------------------------------------------------------------


class TestExternalSession:
    def test_is_requests_session(self):
        assert isinstance(external_session, requests.Session)

    def test_has_https_adapter(self):
        adapter = external_session.get_adapter("https://example.com")
        assert isinstance(adapter, HTTPAdapter)

    def test_has_http_adapter(self):
        adapter = external_session.get_adapter("http://example.com")
        assert isinstance(adapter, HTTPAdapter)


# ---------------------------------------------------------------------------
# Retry strategy
# ---------------------------------------------------------------------------


class TestRetryStrategy:
    def test_total_retries(self):
        assert _retry_strategy.total == 2

    def test_backoff_factor(self):
        assert _retry_strategy.backoff_factor == 0.5

    def test_status_forcelist(self):
        assert set(_retry_strategy.status_forcelist) == {500, 502, 503, 504}

    def test_allowed_methods(self):
        assert _retry_strategy.allowed_methods == ["GET"]

    def test_raise_on_status_is_false(self):
        assert _retry_strategy.raise_on_status is False
