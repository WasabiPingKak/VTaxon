"""Route integration tests for /api/taxonomy — tree queries and cache management."""

from unittest.mock import patch

import pytest

from app.cache import invalidate_fictional_tree_cache, invalidate_tree_cache
from app.models import FictionalSpecies, OAuthAccount, SpeciesCache, User, VtuberTrait


@pytest.fixture(autouse=True)
def _clear_tree_cache():
    """Clear taxonomy caches before each test to avoid stale results."""
    invalidate_tree_cache()
    invalidate_fictional_tree_cache()
    yield
    invalidate_tree_cache()
    invalidate_fictional_tree_cache()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _species(db_session, taxon_id, rank="SPECIES", path=None, name="Test sp.", **kw):
    sp = SpeciesCache(
        taxon_id=taxon_id,
        scientific_name=name,
        taxon_rank=rank,
        taxon_path=path or str(taxon_id),
        kingdom=kw.get("kingdom"),
        phylum=kw.get("phylum"),
        class_=kw.get("class_"),
        order_=kw.get("order_"),
        family=kw.get("family"),
        genus=kw.get("genus"),
        path_zh=kw.get("path_zh", {}),
    )
    db_session.add(sp)
    db_session.flush()
    return sp


def _user(db_session, name="TreeUser", role="user"):
    import uuid

    uid = f"user-{uuid.uuid4().hex[:8]}"
    u = User(id=uid, display_name=name, role=role, visibility="visible")
    db_session.add(u)
    db_session.flush()
    return u


def _trait(db_session, user, species=None, fictional=None):
    t = VtuberTrait(
        user_id=user.id,
        taxon_id=species.taxon_id if species else None,
        fictional_species_id=fictional.id if fictional else None,
    )
    db_session.add(t)
    db_session.flush()
    return t


def _fictional(db_session, name="Dragon", origin="Western", path="Western|Dragon"):
    fs = FictionalSpecies(name=name, name_zh=name, origin=origin, category_path=path)
    db_session.add(fs)
    db_session.flush()
    return fs


# ---------------------------------------------------------------------------
# GET /api/taxonomy/tree
# ---------------------------------------------------------------------------


