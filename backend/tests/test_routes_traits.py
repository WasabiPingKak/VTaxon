"""Route integration tests for /api/traits — CRUD, rank validation, conflict detection."""

from unittest.mock import patch

from app.models import Breed, FictionalSpecies, SpeciesCache, User, VtuberTrait

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
        with mock_auth(sample_user.id):
            with patch("app.services.traits.get_species", return_value=None):
                resp = client.post("/api/traits", json={"taxon_id": 99999})
        assert resp.status_code == 404

    def test_create_with_breed_id(self, client, db_session, mock_auth, sample_user):
        """Creating a trait with a valid breed_id should succeed."""
        _species(db_session, 6000, path="1|6000")
        breed = Breed(taxon_id=6000, name_en="Shiba Inu", name_zh="柴犬")
        db_session.add(breed)
        db_session.flush()

        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={"taxon_id": 6000, "breed_id": breed.id})
        assert resp.status_code == 201
        assert resp.get_json()["breed_id"] == breed.id

    def test_create_with_invalid_breed_returns_404(self, client, db_session, mock_auth, sample_user):
        """Breed not found should return 404."""
        _species(db_session, 6001, path="1|6001")
        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={"taxon_id": 6001, "breed_id": 99999})
        assert resp.status_code == 404

    def test_create_breed_wrong_taxon_returns_400(self, client, db_session, mock_auth, sample_user):
        """Breed belonging to a different species should be rejected."""
        _species(db_session, 6002, path="1|6002", name="Canis lupus")
        _species(db_session, 6003, path="1|6003", name="Felis catus")
        breed = Breed(taxon_id=6003, name_en="Persian", name_zh="波斯貓")
        db_session.add(breed)
        db_session.flush()

        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={"taxon_id": 6002, "breed_id": breed.id})
        assert resp.status_code == 400

    def test_create_fictional_duplicate_blocked(self, client, db_session, mock_auth, sample_user):
        """Adding the same fictional species twice should be blocked."""
        fs = _fictional(db_session, name="Phoenix", path="Eastern|Phoenix")
        trait = VtuberTrait(user_id=sample_user.id, fictional_species_id=fs.id)
        db_session.add(trait)
        db_session.flush()

        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={"fictional_species_id": fs.id})
        assert resp.status_code == 409

    def test_create_fictional_descendant_replaces_ancestor(self, client, db_session, mock_auth, sample_user):
        """More-specific fictional species should replace ancestor."""
        ancestor = _fictional(db_session, name="Eastern", path="Eastern")
        descendant = _fictional(db_session, name="Kitsune", path="Eastern|Kitsune")

        trait = VtuberTrait(user_id=sample_user.id, fictional_species_id=ancestor.id)
        db_session.add(trait)
        db_session.flush()
        old_id = trait.id

        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={"fictional_species_id": descendant.id})
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["replaced"]["replaced_trait_id"] == old_id

    def test_create_fictional_ancestor_blocked(self, client, db_session, mock_auth, sample_user):
        """Less-specific fictional ancestor should be blocked."""
        ancestor = _fictional(db_session, name="Western", path="Western")
        descendant = _fictional(db_session, name="Dragon", path="Western|Dragon")

        trait = VtuberTrait(user_id=sample_user.id, fictional_species_id=descendant.id)
        db_session.add(trait)
        db_session.flush()

        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={"fictional_species_id": ancestor.id})
        assert resp.status_code == 409
        assert resp.get_json()["code"] == "ancestor_blocked"

    def test_create_fictional_not_found(self, client, db_session, mock_auth, sample_user):
        """Non-existent fictional species should return 404."""
        with mock_auth(sample_user.id):
            resp = client.post("/api/traits", json={"fictional_species_id": 99999})
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

    def test_update_breed_id(self, client, db_session, mock_auth, sample_user):
        """Updating breed_id should clear breed_name."""
        _species(db_session, 8010, path="1|8010")
        breed = Breed(taxon_id=8010, name_en="Corgi", name_zh="柯基")
        db_session.add(breed)
        db_session.flush()

        trait = VtuberTrait(user_id=sample_user.id, taxon_id=8010, breed_name="old name")
        db_session.add(trait)
        db_session.flush()

        with mock_auth(sample_user.id):
            resp = client.patch(f"/api/traits/{trait.id}", json={"breed_id": breed.id})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["breed_id"] == breed.id

    def test_update_breed_name(self, client, db_session, mock_auth, sample_user):
        """Updating breed_name (free text) should work."""
        _species(db_session, 8011, path="1|8011")
        trait = VtuberTrait(user_id=sample_user.id, taxon_id=8011)
        db_session.add(trait)
        db_session.flush()

        with mock_auth(sample_user.id):
            resp = client.patch(f"/api/traits/{trait.id}", json={"breed_name": "Calico"})
        assert resp.status_code == 200

    def test_update_fictional_trait_invalidates_fictional_cache(self, client, db_session, mock_auth, sample_user):
        """Updating a fictional trait should invalidate the fictional tree cache."""
        fs = _fictional(db_session)
        trait = VtuberTrait(user_id=sample_user.id, fictional_species_id=fs.id)
        db_session.add(trait)
        db_session.flush()

        with mock_auth(sample_user.id):
            with patch("app.services.traits.invalidate_fictional_tree_cache") as mock_inv:
                resp = client.patch(f"/api/traits/{trait.id}", json={"trait_note": "mythical"})
        assert resp.status_code == 200
        mock_inv.assert_called_once()


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

    def test_delete_clears_live_primary_real(self, client, db_session, mock_auth):
        """Deleting a trait that is set as live_primary_real_trait_id should clear it."""
        user = User(id="user-primary-test", display_name="PrimTest", role="user")
        db_session.add(user)
        _species(db_session, 8200, path="1|8200")
        trait = VtuberTrait(user_id=user.id, taxon_id=8200)
        db_session.add(trait)
        db_session.flush()

        user.live_primary_real_trait_id = trait.id
        db_session.flush()

        with mock_auth(user.id):
            resp = client.delete(f"/api/traits/{trait.id}")
        assert resp.status_code == 200
        db_session.refresh(user)
        assert user.live_primary_real_trait_id is None

    def test_delete_clears_live_primary_fictional(self, client, db_session, mock_auth):
        """Deleting a fictional trait that is live_primary should clear it."""
        user = User(id="user-fict-del", display_name="FictDel", role="user")
        db_session.add(user)
        fs = _fictional(db_session)
        trait = VtuberTrait(user_id=user.id, fictional_species_id=fs.id)
        db_session.add(trait)
        db_session.flush()

        user.live_primary_fictional_trait_id = trait.id
        db_session.flush()

        with mock_auth(user.id):
            resp = client.delete(f"/api/traits/{trait.id}")
        assert resp.status_code == 200
        db_session.refresh(user)
        assert user.live_primary_fictional_trait_id is None
