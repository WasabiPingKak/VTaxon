"""Route integration tests for /api/breeds — CRUD, search, and breed requests."""

import sys
from unittest.mock import MagicMock, patch

# Stub 'resend' module which may not be installed in test environment
if "resend" not in sys.modules:
    sys.modules["resend"] = MagicMock()

from app.models import Breed, BreedRequest, SpeciesCache

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _species(db_session, taxon_id, name="Test sp.", zh=None):
    sp = SpeciesCache(
        taxon_id=taxon_id,
        scientific_name=name,
        common_name_zh=zh,
        taxon_rank="SPECIES",
        taxon_path=str(taxon_id),
    )
    db_session.add(sp)
    db_session.flush()
    return sp


def _breed(db_session, taxon_id, name_en, name_zh=None, group=None):
    b = Breed(taxon_id=taxon_id, name_en=name_en, name_zh=name_zh, breed_group=group)
    db_session.add(b)
    db_session.flush()
    return b


# ---------------------------------------------------------------------------
# GET /api/breeds/categories
# ---------------------------------------------------------------------------


class TestCategories:
    @patch("app.services.gbif.resolve_missing_chinese_name")
    def test_returns_species_with_breeds(self, mock_resolve, client, db_session):
        _species(db_session, 9615, name="Canis lupus familiaris", zh="犬")
        _breed(db_session, 9615, "Golden Retriever", "黃金獵犬")
        _breed(db_session, 9615, "Labrador Retriever", "拉布拉多")

        resp = client.get("/api/breeds/categories")
        assert resp.status_code == 200
        cats = resp.get_json()["categories"]
        assert len(cats) == 1
        assert cats[0]["taxon_id"] == 9615
        assert cats[0]["breed_count"] == 2

    @patch("app.services.gbif.resolve_missing_chinese_name")
    def test_empty_when_no_breeds(self, mock_resolve, client):
        resp = client.get("/api/breeds/categories")
        assert resp.status_code == 200
        assert resp.get_json()["categories"] == []


# ---------------------------------------------------------------------------
# GET /api/breeds?taxon_id=X
# ---------------------------------------------------------------------------


class TestListBreeds:
    def test_list_by_taxon_id(self, client, db_session):
        _species(db_session, 9615, name="Canis lupus familiaris")
        _breed(db_session, 9615, "Shiba Inu", "柴犬")

        resp = client.get("/api/breeds?taxon_id=9615")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["breeds"]) == 1
        assert data["breeds"][0]["name_en"] == "Shiba Inu"
        assert data["species"] is not None

    def test_missing_taxon_id_returns_400(self, client):
        resp = client.get("/api/breeds")
        assert resp.status_code == 400

    def test_empty_result_for_unknown_taxon(self, client, db_session):
        resp = client.get("/api/breeds?taxon_id=99999")
        assert resp.status_code == 200
        assert resp.get_json()["breeds"] == []


# ---------------------------------------------------------------------------
# GET /api/breeds/search
# ---------------------------------------------------------------------------


class TestSearchBreeds:
    def test_search_zh(self, client, db_session):
        _species(db_session, 9615, name="Canis lupus familiaris")
        _breed(db_session, 9615, "Shiba Inu", "柴犬")

        resp = client.get("/api/breeds/search?q=柴")
        assert resp.status_code == 200
        breeds = resp.get_json()["breeds"]
        assert len(breeds) == 1
        assert breeds[0]["name_zh"] == "柴犬"

    def test_search_en(self, client, db_session):
        _species(db_session, 9615, name="Canis lupus familiaris")
        _breed(db_session, 9615, "Shiba Inu", "柴犬")

        resp = client.get("/api/breeds/search?q=shiba")
        assert resp.status_code == 200
        assert len(resp.get_json()["breeds"]) == 1

    def test_search_missing_q_returns_400(self, client):
        resp = client.get("/api/breeds/search")
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# POST /api/breeds (admin)
# ---------------------------------------------------------------------------


