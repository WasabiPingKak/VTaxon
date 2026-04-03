"""Unit tests for species_cache service — taxonomy path building and cache logic."""

from unittest.mock import patch

from app.models import SpeciesCache
from app.services.species_cache import (
    _build_taxon_path,
    _realign_taxon_path,
    cache_from_search_result,
    get_species,
    get_subspecies,
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


# ---------------------------------------------------------------------------
# get_species — enrichment & realign paths
# ---------------------------------------------------------------------------


class TestGetSpeciesEnrichment:
    def test_cached_species_fills_rank_zh(self, db_session):
        """Cached species should have rank_zh filled from static table."""
        sp = SpeciesCache(
            taxon_id=60001,
            scientific_name="Felis catus",
            taxon_rank="SPECIES",
            taxon_path="Animalia|Chordata|Mammalia|Carnivora|Felidae|Felis|Felis catus",
            kingdom="Animalia",
            phylum="Chordata",
            class_="Mammalia",
            order_="Carnivora",
            family="Felidae",
            genus="Felis",
        )
        db_session.add(sp)
        db_session.flush()

        result = get_species(60001)
        assert result is not None
        # Static table should fill kingdom_zh at minimum
        assert "kingdom_zh" in result

    @patch("app.services.species_cache.external_session")
    @patch("app.services.chinese_names._resolve_chinese_name", return_value="赤狐")
    def test_gbif_fetch_with_chinese_name(self, mock_zh, mock_session, db_session):
        """GBIF fetch should resolve Chinese name and cache it."""
        mock_resp = mock_session.get.return_value
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "key": 60002,
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

        result = get_species(60002)
        assert result is not None
        # Chinese name should be persisted
        cached = db_session.get(SpeciesCache, 60002)
        assert cached is not None
        assert cached.common_name_zh == "赤狐"


# ---------------------------------------------------------------------------
# get_subspecies — mock GBIF children API
# ---------------------------------------------------------------------------


class TestGetSubspecies:
    @patch("app.services.species_cache.external_session")
    @patch("app.services.chinese_names._enrich_chinese_names")
    def test_returns_accepted_subspecies(self, mock_enrich, mock_session, db_session):
        mock_resp = mock_session.get.return_value
        mock_resp.raise_for_status = lambda: None
        mock_resp.json.return_value = {
            "results": [
                {
                    "key": 5219243,
                    "scientificName": "Canis lupus familiaris",
                    "rank": "SUBSPECIES",
                    "taxonomicStatus": "ACCEPTED",
                    "kingdom": "Animalia",
                },
                {
                    "key": 5219244,
                    "scientificName": "Canis lupus lupus",
                    "rank": "SUBSPECIES",
                    "taxonomicStatus": "ACCEPTED",
                    "kingdom": "Animalia",
                },
            ]
        }

        results = get_subspecies(5219240)
        assert len(results) == 2
        assert results[0]["taxon_id"] == 5219243

    @patch("app.services.species_cache.external_session")
    @patch("app.services.chinese_names._enrich_chinese_names")
    def test_skips_non_subspecies_ranks(self, mock_enrich, mock_session, db_session):
        mock_resp = mock_session.get.return_value
        mock_resp.raise_for_status = lambda: None
        mock_resp.json.return_value = {
            "results": [
                {"key": 1, "scientificName": "Genus sp.", "rank": "SPECIES", "taxonomicStatus": "ACCEPTED"},
                {"key": 2, "scientificName": "Subsp.", "rank": "SUBSPECIES", "taxonomicStatus": "ACCEPTED"},
            ]
        }

        results = get_subspecies(999)
        assert len(results) == 1
        assert results[0]["taxon_id"] == 2

    @patch("app.services.species_cache.external_session")
    @patch("app.services.chinese_names._enrich_chinese_names")
    def test_skips_non_accepted_status(self, mock_enrich, mock_session, db_session):
        mock_resp = mock_session.get.return_value
        mock_resp.raise_for_status = lambda: None
        mock_resp.json.return_value = {
            "results": [
                {"key": 10, "rank": "SUBSPECIES", "taxonomicStatus": "SYNONYM", "scientificName": "Old"},
                {"key": 11, "rank": "SUBSPECIES", "taxonomicStatus": "ACCEPTED", "scientificName": "Good"},
            ]
        }

        results = get_subspecies(888)
        assert len(results) == 1
        assert results[0]["taxon_id"] == 11

    @patch("app.services.species_cache.external_session")
    @patch("app.services.chinese_names._enrich_chinese_names")
    def test_deduplicates_by_key(self, mock_enrich, mock_session, db_session):
        mock_resp = mock_session.get.return_value
        mock_resp.raise_for_status = lambda: None
        mock_resp.json.return_value = {
            "results": [
                {"key": 20, "rank": "SUBSPECIES", "taxonomicStatus": "ACCEPTED", "scientificName": "A"},
                {"key": 20, "rank": "SUBSPECIES", "taxonomicStatus": "ACCEPTED", "scientificName": "A"},
            ]
        }

        results = get_subspecies(777)
        assert len(results) == 1
