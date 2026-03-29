"""Route integration tests for /api/fictional-species — list, requests CRUD."""

import sys
from unittest.mock import MagicMock, patch

# Stub 'resend' module which may not be installed in test environment
if "resend" not in sys.modules:
    sys.modules["resend"] = MagicMock()

from app.models import FictionalSpecies, FictionalSpeciesRequest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _fictional(db_session, name="Dragon", origin="Western", path="Western|Dragon"):
    fs = FictionalSpecies(name=name, name_zh=name, origin=origin, category_path=path)
    db_session.add(fs)
    db_session.flush()
    return fs


# ---------------------------------------------------------------------------
# GET /api/fictional-species
# ---------------------------------------------------------------------------


class TestListFictionalSpecies:
    def test_list_all(self, client, db_session):
        _fictional(db_session, name="Dragon", origin="Western")
        _fictional(db_session, name="Kitsune", origin="Eastern", path="Eastern|Kitsune")

        resp = client.get("/api/fictional-species")
        assert resp.status_code == 200
        assert len(resp.get_json()["species"]) == 2

    def test_filter_by_origin(self, client, db_session):
        _fictional(db_session, name="Dragon", origin="Western")
        _fictional(db_session, name="Kitsune", origin="Eastern", path="Eastern|Kitsune")

        resp = client.get("/api/fictional-species?origin=Eastern")
        species = resp.get_json()["species"]
        assert len(species) == 1
        assert species[0]["name"] == "Kitsune"

    def test_empty_list(self, client):
        resp = client.get("/api/fictional-species")
        assert resp.get_json()["species"] == []


# ---------------------------------------------------------------------------
# POST /api/fictional-species/requests
# ---------------------------------------------------------------------------


class TestCreateRequest:
    def test_create_request(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            with patch("app.routes.fictional.notify_new_fictional_request", create=True):
                resp = client.post(
                    "/api/fictional-species/requests",
                    json={
                        "name_zh": "九尾狐",
                        "name_en": "Nine-tailed Fox",
                        "suggested_origin": "東方神話",
                        "description": "日本傳說中的妖狐，擁有九條尾巴，能幻化人形。",
                    },
                )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["name_zh"] == "九尾狐"
        assert data["status"] == "pending"

    def test_name_zh_required(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.post("/api/fictional-species/requests", json={"name_en": "Test"})
        assert resp.status_code == 400

    def test_name_zh_too_long(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.post(
                "/api/fictional-species/requests",
                json={"name_zh": "A" * 31},
            )
        assert resp.status_code == 400

    def test_unauthenticated_rejected(self, client):
        resp = client.post("/api/fictional-species/requests", json={"name_zh": "test"})
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# GET /api/fictional-species/requests (admin)
# ---------------------------------------------------------------------------


class TestListRequests:
    def test_list_by_status(self, client, db_session, mock_auth, admin_user, sample_user):
        req = FictionalSpeciesRequest(user_id=sample_user.id, name_zh="龍", status="pending")
        db_session.add(req)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.get("/api/fictional-species/requests")
        assert resp.status_code == 200
        assert len(resp.get_json()["requests"]) == 1

    def test_invalid_status_returns_400(self, client, mock_auth, admin_user):
        with mock_auth(admin_user.id):
            resp = client.get("/api/fictional-species/requests?status=invalid")
        assert resp.status_code == 400

    def test_non_admin_rejected(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.get("/api/fictional-species/requests")
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# PATCH /api/fictional-species/requests/<id> (admin)
# ---------------------------------------------------------------------------


class TestUpdateRequest:
    @patch("app.services.notifications.create_notification")
    def test_update_status(self, mock_notify, client, db_session, mock_auth, admin_user, sample_user):
        req = FictionalSpeciesRequest(user_id=sample_user.id, name_zh="龍", status="pending")
        db_session.add(req)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.patch(
                f"/api/fictional-species/requests/{req.id}",
                json={"status": "completed", "admin_note": "已新增"},
            )
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "completed"

    @patch("app.services.notifications.create_notification")
    def test_invalid_status(self, mock_notify, client, db_session, mock_auth, admin_user, sample_user):
        req = FictionalSpeciesRequest(user_id=sample_user.id, name_zh="龍")
        db_session.add(req)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.patch(
                f"/api/fictional-species/requests/{req.id}",
                json={"status": "invalid"},
            )
        assert resp.status_code == 400

    def test_not_found(self, client, mock_auth, admin_user):
        with mock_auth(admin_user.id):
            resp = client.patch("/api/fictional-species/requests/99999", json={"status": "completed"})
        assert resp.status_code == 404
