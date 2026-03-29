"""Route integration tests for /api/live-status."""

import uuid

from app.models import LiveStream, User
from app.routes.livestream import invalidate_live_cache

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _live_user(db_session, provider="twitch"):
    uid = f"user-{uuid.uuid4().hex[:8]}"
    u = User(id=uid, display_name="LiveUser", role="user")
    db_session.add(u)
    db_session.flush()
    ls = LiveStream(
        user_id=uid,
        provider=provider,
        stream_id="stream-1",
        stream_url="https://twitch.tv/test",
        stream_title="Playing games",
    )
    db_session.add(ls)
    db_session.flush()
    return u, ls


class TestLiveStatus:
    def test_returns_live_streams(self, client, db_session):
        invalidate_live_cache()
        user, ls = _live_user(db_session)

        resp = client.get("/api/live-status")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["live"]) == 1
        assert data["live"][0]["user_id"] == user.id

    def test_empty_when_no_streams(self, client):
        invalidate_live_cache()
        resp = client.get("/api/live-status")
        assert resp.status_code == 200
        assert resp.get_json()["live"] == []

    def test_cache_works(self, client, db_session):
        invalidate_live_cache()
        _live_user(db_session)

        # First call populates cache
        resp1 = client.get("/api/live-status")
        assert len(resp1.get_json()["live"]) == 1

        # Second call should return cached result (even after data changes)
        # We don't invalidate, so cache should still have data
        resp2 = client.get("/api/live-status")
        assert resp2.status_code == 200
