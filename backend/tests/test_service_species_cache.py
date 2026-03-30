"""Unit tests for species_cache service — taxonomy path building and cache logic."""

from unittest.mock import patch

from app.models import SpeciesCache
from app.services.species_cache import (
    _build_taxon_path,
    _realign_taxon_path,
    cache_from_search_result,
    get_species,
)

# ---------------------------------------------------------------------------
# _build_taxon_path — pure logic, no DB or HTTP
# ---------------------------------------------------------------------------


class TestBuildTaxonPath:
    def test_full_species_path(self):
        data = {
            "kingdom": "Animalia",
            "phylum": "Chordata",
            "class": "Mammalia",
            "order": "Carnivora",
            "family": "Canidae",
            "genus": "Canis",
            "species": "Canis lupus",
            "rank": "SPECIES",
        }
        assert _build_taxon_path(data) == "Animalia|Chordata|Mammalia|Carnivora|Canidae|Canis|Canis lupus"

    def test_family_level_path(self):
        data = {
            "kingdom": "Animalia",
            "phylum": "Chordata",
            "class": "Mammalia",
            "order": "Carnivora",
            "family": "Canidae",
            "rank": "FAMILY",
        }
        assert _build_taxon_path(data) == "Animalia|Chordata|Mammalia|Carnivora|Canidae"

    def test_missing_intermediate_ranks(self):
        """Missing ranks should be empty strings to preserve position index."""
        data = {
            "kingdom": "Animalia",
            "phylum": "Chordata",
            "family": "Arandaspididae",
            "genus": "Sacabambaspis",
            "rank": "GENUS",
        }
        path = _build_taxon_path(data)
        assert path == "Animalia|Chordata|||Arandaspididae|Sacabambaspis"

    def test_subspecies_appends_trinomial(self):
        data = {
            "kingdom": "Animalia",
            "phylum": "Chordata",
            "class": "Mammalia",
            "order": "Carnivora",
            "family": "Canidae",
            "genus": "Canis",
            "species": "Canis lupus",
            "canonicalName": "Canis lupus familiaris",
            "rank": "SUBSPECIES",
        }
        path = _build_taxon_path(data)
        assert path.endswith("|Canis lupus|Canis lupus familiaris")

    def test_subphylum_appends_canonical(self):
        data = {
            "kingdom": "Animalia",
            "phylum": "Cnidaria",
            "canonicalName": "Medusozoa",
            "rank": "SUBPHYLUM",
        }
        path = _build_taxon_path(data)
        assert path == "Animalia|Cnidaria|Medusozoa"

    def test_empty_data_returns_none(self):
        assert _build_taxon_path({}) is None

    def test_strips_author_citation(self):
        data = {
            "kingdom": "Animalia",
            "phylum": "Chordata",
            "class": "Mammalia",
            "order": "Carnivora",
            "family": "Canidae",
            "genus": "Canis",
            "species": "Canis lupus",
            "canonicalName": "Canis lupus familiaris Linnaeus, 1758",
            "rank": "SUBSPECIES",
        }
        path = _build_taxon_path(data)
        assert "Linnaeus" not in path
        assert path.endswith("Canis lupus familiaris")


# ---------------------------------------------------------------------------
# _realign_taxon_path — pure logic on model objects
# ---------------------------------------------------------------------------


