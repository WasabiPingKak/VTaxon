"""Unit tests for twitch service — token caching, EventSub CRUD, webhook verification."""

import hashlib
import hmac
import time
from unittest.mock import MagicMock, patch

import requests

from app.services.twitch import (
    _token_cache,
    create_eventsub_subscription,
    delete_eventsub_subscription,
    get_app_access_token,
    get_stream_title,
    list_eventsub_subscriptions,
    verify_webhook_signature,
)

CLIENT_ID = "test_client_id"
CLIENT_SECRET = "test_client_secret"


def _reset_token_cache():
    """Reset module-level token cache between tests."""
    _token_cache["access_token"] = None
    _token_cache["expires_at"] = 0


# ---------------------------------------------------------------------------
# get_app_access_token — token fetch + caching
# ---------------------------------------------------------------------------


class TestGetAppAccessToken:
    def setup_method(self):
        _reset_token_cache()

    @patch("app.services.twitch.requests.post")
    def test_fetches_new_token(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "access_token": "tok_abc",
            "expires_in": 3600,
        }
        mock_post.return_value = mock_resp

        result = get_app_access_token(CLIENT_ID, CLIENT_SECRET)

        assert result == "tok_abc"
        mock_post.assert_called_once()
        mock_resp.raise_for_status.assert_called_once()

    @patch("app.services.twitch.requests.post")
    def test_returns_cached_token(self, mock_post):
        _token_cache["access_token"] = "tok_cached"
        _token_cache["expires_at"] = time.time() + 3600

        result = get_app_access_token(CLIENT_ID, CLIENT_SECRET)

        assert result == "tok_cached"
        mock_post.assert_not_called()

    @patch("app.services.twitch.requests.post")
    def test_refreshes_expired_token(self, mock_post):
        _token_cache["access_token"] = "tok_old"
        _token_cache["expires_at"] = time.time() + 30  # within 60s buffer

        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "access_token": "tok_new",
            "expires_in": 3600,
        }
        mock_post.return_value = mock_resp

        result = get_app_access_token(CLIENT_ID, CLIENT_SECRET)

        assert result == "tok_new"
        mock_post.assert_called_once()

    @patch("app.services.twitch.requests.post")
    def test_defaults_expires_in_to_3600(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"access_token": "tok_def"}
        mock_post.return_value = mock_resp

        result = get_app_access_token(CLIENT_ID, CLIENT_SECRET)

        assert result == "tok_def"
        assert _token_cache["expires_at"] > time.time() + 3500


# ---------------------------------------------------------------------------
# create_eventsub_subscription
# ---------------------------------------------------------------------------


