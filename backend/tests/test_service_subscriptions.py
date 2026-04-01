"""Unit tests for app.services.subscriptions — public helpers."""

import uuid
from unittest.mock import patch

import requests

from app.models import OAuthAccount, User

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ENV_TWITCH = {
    "TWITCH_CLIENT_ID": "cid",
    "TWITCH_CLIENT_SECRET": "csec",
    "TWITCH_WEBHOOK_SECRET": "wsec",
    "WEBHOOK_BASE_URL": "https://api.test",
}

ENV_YOUTUBE = {
    "WEBHOOK_BASE_URL": "https://api.test",
    "CRON_SECRET": "secret",
}


def _make_user(db_session, provider="twitch", channel_url=None, provider_account_id=None):
    uid = f"user-{uuid.uuid4().hex[:8]}"
    u = User(id=uid, display_name="Sub Test", role="user")
    db_session.add(u)
    db_session.flush()
    pid = provider_account_id or f"pid-{uuid.uuid4().hex[:6]}"
    acct = OAuthAccount(
        user_id=uid,
        provider=provider,
        provider_account_id=pid,
        channel_url=channel_url
        or (f"https://twitch.tv/{pid}" if provider == "twitch" else f"https://www.youtube.com/channel/UC{pid}"),
    )
    db_session.add(acct)
    db_session.flush()
    return u, acct


# ---------------------------------------------------------------------------
# subscribe_twitch_user
# ---------------------------------------------------------------------------


class TestSubscribeTwitchUser:
    @patch("app.services.twitch.create_eventsub_subscription")
    def test_creates_two_subs(self, mock_create, app, db_session):
        _, acct = _make_user(db_session, provider="twitch", provider_account_id="twitch-001")
        with patch.dict("os.environ", ENV_TWITCH):
            from app.services.subscriptions import subscribe_twitch_user

            subscribe_twitch_user("twitch-001", oauth_account=acct)
        assert mock_create.call_count == 2
        event_types = {call.args[3] for call in mock_create.call_args_list}
        assert event_types == {"stream.online", "stream.offline"}
        db_session.refresh(acct)
        assert acct.live_sub_status == "subscribed"

    @patch("app.services.twitch.create_eventsub_subscription", side_effect=requests.RequestException("API error"))
    def test_partial_failure(self, mock_create, app, db_session):
        _, acct = _make_user(db_session, provider="twitch", provider_account_id="twitch-002")
        with patch.dict("os.environ", ENV_TWITCH):
            from app.services.subscriptions import subscribe_twitch_user

            subscribe_twitch_user("twitch-002", oauth_account=acct)
        db_session.refresh(acct)
        assert acct.live_sub_status == "failed"

    def test_no_config_marks_failed(self, app, db_session):
        _, acct = _make_user(db_session, provider="twitch", provider_account_id="twitch-003")
        with patch.dict("os.environ", {"TWITCH_CLIENT_ID": "", "TWITCH_CLIENT_SECRET": ""}):
            from app.services.subscriptions import subscribe_twitch_user

            subscribe_twitch_user("twitch-003", oauth_account=acct)
        db_session.refresh(acct)
        assert acct.live_sub_status == "failed"


# ---------------------------------------------------------------------------
# unsubscribe_twitch_user
# ---------------------------------------------------------------------------


class TestUnsubscribeTwitchUser:
    @patch("app.services.twitch.delete_eventsub_subscription")
    @patch(
        "app.services.twitch.list_eventsub_subscriptions",
        return_value=[
            {"id": "sub-1", "condition": {"broadcaster_user_id": "twitch-010"}},
            {"id": "sub-2", "condition": {"broadcaster_user_id": "twitch-010"}},
            {"id": "sub-3", "condition": {"broadcaster_user_id": "other"}},
        ],
    )
    def test_deletes_matching_subs(self, mock_list, mock_delete, app, db_session):
        with patch.dict("os.environ", {"TWITCH_CLIENT_ID": "cid", "TWITCH_CLIENT_SECRET": "csec"}):
            from app.services.subscriptions import unsubscribe_twitch_user

            unsubscribe_twitch_user("twitch-010")
        assert mock_delete.call_count == 2
        deleted_ids = {call.args[2] for call in mock_delete.call_args_list}
        assert deleted_ids == {"sub-1", "sub-2"}

    def test_no_config_returns_silently(self, app):
        with patch.dict("os.environ", {"TWITCH_CLIENT_ID": "", "TWITCH_CLIENT_SECRET": ""}):
            from app.services.subscriptions import unsubscribe_twitch_user

            unsubscribe_twitch_user("twitch-020")  # should not raise


