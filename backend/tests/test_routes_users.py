"""Route integration tests for /api/users — profile CRUD, appeal flow."""

from app.models import OAuthAccount, User

# ---------------------------------------------------------------------------
# GET /api/users/me — Current user profile
# ---------------------------------------------------------------------------


class TestGetMe:
    def test_get_me_authenticated(self, client, db_session, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.get("/api/users/me")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["id"] == sample_user.id
        assert data["display_name"] == "TestUser"

    def test_get_me_unauthenticated(self, client):
        resp = client.get("/api/users/me")
        assert resp.status_code == 401

    def test_get_me_user_not_in_db(self, client, db_session, mock_auth):
        """Authenticated but user record doesn't exist yet."""
        with mock_auth("nonexistent-user-id"):
            resp = client.get("/api/users/me")
        # Should return 404 or create — depends on implementation
        assert resp.status_code in (404, 200)


# ---------------------------------------------------------------------------
# PATCH /api/users/me — Update profile
# ---------------------------------------------------------------------------


class TestUpdateMe:
    def test_update_display_name(self, client, db_session, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.patch(
                "/api/users/me",
                json={
                    "display_name": "NewName",
                },
            )
        assert resp.status_code == 200
        assert resp.get_json()["display_name"] == "NewName"

    def test_update_bio(self, client, db_session, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.patch(
                "/api/users/me",
                json={
                    "bio": "I am a cat VTuber!",
                },
            )
        assert resp.status_code == 200
        assert resp.get_json()["bio"] == "I am a cat VTuber!"

    def test_update_country_flags(self, client, db_session, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.patch(
                "/api/users/me",
                json={
                    "country_flags": ["TW", "JP"],
                },
            )
        assert resp.status_code == 200
        assert resp.get_json()["country_flags"] == ["TW", "JP"]

    def test_update_social_links(self, client, db_session, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.patch(
                "/api/users/me",
                json={
                    "social_links": {"twitter": "https://twitter.com/test"},
                },
            )
        assert resp.status_code == 200
        assert "twitter" in resp.get_json()["social_links"]

    def test_update_profile_data(self, client, db_session, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.patch(
                "/api/users/me",
                json={
                    "profile_data": {"gender": "female", "activity_status": "active"},
                },
            )
        assert resp.status_code == 200
        pd = resp.get_json()["profile_data"]
        assert pd["gender"] == "female"

    def test_update_unauthenticated(self, client):
        resp = client.patch("/api/users/me", json={"display_name": "Hacked"})
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# GET /api/users/<user_id> — Public profile
# ---------------------------------------------------------------------------


class TestGetUserById:
    def test_get_public_profile(self, client, db_session, sample_user):
        resp = client.get(f"/api/users/{sample_user.id}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["id"] == sample_user.id

    def test_get_nonexistent_user(self, client, db_session):
        resp = client.get("/api/users/nonexistent-user-id")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/users/me/appeal — Visibility appeal
# ---------------------------------------------------------------------------


class TestAppeal:
    def test_appeal_when_hidden(self, client, db_session, mock_auth):
        user = User(id="user-hidden", display_name="Hidden", role="user", visibility="hidden")
        db_session.add(user)
        db_session.flush()

        with mock_auth(user.id):
            resp = client.post(
                "/api/users/me/appeal",
                json={
                    "appeal_note": "I am actually a VTuber, here is my proof.",
                },
            )
        assert resp.status_code == 200
        db_session.refresh(user)
        assert user.visibility == "pending_review"
        assert user.appeal_note is not None

    def test_appeal_when_visible(self, client, db_session, mock_auth, sample_user):
        """Visible users should not be able to appeal."""
        with mock_auth(sample_user.id):
            resp = client.post(
                "/api/users/me/appeal",
                json={
                    "appeal_note": "No need to appeal",
                },
            )
        assert resp.status_code in (400, 403, 409)

    def test_appeal_requires_note(self, client, db_session, mock_auth):
        user = User(id="user-hidden2", display_name="Hidden2", role="user", visibility="hidden")
        db_session.add(user)
        db_session.flush()

        with mock_auth(user.id):
            resp = client.post("/api/users/me/appeal", json={})
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# GET /api/users/me/oauth-accounts
# ---------------------------------------------------------------------------


class TestOAuthAccounts:
    def test_list_oauth_accounts(self, client, db_session, mock_auth, sample_user):
        oauth = OAuthAccount(
            user_id=sample_user.id,
            provider="youtube",
            provider_account_id="YT-TEST-001",
            provider_display_name="Test Channel",
        )
        db_session.add(oauth)
        db_session.flush()

        with mock_auth(sample_user.id):
            resp = client.get("/api/users/me/oauth-accounts")
        assert resp.status_code == 200
        accounts = resp.get_json()
        assert len(accounts) == 1
        assert accounts[0]["provider"] == "youtube"

    def test_list_oauth_requires_auth(self, client):
        resp = client.get("/api/users/me/oauth-accounts")
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# GET /api/users/recent
# ---------------------------------------------------------------------------


class TestRecentUsers:
    def test_recent_users(self, client, db_session, sample_user):
        resp = client.get("/api/users/recent")
        assert resp.status_code == 200
        data = resp.get_json()
        # Should return a list
        assert isinstance(data, list | dict)
