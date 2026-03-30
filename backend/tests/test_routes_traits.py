"""Route integration tests for /api/traits — CRUD, rank validation, conflict detection."""

from app.models import FictionalSpecies, SpeciesCache, VtuberTrait

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _species(db_session, taxon_id, rank="SPECIES", path=None, name="Test sp."):
    sp = SpeciesCache(
        taxon_id=taxon_id,
        scientific_name=name,
        taxon_rank=rank,
        taxon_path=path or str(taxon_id),
    )
    db_session.add(sp)
    db_session.flush()
    return sp


def _fictional(db_session, name="Dragon", path="Western|Dragon"):
    fs = FictionalSpecies(name=name, name_zh=name, origin="Western", category_path=path)
    db_session.add(fs)
    db_session.flush()
    return fs


# ---------------------------------------------------------------------------
# POST /api/traits — Create
# ---------------------------------------------------------------------------


class TestCreateTrait:
    def test_create_with_taxon_id(self, client, db_session, mock_auth, sample_user):
        _species(db_session, 9999, path="1|2|9999")
        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={"taxon_id": 9999})
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["taxon_id"] == 9999
        assert data["user_id"] == sample_user.id

    def test_create_with_fictional_species(self, client, db_session, mock_auth, sample_user):
        fs = _fictional(db_session)
        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={"fictional_species_id": fs.id})
        assert resp.status_code == 201
        assert resp.get_json()["fictional_species_id"] == fs.id

    def test_create_requires_species_or_fictional(self, client, db_session, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={})
        assert resp.status_code == 400

    def test_create_rejects_unauthenticated(self, client):
        resp = client.post("/api/traits", json={"taxon_id": 1})
        assert resp.status_code == 401

    def test_create_blocks_high_rank(self, client, db_session, mock_auth, sample_user):
        """Kingdom/Phylum/Superclass ranks should be rejected."""
        _species(db_session, 1000, rank="KINGDOM", path="1000")
        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={"taxon_id": 1000})
        assert resp.status_code == 400
        assert resp.get_json()["code"] == "rank_not_allowed"

    def test_create_blocks_duplicate(self, client, db_session, mock_auth, sample_user):
        _species(db_session, 5000, path="1|5000")
        trait = VtuberTrait(user_id=sample_user.id, taxon_id=5000)
        db_session.add(trait)
        db_session.flush()

        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={"taxon_id": 5000})
        assert resp.status_code == 409

    def test_create_descendant_replaces_ancestor(self, client, db_session, mock_auth, sample_user):
        """Adding a more-specific species should replace the existing ancestor."""
        _species(db_session, 100, rank="FAMILY", path="1|100", name="Canidae")
        _species(db_session, 200, rank="SPECIES", path="1|100|200", name="Canis lupus")

        # Add ancestor trait first
        trait = VtuberTrait(user_id=sample_user.id, taxon_id=100)
        db_session.add(trait)
        db_session.flush()
        old_trait_id = trait.id

        # Add descendant — should replace ancestor
        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={"taxon_id": 200})
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["taxon_id"] == 200
        assert data["replaced"]["replaced_trait_id"] == old_trait_id

    def test_create_ancestor_blocked_by_descendant(self, client, db_session, mock_auth, sample_user):
        """Adding a less-specific ancestor should be blocked."""
        _species(db_session, 300, rank="FAMILY", path="1|300", name="Felidae")
        _species(db_session, 400, rank="SPECIES", path="1|300|400", name="Felis catus")

        # Add the more-specific trait first
        trait = VtuberTrait(user_id=sample_user.id, taxon_id=400)
        db_session.add(trait)
        db_session.flush()

        # Try to add ancestor — should be blocked
        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={"taxon_id": 300})
        assert resp.status_code == 409
        assert resp.get_json()["code"] == "ancestor_blocked"

    def test_create_fetches_from_gbif_if_not_cached(self, client, db_session, mock_auth, sample_user):
        """If species not in cache, should try GBIF and return 404 if not found."""
        from unittest.mock import patch

        with mock_auth(sample_user.id):
            with patch("app.services.traits.get_species", return_value=None):
                resp = client.post("/api/traits", json={"taxon_id": 99999})
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# GET /api/traits — List
# ---------------------------------------------------------------------------


class TestListTraits:
    def test_list_requires_user_id(self, client):
        resp = client.get("/api/traits")
        assert resp.status_code == 400

    def test_list_returns_user_traits(self, client, db_session, sample_user):
        _species(db_session, 7000, path="1|7000")
        trait = VtuberTrait(user_id=sample_user.id, taxon_id=7000)
        db_session.add(trait)
        db_session.flush()

        resp = client.get(f"/api/traits?user_id={sample_user.id}")
        assert resp.status_code == 200
        traits = resp.get_json()["traits"]
        assert len(traits) == 1
        assert traits[0]["taxon_id"] == 7000

    def test_list_empty_for_unknown_user(self, client, db_session):
        resp = client.get("/api/traits?user_id=nonexistent")
        assert resp.status_code == 200
        assert resp.get_json()["traits"] == []


# ---------------------------------------------------------------------------
# PATCH /api/traits/<id> — Update
# ---------------------------------------------------------------------------


class TestUpdateTrait:
    def test_update_trait_note(self, client, db_session, mock_auth, sample_user):
        _species(db_session, 8000, path="1|8000")
        trait = VtuberTrait(user_id=sample_user.id, taxon_id=8000)
        db_session.add(trait)
        db_session.flush()

        with mock_auth(sample_user.id):
            resp = client.patch(f"/api/traits/{trait.id}", json={"trait_note": "fluffy tail"})
        assert resp.status_code == 200
        assert resp.get_json()["trait_note"] == "fluffy tail"

    def test_update_rejects_other_user(self, client, db_session, mock_auth, sample_user):
        _species(db_session, 8001, path="1|8001")
        trait = VtuberTrait(user_id=sample_user.id, taxon_id=8001)
        db_session.add(trait)
        db_session.flush()

        with mock_auth("other-user-id"):
            resp = client.patch(f"/api/traits/{trait.id}", json={"trait_note": "hack"})
        assert resp.status_code == 403

    def test_update_nonexistent_returns_404(self, client, db_session, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.patch("/api/traits/nonexistent-id", json={"trait_note": "x"})
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /api/traits/<id>
# ---------------------------------------------------------------------------


class TestDeleteTrait:
    def test_delete_own_trait(self, client, db_session, mock_auth, sample_user):
        _species(db_session, 8100, path="1|8100")
        trait = VtuberTrait(user_id=sample_user.id, taxon_id=8100)
        db_session.add(trait)
        db_session.flush()
        trait_id = trait.id

        with mock_auth(sample_user.id):
            resp = client.delete(f"/api/traits/{trait_id}")
        assert resp.status_code == 200

    def test_delete_rejects_other_user(self, client, db_session, mock_auth, sample_user):
        _species(db_session, 8101, path="1|8101")
        trait = VtuberTrait(user_id=sample_user.id, taxon_id=8101)
        db_session.add(trait)
        db_session.flush()

        with mock_auth("other-user-id"):
            resp = client.delete(f"/api/traits/{trait.id}")
        assert resp.status_code == 403

    def test_delete_nonexistent_returns_404(self, client, db_session, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.delete("/api/traits/nonexistent-id")
        assert resp.status_code == 404
