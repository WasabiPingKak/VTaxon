"""Route integration tests for /api/species — search, match, children, name reports."""

import json
from unittest.mock import patch

from app.models import SpeciesCache, SpeciesNameReport
from app.services.circuit_breaker import CircuitOpenError

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _species(db_session, taxon_id, name="Test sp.", zh=None, **kw):
    sp = SpeciesCache(
        taxon_id=taxon_id,
        scientific_name=name,
        common_name_zh=zh,
        taxon_rank=kw.get("rank", "SPECIES"),
        taxon_path=kw.get("path", str(taxon_id)),
    )
    db_session.add(sp)
    db_session.flush()
    return sp


# ---------------------------------------------------------------------------
# GET /api/species/search
# ---------------------------------------------------------------------------


class TestSearch:
    @patch("app.routes.species.search_species", return_value=[{"taxon_id": 1, "scientific_name": "Felis catus"}])
    def test_search_returns_results(self, mock_search, client):
        resp = client.get("/api/species/search?q=felis")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["results"]) == 1
        mock_search.assert_called_once_with("felis", limit=10)

    def test_search_missing_q_returns_400(self, client):
        resp = client.get("/api/species/search")
        assert resp.status_code == 400

    @patch("app.routes.species.search_species", return_value=[])
    def test_search_respects_limit(self, mock_search, client):
        resp = client.get("/api/species/search?q=test&limit=30")
        assert resp.status_code == 200
        mock_search.assert_called_once_with("test", limit=30)

    @patch("app.routes.species.search_species", return_value=[])
    def test_search_caps_limit_at_50(self, mock_search, client):
        resp = client.get("/api/species/search?q=test&limit=999")
        assert resp.status_code == 200
        mock_search.assert_called_once_with("test", limit=50)

    @patch("app.routes.species.search_species", side_effect=CircuitOpenError("gbif", 30.0))
    def test_search_circuit_open_returns_503(self, mock_search, client):
        resp = client.get("/api/species/search?q=felis")
        assert resp.status_code == 503
        data = resp.get_json()
        assert "過載" in data["error"]


# ---------------------------------------------------------------------------
# GET /api/species/search/stream
# ---------------------------------------------------------------------------


class TestSearchStream:
    @patch("app.routes.species.search_species_stream")
    def test_stream_returns_ndjson(self, mock_stream, client):
        mock_stream.return_value = iter(['{"taxon_id":1}\n', '{"taxon_id":2}\n'])
        resp = client.get("/api/species/search/stream?q=cat")
        assert resp.status_code == 200
        assert resp.content_type == "application/x-ndjson"
        lines = resp.data.decode().strip().split("\n")
        assert len(lines) == 2

    def test_stream_missing_q_returns_400(self, client):
        resp = client.get("/api/species/search/stream")
        assert resp.status_code == 400

    @patch("app.routes.species.search_species_stream", side_effect=CircuitOpenError("gbif", 30.0))
    def test_stream_circuit_open_returns_error_line(self, mock_stream, client):
        resp = client.get("/api/species/search/stream?q=cat")
        assert resp.status_code == 200  # streaming always starts 200
        lines = resp.data.decode().strip().split("\n")
        error_obj = json.loads(lines[-1])
        assert "過載" in error_obj["error"]


# ---------------------------------------------------------------------------
# GET /api/species/match
# ---------------------------------------------------------------------------


class TestMatch:
    @patch(
        "app.routes.species.match_species",
        return_value={"taxon_id": 9685, "scientific_name": "Felis catus", "match_type": "EXACT", "confidence": 99},
    )
    def test_match_returns_result(self, mock_match, client):
        resp = client.get("/api/species/match?name=Felis catus")
        assert resp.status_code == 200
        assert resp.get_json()["taxon_id"] == 9685

    @patch("app.routes.species.match_species", return_value=None)
    def test_match_not_found(self, mock_match, client):
        resp = client.get("/api/species/match?name=Nonexistent")
        assert resp.status_code == 404

    def test_match_missing_name_returns_400(self, client):
        resp = client.get("/api/species/match")
        assert resp.status_code == 400

    @patch("app.routes.species.match_species", side_effect=CircuitOpenError("gbif", 30.0))
    def test_match_circuit_open_returns_503(self, mock_match, client):
        resp = client.get("/api/species/match?name=Felis")
        assert resp.status_code == 503
        assert "過載" in resp.get_json()["error"]


# ---------------------------------------------------------------------------
# GET /api/species/<taxon_id>
# ---------------------------------------------------------------------------


