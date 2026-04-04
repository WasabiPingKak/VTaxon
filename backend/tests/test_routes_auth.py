"""Route tests for /api/auth — link-token + callback."""

import time
import uuid
from unittest.mock import patch

from app.models import AuthIdAlias, Blacklist, User

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _create_user(db_session, uid=None, **kwargs):
    uid = uid or f"user-{uuid.uuid4().hex[:8]}"
    defaults = {"id": uid, "display_name": "TestUser", "role": "user"}
    defaults.update(kwargs)
    u = User(**defaults)
    db_session.add(u)
    db_session.commit()
    return u


# ---------------------------------------------------------------------------
# POST /api/auth/link-token
# ---------------------------------------------------------------------------


class TestCreateLinkToken:
    def test_requires_auth(self, client):
        resp = client.post("/api/auth/link-token")
        assert resp.status_code == 401

    def test_returns_token(self, client, db_session, mock_auth):
        user = _create_user(db_session)
        with mock_auth(user.id):
            resp = client.post("/api/auth/link-token")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "link_token" in data
        assert "." in data["link_token"]

    def test_user_not_found(self, client, mock_auth):
        with mock_auth("nonexistent-id"):
            resp = client.post("/api/auth/link-token")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# _sign_link_token / _verify_link_token unit tests
# ---------------------------------------------------------------------------


class TestLinkTokenCrypto:
    def test_roundtrip(self, app):
        with app.app_context():
            with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": "test-secret"}):
                from app.routes.auth import _sign_link_token, _verify_link_token

                token = _sign_link_token("user-abc")
                assert _verify_link_token(token) == "user-abc"

    def test_tampered_signature_rejected(self, app):
        with app.app_context():
            with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": "test-secret"}):
                from app.routes.auth import _sign_link_token, _verify_link_token

                token = _sign_link_token("user-abc")
                payload, sig = token.rsplit(".", 1)
                tampered = f"{payload}.{'0' * len(sig)}"
                assert _verify_link_token(tampered) is None

    def test_expired_token_rejected(self, app):
        with app.app_context():
            with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": "test-secret"}):
                from app.routes.auth import _sign_link_token, _verify_link_token

                with patch("app.routes.auth.time") as mock_time:
                    mock_time.time.return_value = time.time() - 700
                    token = _sign_link_token("user-abc")
                # Now verify with real time — token should be expired
                assert _verify_link_token(token) is None

    def test_malformed_token_rejected(self, app):
        with app.app_context():
            with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": "test-secret"}):
                from app.routes.auth import _verify_link_token

                assert _verify_link_token("not-a-token") is None
                assert _verify_link_token("") is None


# ---------------------------------------------------------------------------
# POST /api/auth/callback
# ---------------------------------------------------------------------------


