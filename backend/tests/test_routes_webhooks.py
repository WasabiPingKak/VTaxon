"""Route integration tests for /api/webhooks — Twitch EventSub + YouTube PubSubHubbub."""

import uuid
from unittest.mock import patch

from app.models import LiveStream, OAuthAccount, User

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _twitch_user(db_session, broadcaster_id="12345"):
    uid = f"user-{uuid.uuid4().hex[:8]}"
    u = User(id=uid, display_name="TwitchStreamer", role="user", visibility="visible")
    db_session.add(u)
    db_session.flush()
    acct = OAuthAccount(
        user_id=uid,
        provider="twitch",
        provider_account_id=broadcaster_id,
        channel_url="https://twitch.tv/testuser",
    )
    db_session.add(acct)
    db_session.flush()
    return u, acct


# ---------------------------------------------------------------------------
# POST /api/webhooks/twitch
# ---------------------------------------------------------------------------


class TestTwitchWebhook:
    @patch("app.services.twitch.verify_webhook_signature", return_value=True)
    def test_challenge_verification(self, mock_verify, client):
        with patch.dict("os.environ", {"TWITCH_WEBHOOK_SECRET": "secret"}):
            resp = client.post(
                "/api/webhooks/twitch",
                json={"challenge": "test-challenge-123"},
                headers={
                    "Twitch-Eventsub-Message-Type": "webhook_callback_verification",
                },
            )
        assert resp.status_code == 200
        assert resp.data.decode() == "test-challenge-123"

    @patch("app.services.twitch.verify_webhook_signature", return_value=False)
    def test_invalid_signature_rejected(self, mock_verify, client, app):
        app.config["TWITCH_WEBHOOK_SECRET"] = "test-secret"
        with patch.dict("os.environ", {"TWITCH_WEBHOOK_SECRET": "secret"}):
            resp = client.post(
                "/api/webhooks/twitch",
                json={},
                headers={"Twitch-Eventsub-Message-Type": "notification"},
            )
        assert resp.status_code == 403

    @patch("app.services.twitch.get_stream_title", return_value="Playing Minecraft")
    @patch("app.services.twitch.verify_webhook_signature", return_value=True)
    def test_stream_online(self, mock_verify, mock_title, client, db_session, app):
        with patch.dict(
            "os.environ", {"TWITCH_WEBHOOK_SECRET": "s", "TWITCH_CLIENT_ID": "id", "TWITCH_CLIENT_SECRET": "sec"}
        ):
            user, acct = _twitch_user(db_session, broadcaster_id="99999")
            resp = client.post(
                "/api/webhooks/twitch",
                json={
                    "subscription": {"type": "stream.online"},
                    "event": {
                        "broadcaster_user_id": "99999",
                        "broadcaster_user_login": "testuser",
                        "id": "stream-001",
                    },
                },
                headers={"Twitch-Eventsub-Message-Type": "notification"},
            )
        assert resp.status_code == 204
        stream = LiveStream.query.filter_by(user_id=user.id, provider="twitch").first()
        assert stream is not None
        assert stream.stream_id == "stream-001"

    @patch("app.services.twitch.verify_webhook_signature", return_value=True)
    def test_stream_offline(self, mock_verify, client, db_session, app):
        with patch.dict("os.environ", {"TWITCH_WEBHOOK_SECRET": "s"}):
            user, acct = _twitch_user(db_session, broadcaster_id="88888")
            # Insert a live stream record first
            ls = LiveStream(user_id=user.id, provider="twitch", stream_id="s1")
            db_session.add(ls)
            db_session.flush()

            resp = client.post(
                "/api/webhooks/twitch",
                json={
                    "subscription": {"type": "stream.offline"},
                    "event": {"broadcaster_user_id": "88888"},
                },
                headers={"Twitch-Eventsub-Message-Type": "notification"},
            )
        assert resp.status_code == 204
        assert LiveStream.query.filter_by(user_id=user.id, provider="twitch").first() is None


# ---------------------------------------------------------------------------
# GET /api/webhooks/youtube (verification)
# ---------------------------------------------------------------------------


class TestYouTubeWebhookVerify:
    def test_returns_challenge(self, client):
        resp = client.get("/api/webhooks/youtube?hub.challenge=abc123")
        assert resp.status_code == 200
        assert resp.data.decode() == "abc123"

    def test_no_challenge_returns_404(self, client):
        resp = client.get("/api/webhooks/youtube")
        assert resp.status_code == 404