class TestGetOne:
    @patch("app.routes.species.get_species", return_value={"taxon_id": 100, "scientific_name": "Canis lupus"})
    def test_get_existing_species(self, mock_get, client):
        resp = client.get("/api/species/100")
        assert resp.status_code == 200
        assert resp.get_json()["taxon_id"] == 100

    @patch("app.routes.species.get_species", return_value=None)
    def test_get_nonexistent_returns_404(self, mock_get, client):
        resp = client.get("/api/species/999999")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# GET /api/species/<taxon_id>/children
# ---------------------------------------------------------------------------


class TestGetChildren:
    @patch("app.routes.species.get_subspecies", return_value=[{"taxon_id": 200}])
    def test_get_children(self, mock_sub, client):
        resp = client.get("/api/species/100/children")
        assert resp.status_code == 200
        assert len(resp.get_json()["results"]) == 1

    @patch("app.routes.species.get_subspecies_stream")
    def test_get_children_stream(self, mock_stream, client):
        mock_stream.return_value = iter(['{"taxon_id":201}\n'])
        resp = client.get("/api/species/100/children/stream")
        assert resp.status_code == 200
        assert resp.content_type == "application/x-ndjson"

    @patch("app.routes.species.get_subspecies", side_effect=CircuitOpenError("gbif", 30.0))
    def test_children_circuit_open_returns_503(self, mock_sub, client):
        resp = client.get("/api/species/100/children")
        assert resp.status_code == 503
        assert "過載" in resp.get_json()["error"]

    @patch("app.routes.species.get_subspecies_stream", side_effect=CircuitOpenError("gbif", 30.0))
    def test_children_stream_circuit_open_returns_error_line(self, mock_stream, client):
        resp = client.get("/api/species/100/children/stream")
        assert resp.status_code == 200
        lines = resp.data.decode().strip().split("\n")
        error_obj = json.loads(lines[-1])
        assert "過載" in error_obj["error"]


# ---------------------------------------------------------------------------
# POST /api/species/cache/clear
# ---------------------------------------------------------------------------


class TestCacheClear:
    @patch("app.routes.species.clear_chinese_name_caches")
    def test_admin_can_clear_all(self, mock_clear, client, db_session, mock_auth, admin_user):
        _species(db_session, 1000, zh="貓")
        with mock_auth(admin_user.id):
            resp = client.post("/api/species/cache/clear")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["lru_caches_cleared"] is True
        assert data["scope"] == "all"

    def test_non_admin_rejected(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.post("/api/species/cache/clear")
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# POST /api/species/name-reports
# ---------------------------------------------------------------------------


class TestNameReports:
    def test_create_report(self, client, db_session, mock_auth, sample_user):
        _species(db_session, 9685, name="Felis catus", zh="貓")
        with mock_auth(sample_user.id):
            resp = client.post(
                "/api/species/name-reports",
                json={
                    "taxon_id": 9685,
                    "report_type": "wrong_zh",
                    "suggested_name_zh": "家貓",
                },
            )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["report_type"] == "wrong_zh"
        assert data["suggested_name_zh"] == "家貓"

    def test_create_report_unauthenticated(self, client):
        resp = client.post(
            "/api/species/name-reports",
            json={"taxon_id": 1, "report_type": "missing_zh", "suggested_name_zh": "test"},
        )
        assert resp.status_code == 401

    def test_create_report_missing_fields(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.post("/api/species/name-reports", json={})
        assert resp.status_code == 400

    def test_create_not_found_requires_description(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.post(
                "/api/species/name-reports",
                json={"report_type": "not_found", "suggested_name_zh": "獨角獸"},
            )
        assert resp.status_code == 400

    def test_list_reports_admin(self, client, db_session, mock_auth, admin_user, sample_user):
        report = SpeciesNameReport(
            user_id=sample_user.id,
            report_type="missing_zh",
            suggested_name_zh="貓",
        )
        db_session.add(report)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.get("/api/species/name-reports")
        assert resp.status_code == 200
        assert len(resp.get_json()["reports"]) == 1

    def test_list_reports_non_admin_rejected(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.get("/api/species/name-reports")
        assert resp.status_code == 403

    @patch("app.services.notifications.create_notification")
    def test_update_report_admin(self, mock_notify, client, db_session, mock_auth, admin_user, sample_user):
        report = SpeciesNameReport(
            user_id=sample_user.id,
            report_type="missing_zh",
            suggested_name_zh="貓",
        )
        db_session.add(report)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.patch(
                f"/api/species/name-reports/{report.id}",
                json={"status": "approved", "admin_note": "已修正"},
            )
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "approved"