class TestRealignTaxonPath:
    def _make_species(self, db_session, **kwargs):
        defaults = {
            "taxon_id": 99999,
            "scientific_name": "Canis lupus",
            "taxon_rank": "SPECIES",
            "kingdom": "Animalia",
            "phylum": "Chordata",
            "class_": "Mammalia",
            "order_": "Carnivora",
            "family": "Canidae",
            "genus": "Canis",
            "taxon_path": "Animalia|Chordata|Mammalia|Carnivora|Canidae|Canis|Canis lupus",
        }
        defaults.update(kwargs)
        sp = SpeciesCache(**defaults)
        db_session.add(sp)
        db_session.flush()
        return sp

    def test_correct_path_unchanged(self, db_session):
        sp = self._make_species(db_session)
        path, changed = _realign_taxon_path(sp)
        assert not changed
        assert path == "Animalia|Chordata|Mammalia|Carnivora|Canidae|Canis|Canis lupus"

    def test_old_compact_path_fixed(self, db_session):
        """Old paths skipped empty ranks — realign should fix them."""
        sp = self._make_species(
            db_session,
            taxon_id=99998,
            scientific_name="Sacabambaspis",
            taxon_rank="GENUS",
            kingdom="Animalia",
            phylum="Chordata",
            class_=None,
            order_=None,
            family="Arandaspididae",
            genus="Sacabambaspis",
            taxon_path="Animalia|Chordata|Arandaspididae|Sacabambaspis",  # old format
        )
        path, changed = _realign_taxon_path(sp)
        assert changed
        assert path == "Animalia|Chordata|||Arandaspididae|Sacabambaspis"

    def test_subspecies_path(self, db_session):
        sp = self._make_species(
            db_session,
            taxon_id=99997,
            scientific_name="Canis lupus familiaris",
            taxon_rank="SUBSPECIES",
            taxon_path="old|path",
        )
        path, changed = _realign_taxon_path(sp)
        assert changed
        assert path.endswith("|Canis lupus|Canis lupus familiaris")


# ---------------------------------------------------------------------------
# get_species — DB cache hit / GBIF fetch
# ---------------------------------------------------------------------------


class TestGetSpecies:
    def test_returns_cached_species(self, db_session):
        sp = SpeciesCache(
            taxon_id=12345,
            scientific_name="Felis catus",
            taxon_rank="SPECIES",
            taxon_path="Animalia|Chordata|Mammalia|Carnivora|Felidae|Felis|Felis catus",
        )
        db_session.add(sp)
        db_session.flush()

        result = get_species(12345)
        assert result is not None
        assert result["scientific_name"] == "Felis catus"

    @patch("app.services.species_cache.external_session")
    @patch("app.services.chinese_names._resolve_chinese_name", return_value=None)
    def test_fetches_from_gbif_on_cache_miss(self, mock_zh, mock_session, db_session):
        mock_resp = mock_session.get.return_value
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "key": 77777,
            "scientificName": "Vulpes vulpes",
            "rank": "SPECIES",
            "kingdom": "Animalia",
            "phylum": "Chordata",
            "class": "Mammalia",
            "order": "Carnivora",
            "family": "Canidae",
            "genus": "Vulpes",
            "species": "Vulpes vulpes",
        }

        result = get_species(77777)
        assert result is not None
        assert result["scientific_name"] == "Vulpes vulpes"
        mock_session.get.assert_called_once()

    @patch("app.services.species_cache.external_session")
    def test_returns_none_for_gbif_404(self, mock_session, db_session):
        mock_session.get.return_value.status_code = 404
        assert get_species(99999) is None


# ---------------------------------------------------------------------------
# cache_from_search_result
# ---------------------------------------------------------------------------


class TestCacheFromSearchResult:
    def test_caches_new_species(self, db_session):
        gbif_data = {
            "key": 88888,
            "scientificName": "Panthera leo",
            "rank": "SPECIES",
            "kingdom": "Animalia",
            "phylum": "Chordata",
            "class": "Mammalia",
            "order": "Carnivora",
            "family": "Felidae",
            "genus": "Panthera",
            "species": "Panthera leo",
        }
        result = cache_from_search_result(gbif_data)
        assert result is not None
        assert result.taxon_id == 88888

    def test_returns_existing_on_duplicate(self, db_session):
        sp = SpeciesCache(taxon_id=88889, scientific_name="Ursus arctos", taxon_rank="SPECIES", taxon_path="test")
        db_session.add(sp)
        db_session.flush()

        result = cache_from_search_result({"key": 88889})
        assert result.taxon_id == 88889
        assert result.scientific_name == "Ursus arctos"

    def test_returns_none_without_key(self, db_session):
        assert cache_from_search_result({}) is None
