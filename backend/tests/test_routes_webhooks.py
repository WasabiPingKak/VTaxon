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


# ---------------------------------------------------------------------------
# POST /api/webhooks/youtube (notification)
# ---------------------------------------------------------------------------

SAMPLE_ATOM_LIVE = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"
      xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <yt:videoId>vid123</yt:videoId>
    <yt:channelId>UC_test_channel</yt:channelId>
    <title>Test Stream</title>
  </entry>
</feed>
"""


def _yt_user_for_webhook(db_session, channel_id="UC_test_channel"):
    uid = f"user-{uuid.uuid4().hex[:8]}"
    u = User(id=uid, display_name="YTStreamer", role="user", visibility="visible")
    db_session.add(u)
    db_session.flush()
    acct = OAuthAccount(
        user_id=uid,
        provider="youtube",
        provider_account_id=f"yt-{uuid.uuid4().hex[:6]}",
        channel_url=f"https://www.youtube.com/channel/{channel_id}",
    )
    db_session.add(acct)
    db_session.flush()
    return u, acct


class TestYouTubeWebhookNotify:
    @patch(
        "app.services.youtube_pubsub.check_video_is_live",
        return_value={"title": "Live!", "started_at": "2026-01-01T00:00:00Z"},
    )
    @patch("app.services.youtube_pubsub.verify_hub_signature", return_value=True)
    def test_live_notification_creates_stream(self, mock_sig, mock_live, client, db_session):
        user, _ = _yt_user_for_webhook(db_session, "UC_test_channel")
        with patch.dict("os.environ", {"CRON_SECRET": "secret", "YOUTUBE_API_KEY": "key"}):
            resp = client.post(
                "/api/webhooks/youtube",
                data=SAMPLE_ATOM_LIVE,
                content_type="application/atom+xml",
            )
        assert resp.status_code == 204
        stream = LiveStream.query.filter_by(user_id=user.id, provider="youtube").first()
        assert stream is not None
        assert stream.stream_id == "vid123"
        assert stream.stream_title == "Live!"

    @patch("app.services.youtube_pubsub.check_video_is_live", return_value=None)
    @patch("app.services.youtube_pubsub.verify_hub_signature", return_value=True)
    def test_non_live_video_skipped(self, mock_sig, mock_live, client, db_session):
        _yt_user_for_webhook(db_session, "UC_test_channel")
        with patch.dict("os.environ", {"CRON_SECRET": "secret", "YOUTUBE_API_KEY": "key"}):
            resp = client.post(
                "/api/webhooks/youtube",
                data=SAMPLE_ATOM_LIVE,
                content_type="application/atom+xml",
            )
        assert resp.status_code == 204
        assert LiveStream.query.count() == 0

    @patch("app.services.youtube_pubsub.verify_hub_signature", return_value=False)
    def test_invalid_signature_rejected(self, mock_sig, client):
        with patch.dict("os.environ", {"CRON_SECRET": "secret"}):
            resp = client.post(
                "/api/webhooks/youtube",
                data=SAMPLE_ATOM_LIVE,
                content_type="application/atom+xml",
            )
        assert resp.status_code == 403

    @patch(
        "app.services.youtube_pubsub.check_video_is_live",
        return_value={"title": "T", "started_at": "2026-01-01T00:00:00Z"},
    )
    def test_no_hub_secret_skips_verification(self, mock_live, client, db_session):
        """When CRON_SECRET is empty, signature verification is skipped."""
        _yt_user_for_webhook(db_session, "UC_test_channel")
        with patch.dict("os.environ", {"CRON_SECRET": "", "YOUTUBE_API_KEY": "key"}):
            resp = client.post(
                "/api/webhooks/youtube",
                data=SAMPLE_ATOM_LIVE,
                content_type="application/atom+xml",
            )
        assert resp.status_code == 204

    @patch("app.services.youtube_pubsub.verify_hub_signature", return_value=True)
    def test_unknown_channel_ignored(self, mock_sig, client, db_session):
        """Notification for a channel not in our DB is safely ignored."""
        with patch.dict("os.environ", {"CRON_SECRET": "secret", "YOUTUBE_API_KEY": "key"}):
            resp = client.post(
                "/api/webhooks/youtube",
                data=SAMPLE_ATOM_LIVE,
                content_type="application/atom+xml",
            )
        assert resp.status_code == 204
        assert LiveStream.query.count() == 0


# ---------------------------------------------------------------------------
# _upsert_live_stream
# ---------------------------------------------------------------------------


class TestUpsertLiveStream:
    def test_insert_new_stream(self, app, db_session):
        from datetime import UTC, datetime

        uid = f"user-{uuid.uuid4().hex[:8]}"
        u = User(id=uid, display_name="Test", role="user")
        db_session.add(u)
        db_session.commit()

        from app.routes.webhooks import _upsert_live_stream

        _upsert_live_stream(
            user_id=uid,
            provider="youtube",
            stream_id="v1",
            stream_url="https://youtube.com/watch?v=v1",
            stream_title="Test Stream",
            started_at=datetime.now(UTC),
        )
        stream = LiveStream.query.filter_by(user_id=uid).first()
        assert stream is not None
        assert stream.stream_id == "v1"

    def test_update_existing_stream(self, app, db_session):
        from datetime import UTC, datetime

        uid = f"user-{uuid.uuid4().hex[:8]}"
        u = User(id=uid, display_name="Test", role="user")
        db_session.add(u)
        ls = LiveStream(user_id=uid, provider="youtube", stream_id="old")
        db_session.add(ls)
        db_session.commit()

        from app.routes.webhooks import _upsert_live_stream

        _upsert_live_stream(
            user_id=uid,
            provider="youtube",
            stream_id="new",
            stream_url="https://youtube.com/watch?v=new",
            stream_title="Updated",
            started_at=datetime.now(UTC),
        )
        streams = LiveStream.query.filter_by(user_id=uid, provider="youtube").all()
        assert len(streams) == 1
        assert streams[0].stream_id == "new"
        assert streams[0].stream_title == "Updated"
