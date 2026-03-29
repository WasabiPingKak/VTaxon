"""Route integration tests for /api/users/me/oauth-accounts — CRUD + resubscribe."""

import uuid
from unittest.mock import patch

from app.models import OAuthAccount, User

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _user_with_account(db_session, provider="youtube"):
    uid = f"user-{uuid.uuid4().hex[:8]}"
    u = User(id=uid, display_name="OAuthUser", role="user", primary_platform=provider)
    db_session.add(u)
    db_session.flush()
    acct = OAuthAccount(
        user_id=uid,
        provider=provider,
        provider_account_id=f"{provider}-{uuid.uuid4().hex[:6]}",
        provider_display_name="TestChannel",
        channel_url=f"https://{'twitch.tv' if provider == 'twitch' else 'youtube.com/channel'}/test",
    )
    db_session.add(acct)
    db_session.flush()
    return u, acct


# ---------------------------------------------------------------------------
# GET /api/users/me/oauth-accounts
# ---------------------------------------------------------------------------


class TestGetOAuthAccounts:
    def test_list_own_accounts(self, client, db_session, mock_auth):
        user, acct = _user_with_account(db_session)
        with mock_auth(user.id):
            resp = client.get("/api/users/me/oauth-accounts")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data) == 1
        assert data[0]["provider"] == "youtube"

    def test_unauthenticated_rejected(self, client):
        resp = client.get("/api/users/me/oauth-accounts")
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# PATCH /api/users/me/oauth-accounts/<id>
# ---------------------------------------------------------------------------


class TestUpdateOAuthAccount:
    def test_update_show_on_profile(self, client, db_session, mock_auth):
        user, acct = _user_with_account(db_session)
        with mock_auth(user.id):
            resp = client.patch(
                f"/api/users/me/oauth-accounts/{acct.id}",
                json={"show_on_profile": False},
            )
        assert resp.status_code == 200
        assert resp.get_json()["show_on_profile"] is False

    def test_update_not_found(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.patch(
                "/api/users/me/oauth-accounts/nonexistent",
                json={"show_on_profile": True},
            )
        assert resp.status_code == 404

    def test_cannot_update_other_users_account(self, client, db_session, mock_auth, sample_user):
        user, acct = _user_with_account(db_session)
        with mock_auth(sample_user.id):
            resp = client.patch(
                f"/api/users/me/oauth-accounts/{acct.id}",
                json={"show_on_profile": False},
            )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /api/users/me/oauth-accounts/<id>
# ---------------------------------------------------------------------------


class TestDeleteOAuthAccount:
    @patch("app.routes.oauth.unsubscribe_twitch_user", create=True)
    @patch("app.routes.oauth.unsubscribe_youtube_user", create=True)
    def test_delete_account_keeps_at_least_one(self, mock_yt, mock_tw, client, db_session, mock_auth):
        user, acct = _user_with_account(db_session)
        with mock_auth(user.id):
            resp = client.delete(f"/api/users/me/oauth-accounts/{acct.id}")
        assert resp.status_code == 400
        assert "最後一個" in resp.get_json()["error"]

    @patch("app.routes.oauth.unsubscribe_twitch_user", create=True)
    @patch("app.routes.oauth.unsubscribe_youtube_user", create=True)
    def test_delete_with_two_accounts(self, mock_yt, mock_tw, client, db_session, mock_auth):
        user, acct1 = _user_with_account(db_session, provider="youtube")
        acct2 = OAuthAccount(
            user_id=user.id,
            provider="twitch",
            provider_account_id="tw-del-test",
            provider_display_name="TwitchCh",
        )
        db_session.add(acct2)
        db_session.flush()

        with mock_auth(user.id):
            resp = client.delete(f"/api/users/me/oauth-accounts/{acct2.id}")
        assert resp.status_code == 200
        assert resp.get_json()["ok"] is True

    def test_delete_not_found(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.delete("/api/users/me/oauth-accounts/nonexistent")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/users/me/resubscribe
# ---------------------------------------------------------------------------


class TestResubscribe:
    @patch("app.routes.oauth.subscribe_youtube_user", create=True)
    def test_resubscribe_youtube(self, mock_sub, client, db_session, mock_auth):
        user, acct = _user_with_account(db_session, provider="youtube")
        with mock_auth(user.id):
            resp = client.post("/api/users/me/resubscribe", json={"account_id": acct.id})
        assert resp.status_code == 200

    def test_resubscribe_missing_account_id(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.post("/api/users/me/resubscribe", json={})
        assert resp.status_code == 400

    def test_resubscribe_not_found(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.post("/api/users/me/resubscribe", json={"account_id": "nonexistent"})
        assert resp.status_code == 404