class TestCreateEventsubSubscription:
    def setup_method(self):
        _reset_token_cache()
        _token_cache["access_token"] = "tok_test"
        _token_cache["expires_at"] = time.time() + 3600

    @patch("app.services.twitch.requests.post")
    def test_success(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 202
        mock_resp.json.return_value = {"data": [{"id": "sub_1"}]}
        mock_post.return_value = mock_resp

        result = create_eventsub_subscription(
            CLIENT_ID,
            CLIENT_SECRET,
            "12345",
            "stream.online",
            "https://example.com/callback",
            "webhook_secret",
        )

        assert result == {"data": [{"id": "sub_1"}]}
        mock_resp.raise_for_status.assert_called_once()

    @patch("app.services.twitch.requests.post")
    def test_409_returns_already_exists(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 409
        mock_post.return_value = mock_resp

        result = create_eventsub_subscription(
            CLIENT_ID,
            CLIENT_SECRET,
            "12345",
            "stream.online",
            "https://example.com/callback",
            "webhook_secret",
        )

        assert result == {"status": "already_exists"}
        mock_resp.raise_for_status.assert_not_called()

    @patch("app.services.twitch.requests.post")
    def test_other_error_raises(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.raise_for_status.side_effect = requests.HTTPError("Server Error")
        mock_post.return_value = mock_resp

        try:
            create_eventsub_subscription(
                CLIENT_ID,
                CLIENT_SECRET,
                "12345",
                "stream.online",
                "https://example.com/callback",
                "webhook_secret",
            )
            assert False, "Should have raised"
        except requests.HTTPError:
            pass


# ---------------------------------------------------------------------------
# delete_eventsub_subscription
# ---------------------------------------------------------------------------


class TestDeleteEventsubSubscription:
    def setup_method(self):
        _reset_token_cache()
        _token_cache["access_token"] = "tok_test"
        _token_cache["expires_at"] = time.time() + 3600

    @patch("app.services.twitch.requests.delete")
    def test_success(self, mock_delete):
        mock_resp = MagicMock()
        mock_delete.return_value = mock_resp

        delete_eventsub_subscription(CLIENT_ID, CLIENT_SECRET, "sub_1")

        mock_delete.assert_called_once()
        mock_resp.raise_for_status.assert_called_once()

    @patch("app.services.twitch.requests.delete")
    def test_error_raises(self, mock_delete):
        mock_resp = MagicMock()
        mock_resp.raise_for_status.side_effect = requests.HTTPError("Not Found")
        mock_delete.return_value = mock_resp

        try:
            delete_eventsub_subscription(CLIENT_ID, CLIENT_SECRET, "sub_bad")
            assert False, "Should have raised"
        except requests.HTTPError:
            pass


# ---------------------------------------------------------------------------
# list_eventsub_subscriptions — pagination
# ---------------------------------------------------------------------------


class TestListEventsubSubscriptions:
    def setup_method(self):
        _reset_token_cache()
        _token_cache["access_token"] = "tok_test"
        _token_cache["expires_at"] = time.time() + 3600

    @patch("app.services.twitch.requests.get")
    def test_single_page(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "data": [{"id": "sub_1"}, {"id": "sub_2"}],
            "pagination": {},
        }
        mock_get.return_value = mock_resp

        result = list_eventsub_subscriptions(CLIENT_ID, CLIENT_SECRET)

        assert len(result) == 2
        assert result[0]["id"] == "sub_1"

    @patch("app.services.twitch.requests.get")
    def test_multiple_pages(self, mock_get):
        page1 = MagicMock()
        page1.json.return_value = {
            "data": [{"id": "sub_1"}],
            "pagination": {"cursor": "cursor_abc"},
        }
        page2 = MagicMock()
        page2.json.return_value = {
            "data": [{"id": "sub_2"}],
            "pagination": {},
        }
        mock_get.side_effect = [page1, page2]

        result = list_eventsub_subscriptions(CLIENT_ID, CLIENT_SECRET)

        assert len(result) == 2
        assert result[1]["id"] == "sub_2"
        assert mock_get.call_count == 2

    @patch("app.services.twitch.requests.get")
    def test_empty_result(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"data": [], "pagination": {}}
        mock_get.return_value = mock_resp

        result = list_eventsub_subscriptions(CLIENT_ID, CLIENT_SECRET)

        assert result == []


# ---------------------------------------------------------------------------
# get_stream_title
# ---------------------------------------------------------------------------


class TestGetStreamTitle:
    def setup_method(self):
        _reset_token_cache()
        _token_cache["access_token"] = "tok_test"
        _token_cache["expires_at"] = time.time() + 3600

    @patch("app.services.twitch.requests.get")
    def test_returns_title(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "data": [{"title": "Playing Minecraft!"}],
        }
        mock_get.return_value = mock_resp

        result = get_stream_title(CLIENT_ID, CLIENT_SECRET, "12345")

        assert result == "Playing Minecraft!"

    @patch("app.services.twitch.requests.get")
    def test_empty_data_returns_none(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"data": []}
        mock_get.return_value = mock_resp

        result = get_stream_title(CLIENT_ID, CLIENT_SECRET, "12345")

        assert result is None

    @patch("app.services.twitch.requests.get")
    def test_request_error_returns_none(self, mock_get):
        mock_get.side_effect = requests.RequestException("timeout")

        result = get_stream_title(CLIENT_ID, CLIENT_SECRET, "12345")

        assert result is None


# ---------------------------------------------------------------------------
# verify_webhook_signature — HMAC-SHA256
# ---------------------------------------------------------------------------


class TestVerifyWebhookSignature:
    def _make_signature(self, secret, msg_id, timestamp, body):
        message = msg_id + timestamp + body
        sig = hmac.new(
            secret.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return f"sha256={sig}"

    def test_valid_signature(self):
        secret = "my_secret"
        msg_id = "msg-123"
        timestamp = "2026-01-01T00:00:00Z"
        body = '{"type":"stream.online"}'
        sig = self._make_signature(secret, msg_id, timestamp, body)

        headers = {
            "Twitch-Eventsub-Message-Id": msg_id,
            "Twitch-Eventsub-Message-Timestamp": timestamp,
            "Twitch-Eventsub-Message-Signature": sig,
        }

        assert verify_webhook_signature(headers, body, secret) is True

    def test_invalid_signature(self):
        headers = {
            "Twitch-Eventsub-Message-Id": "msg-123",
            "Twitch-Eventsub-Message-Timestamp": "2026-01-01T00:00:00Z",
            "Twitch-Eventsub-Message-Signature": "sha256=badbadbad",
        }

        assert verify_webhook_signature(headers, '{"data":"x"}', "my_secret") is False

    def test_missing_message_id(self):
        headers = {
            "Twitch-Eventsub-Message-Timestamp": "2026-01-01T00:00:00Z",
            "Twitch-Eventsub-Message-Signature": "sha256=abc",
        }

        assert verify_webhook_signature(headers, "body", "secret") is False

    def test_missing_timestamp(self):
        headers = {
            "Twitch-Eventsub-Message-Id": "msg-123",
            "Twitch-Eventsub-Message-Signature": "sha256=abc",
        }

        assert verify_webhook_signature(headers, "body", "secret") is False

    def test_missing_signature(self):
        headers = {
            "Twitch-Eventsub-Message-Id": "msg-123",
            "Twitch-Eventsub-Message-Timestamp": "2026-01-01T00:00:00Z",
        }

        assert verify_webhook_signature(headers, "body", "secret") is False

    def test_empty_headers(self):
        assert verify_webhook_signature({}, "body", "secret") is False