class TestGetTaxonomyTree:
    def test_empty_tree(self, client):
        resp = client.get("/api/taxonomy/tree")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["entries"] == []

    def test_tree_with_trait(self, client, db_session):
        user = _user(db_session)
        sp = _species(
            db_session,
            9685,
            path="Animalia|Chordata|Mammalia|Carnivora|Felidae|Felis|Felis catus",
            name="Felis catus",
            kingdom="Animalia",
            phylum="Chordata",
            class_="Mammalia",
            path_zh={"kingdom": "動物界", "phylum": "脊索動物門"},
        )
        _trait(db_session, user, species=sp)
        db_session.flush()

        resp = client.get("/api/taxonomy/tree")
        assert resp.status_code == 200
        entries = resp.get_json()["entries"]
        assert len(entries) == 1
        entry = entries[0]
        assert entry["user_id"] == user.id
        assert entry["taxon_id"] == 9685
        assert entry["scientific_name"] == "Felis catus"
        assert entry["taxon_path"] is not None
        assert "path_ranks" in entry

    def test_hidden_user_excluded(self, client, db_session):
        """Users with visibility != 'visible' should not appear in tree."""
        user = _user(db_session, name="HiddenUser")
        user.visibility = "hidden"
        sp = _species(db_session, 1001, path="A|B|C|D|E|F|G", name="Hidden sp.")
        _trait(db_session, user, species=sp)
        db_session.flush()

        resp = client.get("/api/taxonomy/tree")
        assert resp.get_json()["entries"] == []

    def test_tree_includes_platforms(self, client, db_session):
        user = _user(db_session)
        sp = _species(db_session, 2000, path="A|B|C|D|E|F|G")
        _trait(db_session, user, species=sp)
        acct = OAuthAccount(
            user_id=user.id,
            provider="youtube",
            provider_account_id="yt-123",
        )
        db_session.add(acct)
        db_session.flush()

        resp = client.get("/api/taxonomy/tree")
        entry = resp.get_json()["entries"][0]
        assert "youtube" in entry["platforms"]

    def test_tree_path_ranks_standard(self, client, db_session):
        """A 7-segment path should produce standard rank labels."""
        user = _user(db_session)
        sp = _species(db_session, 3000, path="A|B|C|D|E|F|G", rank="SPECIES")
        _trait(db_session, user, species=sp)
        db_session.flush()

        resp = client.get("/api/taxonomy/tree")
        entry = resp.get_json()["entries"][0]
        assert entry["path_ranks"] == [
            "KINGDOM",
            "PHYLUM",
            "CLASS",
            "ORDER",
            "FAMILY",
            "GENUS",
            "SPECIES",
        ]

    def test_is_live_primary_auto_assigned(self, client, db_session):
        """Users without explicit live_primary should have first entry auto-assigned."""
        user = _user(db_session)
        sp = _species(db_session, 4000, path="A|B|C|D|E|F|G")
        _trait(db_session, user, species=sp)
        db_session.flush()

        resp = client.get("/api/taxonomy/tree")
        entry = resp.get_json()["entries"][0]
        assert entry["is_live_primary"] is True

    @patch("app.routes.taxonomy._build_path_zh", return_value={"kingdom": "動物界"})
    def test_auto_rebuild_path_zh(self, mock_build, client, db_session):
        """Empty path_zh should trigger auto-rebuild."""
        user = _user(db_session)
        sp = _species(db_session, 5000, path="A|B|C|D|E|F|G", path_zh={})
        _trait(db_session, user, species=sp)
        db_session.flush()

        resp = client.get("/api/taxonomy/tree")
        assert resp.status_code == 200
        mock_build.assert_called()

    def test_medusozoa_injection(self, client, db_session):
        """Cnidaria + Scyphozoa should get Medusozoa subphylum injected."""
        user = _user(db_session)
        sp = _species(
            db_session,
            6000,
            path="Animalia|Cnidaria|Scyphozoa|Rhizostomeae|Rhizostomatidae|Rhopilema|Rhopilema esculentum",
            rank="SPECIES",
            phylum="Cnidaria",
            class_="Scyphozoa",
            path_zh={"kingdom": "動物界", "phylum": "刺胞動物門"},
        )
        _trait(db_session, user, species=sp)
        db_session.flush()

        resp = client.get("/api/taxonomy/tree")
        entry = resp.get_json()["entries"][0]
        assert "Medusozoa" in entry["taxon_path"]
        assert "SUBPHYLUM" in entry["path_ranks"]
        assert entry["path_zh"].get("subphylum") == "水母亞門"


# ---------------------------------------------------------------------------
# GET /api/taxonomy/fictional-tree
# ---------------------------------------------------------------------------


class TestGetFictionalTree:
    def test_empty_fictional_tree(self, client):
        resp = client.get("/api/taxonomy/fictional-tree")
        assert resp.status_code == 200
        assert resp.get_json()["entries"] == []

    def test_fictional_tree_with_trait(self, client, db_session):
        user = _user(db_session)
        fs = _fictional(db_session)
        _trait(db_session, user, fictional=fs)
        db_session.flush()

        resp = client.get("/api/taxonomy/fictional-tree")
        entries = resp.get_json()["entries"]
        assert len(entries) == 1
        entry = entries[0]
        assert entry["user_id"] == user.id
        assert entry["fictional_species_id"] == fs.id
        assert entry["fictional_name"] == "Dragon"
        assert entry["origin"] == "Western"


# ---------------------------------------------------------------------------
# DELETE /api/taxonomy/cache
# ---------------------------------------------------------------------------


class TestClearCache:
    def test_admin_can_clear_cache(self, client, mock_auth, admin_user):
        with mock_auth(admin_user.id):
            resp = client.delete("/api/taxonomy/cache")
        assert resp.status_code == 200
        assert resp.get_json()["message"] == "Cache cleared"

    def test_non_admin_rejected(self, client, mock_auth, sample_user):
        with mock_auth(sample_user.id):
            resp = client.delete("/api/taxonomy/cache")
        assert resp.status_code == 403

    def test_unauthenticated_rejected(self, client):
        resp = client.delete("/api/taxonomy/cache")
        assert resp.status_code == 401