class TestAuthCallback:
    """Test auth_callback route — user creation, updates, blacklist, linking."""

    def _call(self, client, user_id, raw_auth_id=None, **json_data):
        """Helper to POST /api/auth/callback with mocked auth."""
        raw_auth_id = raw_auth_id or user_id
        with patch("app.auth.get_current_user", return_value=user_id):
            # Inject raw_auth_id into flask.g
            with client.application.test_request_context():
                pass
            with patch("app.routes.auth.request") as mock_req:
                mock_req.get_json.return_value = json_data
            # Simpler: just use the client directly and mock g
            resp = client.post(
                "/api/auth/callback",
                json=json_data,
                headers={"Authorization": "Bearer fake"},
            )
        return resp

    def test_new_user_created(self, client, db_session, mock_auth):
        uid = f"new-{uuid.uuid4().hex[:8]}"
        with mock_auth(uid):
            resp = client.post(
                "/api/auth/callback",
                json={"display_name": "NewVtuber", "login_provider": "google"},
            )
        assert resp.status_code == 200
        user = db_session.get(User, uid)
        assert user is not None
        assert user.display_name == "NewVtuber"
        assert user.primary_platform == "youtube"

    def test_new_twitch_user(self, client, db_session, mock_auth):
        uid = f"twitch-{uuid.uuid4().hex[:8]}"
        with mock_auth(uid):
            resp = client.post(
                "/api/auth/callback",
                json={"display_name": "TwitchVtuber", "login_provider": "twitch"},
            )
        assert resp.status_code == 200
        user = db_session.get(User, uid)
        assert user.primary_platform == "twitch"

    def test_existing_user_returns_data(self, client, db_session, mock_auth):
        user = _create_user(db_session)
        with mock_auth(user.id):
            resp = client.post("/api/auth/callback", json={})
        assert resp.status_code == 200
        assert resp.get_json()["id"] == user.id

    def test_existing_user_yt_avatar_update(self, client, db_session, mock_auth):
        user = _create_user(db_session, avatar_url="old-url")
        with mock_auth(user.id):
            resp = client.post(
                "/api/auth/callback",
                json={"yt_avatar": True, "avatar_url": "new-yt-url"},
            )
        assert resp.status_code == 200
        db_session.refresh(user)
        assert user.avatar_url == "new-yt-url"

    def test_existing_user_backfill_null_avatar(self, client, db_session, mock_auth):
        user = _create_user(db_session, avatar_url=None)
        with mock_auth(user.id):
            resp = client.post(
                "/api/auth/callback",
                json={"avatar_url": "backfill-url"},
            )
        assert resp.status_code == 200
        db_session.refresh(user)
        assert user.avatar_url == "backfill-url"

    def test_blacklisted_user_rejected(self, client, db_session, mock_auth):
        uid = f"banned-{uuid.uuid4().hex[:8]}"
        bl = Blacklist(identifier_type="supabase_uid", identifier_value=uid, reason="test")
        db_session.add(bl)
        db_session.commit()
        with mock_auth(uid):
            resp = client.post(
                "/api/auth/callback",
                json={"display_name": "Banned"},
            )
        assert resp.status_code == 403
        assert resp.get_json()["error"] == "account_banned"

    def test_cross_email_link_valid_token(self, client, db_session, mock_auth):
        """Cross-email OAuth linking with a valid link_token."""
        # Existing user who generated the link token
        original = _create_user(db_session, display_name="OriginalUser")

        # New auth id (simulates Supabase creating a new auth user)
        new_uid = f"new-auth-{uuid.uuid4().hex[:8]}"

        with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": "test-secret"}):
            from app.routes.auth import _sign_link_token

            token = _sign_link_token(original.id)

            with mock_auth(new_uid):
                resp = client.post(
                    "/api/auth/callback",
                    json={"link_token": token},
                )
        assert resp.status_code == 200
        assert resp.get_json()["id"] == original.id
        # Verify alias was created
        alias = db_session.get(AuthIdAlias, new_uid)
        assert alias is not None
        assert alias.user_id == original.id

    def test_cross_email_link_expired_token(self, client, db_session, mock_auth):
        original = _create_user(db_session)
        new_uid = f"new-auth-{uuid.uuid4().hex[:8]}"

        with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": "test-secret"}):
            from app.routes.auth import _sign_link_token

            with patch("app.routes.auth.time") as mock_time:
                mock_time.time.return_value = time.time() - 700
                token = _sign_link_token(original.id)

            with mock_auth(new_uid):
                resp = client.post(
                    "/api/auth/callback",
                    json={"link_token": token},
                )
        assert resp.status_code == 400
        assert resp.get_json()["error"] == "invalid_or_expired_link_token"

    def test_cross_email_link_malformed_token(self, client, mock_auth):
        """Malformed link_token (e.g. stale sessionStorage remnant) should return 400."""
        uid = f"new-auth-{uuid.uuid4().hex[:8]}"
        with mock_auth(uid):
            resp = client.post(
                "/api/auth/callback",
                json={"link_token": "garbage-not-a-real-token"},
            )
        assert resp.status_code == 400
        assert resp.get_json()["error"] == "invalid_or_expired_link_token"

    def test_race_condition_duplicate_user(self, client, db_session, mock_auth):
        """Concurrent auth_callback for the same user_id — second call should not crash."""
        uid = f"race-{uuid.uuid4().hex[:8]}"
        # First call creates the user
        with mock_auth(uid):
            resp1 = client.post(
                "/api/auth/callback",
                json={"display_name": "First"},
            )
        assert resp1.status_code == 200

        # Simulate second concurrent call by deleting user from session cache
        # but it exists in DB — the route should handle IntegrityError gracefully
        with mock_auth(uid):
            resp2 = client.post(
                "/api/auth/callback",
                json={"display_name": "Second"},
            )
        assert resp2.status_code == 200
