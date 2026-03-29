"""Route integration tests for /api/admin — request counts, exports, transitions, visibility."""

import sys
from unittest.mock import MagicMock, patch

# Stub 'resend' module which may not be installed in test environment
if "resend" not in sys.modules:
    sys.modules["resend"] = MagicMock()

from app.models import BreedRequest, FictionalSpeciesRequest, SpeciesCache

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _fictional_req(db_session, user, status="pending"):
    r = FictionalSpeciesRequest(user_id=user.id, name_zh="龍", status=status)
    db_session.add(r)
    db_session.flush()
    return r


def _breed_req(db_session, user, taxon_id=None, status="pending"):
    r = BreedRequest(
        user_id=user.id,
        taxon_id=taxon_id,
        name_zh="柴犬",
        name_en="Shiba",
        description="test",
        status=status,
    )
    db_session.add(r)
    db_session.flush()
    return r


def _species(db_session, taxon_id):
    sp = SpeciesCache(taxon_id=taxon_id, scientific_name="Test sp.", taxon_rank="SPECIES", taxon_path=str(taxon_id))
    db_session.add(sp)
    db_session.flush()
    return sp


# ---------------------------------------------------------------------------
# GET /api/admin/request-counts
# ---------------------------------------------------------------------------


class TestRequestCounts:
    def test_returns_counts(self, client, db_session, mock_auth, admin_user, sample_user):
        _fictional_req(db_session, sample_user, status="pending")
        _fictional_req(db_session, sample_user, status="received")
        _breed_req(db_session, sample_user, status="pending")

        with mock_auth(admin_user.id):
            resp = client.get("/api/admin/request-counts")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["fictional"]["pending"] == 1
        assert data["fictional"]["received"] == 1
        assert data["breed"]["pending"] == 1

    def test_non_admin_rejected(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.get("/api/admin/request-counts")
        assert resp.status_code == 403

    def test_unauthenticated_rejected(self, client):
        resp = client.get("/api/admin/request-counts")
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# GET /api/admin/export-fictional
# ---------------------------------------------------------------------------


class TestExportFictional:
    def test_exports_received_only(self, client, db_session, mock_auth, admin_user, sample_user):
        _fictional_req(db_session, sample_user, status="received")
        _fictional_req(db_session, sample_user, status="pending")

        with mock_auth(admin_user.id):
            resp = client.get("/api/admin/export-fictional")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["export_metadata"]["total_requests"] == 1
        assert len(data["requests"]) == 1


# ---------------------------------------------------------------------------
# GET /api/admin/export-breeds
# ---------------------------------------------------------------------------


class TestExportBreeds:
    def test_exports_received_with_species_context(self, client, db_session, mock_auth, admin_user, sample_user):
        _species(db_session, 9615)
        _breed_req(db_session, sample_user, taxon_id=9615, status="received")

        with mock_auth(admin_user.id):
            resp = client.get("/api/admin/export-breeds")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["requests"]) == 1
        assert data["requests"][0]["species_context"] is not None


# ---------------------------------------------------------------------------
# POST /api/admin/transition-fictional
# ---------------------------------------------------------------------------


class TestTransitionFictional:
    @patch("app.services.notifications.create_notification")
    def test_transitions_received_to_in_progress(
        self, mock_notify, client, db_session, mock_auth, admin_user, sample_user
    ):
        _fictional_req(db_session, sample_user, status="received")
        _fictional_req(db_session, sample_user, status="received")
        _fictional_req(db_session, sample_user, status="pending")  # should NOT transition

        with mock_auth(admin_user.id):
            resp = client.post("/api/admin/transition-fictional")
        assert resp.status_code == 200
        assert resp.get_json()["updated"] == 2

    def test_non_admin_rejected(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.post("/api/admin/transition-fictional")
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# POST /api/admin/transition-breeds
# ---------------------------------------------------------------------------


class TestTransitionBreeds:
    @patch("app.services.notifications.create_notification")
    def test_transitions_received_to_in_progress(
        self, mock_notify, client, db_session, mock_auth, admin_user, sample_user
    ):
        _breed_req(db_session, sample_user, status="received")

        with mock_auth(admin_user.id):
            resp = client.post("/api/admin/transition-breeds")
        assert resp.status_code == 200
        assert resp.get_json()["updated"] == 1


# ---------------------------------------------------------------------------
# PATCH /api/admin/users/<user_id>/visibility
# ---------------------------------------------------------------------------


class TestSetVisibility:
    def test_hide_user(self, client, db_session, mock_auth, admin_user, sample_user):
        with mock_auth(admin_user.id):
            resp = client.patch(
                f"/api/admin/users/{sample_user.id}/visibility",
                json={"visibility": "hidden", "reason": "違規"},
            )
        assert resp.status_code == 200
        assert resp.get_json()["visibility"] == "hidden"

    def test_restore_user_clears_appeal(self, client, db_session, mock_auth, admin_user, sample_user):
        sample_user.visibility = "hidden"
        sample_user.appeal_note = "我沒有違規"
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.patch(
                f"/api/admin/users/{sample_user.id}/visibility",
                json={"visibility": "visible"},
            )
        assert resp.status_code == 200
        # appeal_note should be cleared
        db_session.refresh(sample_user)
        assert sample_user.appeal_note is None

    def test_invalid_visibility_returns_400(self, client, mock_auth, admin_user, sample_user):
        with mock_auth(admin_user.id):
            resp = client.patch(
                f"/api/admin/users/{sample_user.id}/visibility",
                json={"visibility": "banned"},
            )
        assert resp.status_code == 400

    def test_user_not_found(self, client, mock_auth, admin_user):
        with mock_auth(admin_user.id):
            resp = client.patch(
                "/api/admin/users/nonexistent/visibility",
                json={"visibility": "hidden"},
            )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# GET /api/admin/users/pending-reviews
# ---------------------------------------------------------------------------


class TestPendingReviews:
    def test_returns_pending_review_users(self, client, db_session, mock_auth, admin_user, sample_user):
        sample_user.visibility = "pending_review"
        sample_user.appeal_note = "請再給我一次機會"
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.get("/api/admin/users/pending-reviews")
        assert resp.status_code == 200
        users = resp.get_json()["users"]
        assert len(users) == 1
        assert users[0]["appeal_note"] == "請再給我一次機會"

    def test_empty_when_no_pending(self, client, mock_auth, admin_user):
        with mock_auth(admin_user.id):
            resp = client.get("/api/admin/users/pending-reviews")
        assert resp.get_json()["users"] == []
