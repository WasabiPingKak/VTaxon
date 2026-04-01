"""Route integration tests for /api/livestream — cron endpoints + admin subscription management."""

import sys
import types
import uuid
from unittest.mock import MagicMock, patch

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


# ---------------------------------------------------------------------------
# POST /api/livestream/youtube-renew-subs
# ---------------------------------------------------------------------------


def _mock_cloud_tasks_module(dispatch_return):
    """Inject a fake cloud_tasks_client module to avoid google-cloud import issues."""
    mock_mod = types.ModuleType("app.utils.cloud_tasks_client")
    mock_dispatch = MagicMock(return_value=dispatch_return)
    mock_mod.dispatch_tasks_batch = mock_dispatch  # type: ignore[attr-defined]
    return mock_mod, mock_dispatch


class TestYouTubeRenewSubs:
    def test_cloud_tasks_success(self, client, db_session, app):
        mock_mod, mock_dispatch = _mock_cloud_tasks_module({"dispatched": 2, "failed": 0})
        with (
            patch.dict("os.environ", {"CRON_SECRET": "test-cron-secret", "CLOUD_RUN_SERVICE_URL": "https://x.run.app"}),
            patch.dict(sys.modules, {"app.utils.cloud_tasks_client": mock_mod}),
        ):
            _yt_user(db_session, "UC_aaa111")
            _yt_user(db_session, "UC_bbb222")
            resp = client.post("/api/livestream/youtube-renew-subs", headers=CRON_HEADERS)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["mode"] == "cloud_tasks"
        assert data["dispatched"] == 2

    def test_cloud_tasks_all_fail_falls_back_to_sync(self, client, db_session, app):
        mock_mod, mock_dispatch = _mock_cloud_tasks_module({"dispatched": 0, "failed": 2})
        with (
            patch.dict(
                "os.environ",
                {
                    "CRON_SECRET": "test-cron-secret",
                    "CLOUD_RUN_SERVICE_URL": "https://x.run.app",
                    "WEBHOOK_BASE_URL": "https://x.run.app",
                },
            ),
            patch.dict(sys.modules, {"app.utils.cloud_tasks_client": mock_mod}),
            patch("app.services.youtube_pubsub.subscribe_channel", return_value=True) as mock_sub,
        ):
            _yt_user(db_session, "UC_aaa111")
            _yt_user(db_session, "UC_bbb222")
            resp = client.post("/api/livestream/youtube-renew-subs", headers=CRON_HEADERS)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["mode"] == "sync"
        assert data["renewed"] == 2
        assert mock_sub.call_count == 2

    @patch("app.services.youtube_pubsub.subscribe_channel", return_value=True)
    def test_no_cloud_run_url_uses_sync(self, mock_sub, client, db_session, app):
        with patch.dict(
            "os.environ",
            {"CRON_SECRET": "test-cron-secret", "CLOUD_RUN_SERVICE_URL": "", "WEBHOOK_BASE_URL": "https://x.run.app"},
        ):
            _yt_user(db_session, "UC_ccc333")
            resp = client.post("/api/livestream/youtube-renew-subs", headers=CRON_HEADERS)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["mode"] == "sync"
        assert data["renewed"] == 1


# ---------------------------------------------------------------------------
# Admin: GET /api/livestream/youtube-subs
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# POST /api/livestream/backfill-youtube-channels
# ---------------------------------------------------------------------------


def _yt_user_handle(db_session, handle="testuser"):
    """Create a YouTube user with @handle URL."""
    uid = f"user-{uuid.uuid4().hex[:8]}"
    u = User(id=uid, display_name="HandleUser", role="user")
    db_session.add(u)
    db_session.flush()
    acct = OAuthAccount(
        user_id=uid,
        provider="youtube",
        provider_account_id=f"yt-{uuid.uuid4().hex[:6]}",
        channel_url=f"https://www.youtube.com/@{handle}",
    )
    db_session.add(acct)
    db_session.flush()
    return u, acct


def _yt_user_null(db_session, token="some-token"):
    """Create a YouTube user with NULL channel_url but with access_token."""
    uid = f"user-{uuid.uuid4().hex[:8]}"
    u = User(id=uid, display_name="NullUser", role="user")
    db_session.add(u)
    db_session.flush()
    acct = OAuthAccount(
        user_id=uid,
        provider="youtube",
        provider_account_id=f"yt-{uuid.uuid4().hex[:6]}",
        channel_url=None,
        access_token=token,
    )
    db_session.add(acct)
    db_session.flush()
    return u, acct


class TestBackfillYouTubeChannels:
    @patch("app.services.youtube_pubsub.subscribe_channel", return_value=True)
    @patch("app.services.youtube_pubsub.resolve_handle_to_channel_id", return_value="UCresolved123")
    def test_resolves_handle(self, mock_resolve, mock_sub, client, db_session, mock_auth, admin_user):
        _yt_user_handle(db_session, "testchannel")
        with (
            mock_auth(admin_user.id),
            patch.dict("os.environ", {"YOUTUBE_API_KEY": "key", "WEBHOOK_BASE_URL": "https://x", "CRON_SECRET": "s"}),
        ):
            resp = client.post("/api/livestream/backfill-youtube-channels")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["resolved_handle"] == 1
        assert data["subscribe_ok"] == 1

    @patch("app.services.youtube_pubsub.subscribe_channel", return_value=True)
    @patch("app.services.youtube_pubsub.fetch_my_channel_id", return_value="UCmyChannel")
    @patch("app.services.youtube_pubsub.resolve_handle_to_channel_id", return_value=None)
    def test_resolves_null_via_token(
        self, mock_resolve, mock_fetch, mock_sub, client, db_session, mock_auth, admin_user
    ):
        _yt_user_null(db_session, "valid-token")
        with (
            mock_auth(admin_user.id),
            patch.dict("os.environ", {"YOUTUBE_API_KEY": "key", "WEBHOOK_BASE_URL": "https://x", "CRON_SECRET": "s"}),
        ):
            resp = client.post("/api/livestream/backfill-youtube-channels")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["resolved_token"] == 1

    def test_non_admin_rejected(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.post("/api/livestream/backfill-youtube-channels")
        assert resp.status_code == 403

    def test_skips_already_valid(self, client, db_session, mock_auth, admin_user):
        _yt_user(db_session, "UC_valid123")
        with (
            mock_auth(admin_user.id),
            patch.dict("os.environ", {"YOUTUBE_API_KEY": "key", "WEBHOOK_BASE_URL": "https://x"}),
        ):
            resp = client.post("/api/livestream/backfill-youtube-channels")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["resolved_handle"] == 0
        assert data["resolved_token"] == 0
        assert data["still_missing"] == 0


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