# ---------------------------------------------------------------------------
# subscribe_youtube_user
# ---------------------------------------------------------------------------


class TestSubscribeYoutubeUser:
    @patch("app.services.youtube_pubsub.subscribe_channel", return_value=True)
    def test_subscribes_successfully(self, mock_sub, app, db_session):
        _, acct = _make_user(
            db_session,
            provider="youtube",
            channel_url="https://www.youtube.com/channel/UCtest123",
        )
        with patch.dict("os.environ", ENV_YOUTUBE):
            from app.services.subscriptions import subscribe_youtube_user

            subscribe_youtube_user("https://www.youtube.com/channel/UCtest123", oauth_account=acct)
        mock_sub.assert_called_once()
        db_session.refresh(acct)
        assert acct.live_sub_status == "subscribed"

    @patch("app.services.youtube_pubsub.subscribe_channel", return_value=False)
    def test_subscribe_failure(self, mock_sub, app, db_session):
        _, acct = _make_user(
            db_session,
            provider="youtube",
            channel_url="https://www.youtube.com/channel/UCfail",
        )
        with patch.dict("os.environ", ENV_YOUTUBE):
            from app.services.subscriptions import subscribe_youtube_user

            subscribe_youtube_user("https://www.youtube.com/channel/UCfail", oauth_account=acct)
        db_session.refresh(acct)
        assert acct.live_sub_status == "failed"

    def test_no_webhook_url_marks_failed(self, app, db_session):
        _, acct = _make_user(
            db_session,
            provider="youtube",
            channel_url="https://www.youtube.com/channel/UCtest",
        )
        with patch.dict("os.environ", {"WEBHOOK_BASE_URL": ""}):
            from app.services.subscriptions import subscribe_youtube_user

            subscribe_youtube_user("https://www.youtube.com/channel/UCtest", oauth_account=acct)
        db_session.refresh(acct)
        assert acct.live_sub_status == "failed"

    def test_no_channel_id_marks_failed(self, app, db_session):
        _, acct = _make_user(
            db_session,
            provider="youtube",
            channel_url="https://www.youtube.com/@handle",  # no /channel/UC...
        )
        with patch.dict("os.environ", ENV_YOUTUBE):
            from app.services.subscriptions import subscribe_youtube_user

            subscribe_youtube_user("https://www.youtube.com/@handle", oauth_account=acct)
        db_session.refresh(acct)
        assert acct.live_sub_status == "failed"


# ---------------------------------------------------------------------------
# unsubscribe_youtube_user
# ---------------------------------------------------------------------------


class TestUnsubscribeYoutubeUser:
    @patch("app.services.youtube_pubsub.unsubscribe_channel")
    def test_unsubscribes(self, mock_unsub, app):
        with patch.dict("os.environ", ENV_YOUTUBE):
            from app.services.subscriptions import unsubscribe_youtube_user

            unsubscribe_youtube_user("https://www.youtube.com/channel/UCtest123")
        mock_unsub.assert_called_once()
        assert "UCtest123" in mock_unsub.call_args.args[0]

    def test_no_webhook_url_returns_silently(self, app):
        with patch.dict("os.environ", {"WEBHOOK_BASE_URL": ""}):
            from app.services.subscriptions import unsubscribe_youtube_user

            unsubscribe_youtube_user("https://www.youtube.com/channel/UCtest")

    def test_no_channel_id_returns_silently(self, app):
        with patch.dict("os.environ", ENV_YOUTUBE):
            from app.services.subscriptions import unsubscribe_youtube_user

            unsubscribe_youtube_user("https://www.youtube.com/@handle")
