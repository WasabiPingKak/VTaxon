"""Route integration tests for /api/livestream — cron endpoints + admin subscription management."""

import uuid
from unittest.mock import patch

from app.models import LiveStream, OAuthAccount, User

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

CRON_HEADERS = {"X-Cron-Secret": "test-cron-secret"}


def _yt_user(db_session, channel_id="UC_test123"):
    uid = f"user-{uuid.uuid4().hex[:8]}"
    u = User(id=uid, display_name="YTUser", role="user")
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


# ---------------------------------------------------------------------------
# Cron secret verification
# ---------------------------------------------------------------------------


class TestCronAuth:
    def test_missing_cron_secret_rejected(self, client):
        resp = client.post("/api/livestream/youtube-check-offline")
        assert resp.status_code == 403

    def test_wrong_cron_secret_rejected(self, client):
        resp = client.post(
            "/api/livestream/youtube-check-offline",
            headers={"X-Cron-Secret": "wrong"},
        )
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# POST /api/livestream/youtube-check-offline
# ---------------------------------------------------------------------------


class TestYouTubeCheckOffline:
    @patch("app.services.youtube_pubsub.check_streams_ended", return_value=[])
    def test_no_streams(self, mock_check, client, app):
        with patch.dict("os.environ", {"CRON_SECRET": "test-cron-secret", "YOUTUBE_API_KEY": "key"}):
            resp = client.post("/api/livestream/youtube-check-offline", headers=CRON_HEADERS)
        assert resp.status_code == 200
        assert resp.get_json()["checked"] == 0

    @patch("app.services.youtube_pubsub.check_streams_ended", return_value=["vid-1"])
    def test_ends_offline_streams(self, mock_check, client, db_session, app):
        with patch.dict("os.environ", {"CRON_SECRET": "test-cron-secret", "YOUTUBE_API_KEY": "key"}):
            user, acct = _yt_user(db_session)
            ls = LiveStream(user_id=user.id, provider="youtube", stream_id="vid-1")
            db_session.add(ls)
            db_session.flush()

            resp = client.post("/api/livestream/youtube-check-offline", headers=CRON_HEADERS)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["ended"] == 1
        assert LiveStream.query.filter_by(user_id=user.id).first() is None


# ---------------------------------------------------------------------------
# Admin: GET /api/livestream/twitch-subs
# ---------------------------------------------------------------------------


class TestListTwitchSubs:
    @patch("app.services.twitch.list_eventsub_subscriptions", return_value=[{"id": "sub-1"}])
    def test_admin_can_list(self, mock_list, client, mock_auth, admin_user):
        with patch.dict("os.environ", {"TWITCH_CLIENT_ID": "id", "TWITCH_CLIENT_SECRET": "sec"}):
            with mock_auth(admin_user.id):
                resp = client.get("/api/livestream/twitch-subs")
        assert resp.status_code == 200
        assert resp.get_json()["total"] == 1

    def test_non_admin_rejected(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.get("/api/livestream/twitch-subs")
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Admin: GET /api/livestream/youtube-subs
# ---------------------------------------------------------------------------


class TestListYouTubeSubs:
    def test_admin_can_list(self, client, db_session, mock_auth, admin_user):
        _yt_user(db_session)
        with mock_auth(admin_user.id):
            resp = client.get("/api/livestream/youtube-subs")
        assert resp.status_code == 200
        assert resp.get_json()["total"] == 1