class TestCreateBreed:
    def test_admin_creates_breed(self, client, db_session, mock_auth, admin_user):
        _species(db_session, 9615, name="Canis lupus familiaris")
        with mock_auth(admin_user.id):
            resp = client.post(
                "/api/breeds",
                json={"taxon_id": 9615, "name_en": "Corgi", "name_zh": "柯基"},
            )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["name_en"] == "Corgi"
        assert data["name_zh"] == "柯基"

    def test_non_admin_rejected(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.post("/api/breeds", json={"taxon_id": 1, "name_en": "X"})
        assert resp.status_code == 403

    def test_missing_fields_returns_400(self, client, mock_auth, admin_user):
        with mock_auth(admin_user.id):
            resp = client.post("/api/breeds", json={"taxon_id": 1})
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Breed Requests
# ---------------------------------------------------------------------------


class TestBreedRequests:
    def test_create_request(self, client, db_session, mock_auth, sample_user):
        _species(db_session, 9615, name="Canis lupus familiaris")
        with mock_auth(sample_user.id):
            with patch("app.routes.breeds.notify_new_breed_request", create=True):
                resp = client.post(
                    "/api/breeds/requests",
                    json={
                        "taxon_id": 9615,
                        "name_zh": "秋田犬",
                        "name_en": "Akita",
                        "description": "日本大型犬種，毛色有赤、白、虎斑等多種。",
                    },
                )
        assert resp.status_code == 201
        assert resp.get_json()["name_zh"] == "秋田犬"

    def test_create_request_unauthenticated(self, client):
        resp = client.post(
            "/api/breeds/requests",
            json={"name_zh": "X", "name_en": "X", "description": "1234567890"},
        )
        assert resp.status_code == 401

    def test_create_request_missing_description(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.post(
                "/api/breeds/requests",
                json={"name_zh": "秋田犬", "name_en": "Akita"},
            )
        assert resp.status_code == 400

    def test_list_requests_admin(self, client, db_session, mock_auth, admin_user, sample_user):
        _species(db_session, 9615, name="Canis lupus familiaris")
        req = BreedRequest(
            user_id=sample_user.id,
            taxon_id=9615,
            name_zh="秋田犬",
            name_en="Akita",
            description="大型犬種",
        )
        db_session.add(req)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.get("/api/breeds/requests")
        assert resp.status_code == 200
        assert len(resp.get_json()["requests"]) == 1

    def test_list_requests_non_admin_rejected(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.get("/api/breeds/requests")
        assert resp.status_code == 403

    @patch("app.services.notifications.create_notification")
    def test_update_request_admin(self, mock_notify, client, db_session, mock_auth, admin_user, sample_user):
        _species(db_session, 9615, name="Canis lupus familiaris")
        req = BreedRequest(
            user_id=sample_user.id,
            taxon_id=9615,
            name_zh="秋田犬",
            name_en="Akita",
            description="大型犬種",
        )
        db_session.add(req)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.patch(
                f"/api/breeds/requests/{req.id}",
                json={"status": "completed", "admin_note": "已新增"},
            )
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "completed"

    @patch("app.services.notifications.create_notification")
    def test_update_request_invalid_status(self, mock_notify, client, db_session, mock_auth, admin_user, sample_user):
        _species(db_session, 9615, name="Canis lupus familiaris")
        req = BreedRequest(
            user_id=sample_user.id,
            taxon_id=9615,
            name_zh="X",
            name_en="X",
            description="test",
        )
        db_session.add(req)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.patch(f"/api/breeds/requests/{req.id}", json={"status": "invalid"})
        assert resp.status_code == 400

    def test_update_nonexistent_request(self, client, mock_auth, admin_user):
        with mock_auth(admin_user.id):
            resp = client.patch("/api/breeds/requests/99999", json={"status": "completed"})
        assert resp.status_code == 404
