"""Unit tests for gbif service — CJK detection, result conversion, synonym resolution, match."""

from unittest.mock import MagicMock, patch

import requests

from app.models import Breed, SpeciesCache
from app.services.gbif import (
    _gbif_result_to_dict,
    _has_cjk,
    _resolve_synonym,
    _search_breeds,
    _search_local_cache_chinese,
    match_species,
)

# ---------------------------------------------------------------------------
# _has_cjk — pure function
# ---------------------------------------------------------------------------


class TestHasCjk:
    def test_chinese_characters(self):
        assert _has_cjk("貓") is True
        assert _has_cjk("家貓 cat") is True

    def test_latin_only(self):
        assert _has_cjk("Felis catus") is False

    def test_empty_string(self):
        assert _has_cjk("") is False

    def test_cjk_extension_b(self):
        """CJK Unified Ideographs Extension A (U+3400-U+4DBF)."""
        assert _has_cjk("\u3400") is True

    def test_cjk_compatibility(self):
        """CJK Compatibility Ideographs (U+F900-U+FAFF)."""
        assert _has_cjk("\uf900") is True


# ---------------------------------------------------------------------------
# _gbif_result_to_dict — pure function
# ---------------------------------------------------------------------------


class TestGbifResultToDict:
    def test_basic_conversion(self):
        raw = {
            "scientificName": "Felis catus Linnaeus, 1758",
            "canonicalName": "Felis catus",
            "vernacularName": "Domestic cat",
            "rank": "SPECIES",
            "kingdom": "Animalia",
            "phylum": "Chordata",
            "class": "Mammalia",
            "order": "Carnivora",
            "family": "Felidae",
            "genus": "Felis",
            "species": "Felis catus",
            "speciesKey": 100,
        }
        result = _gbif_result_to_dict(raw, 9685)
        assert result["taxon_id"] == 9685
        assert result["scientific_name"] == "Felis catus Linnaeus, 1758"
        assert result["canonical_name"] == "Felis catus"
        assert result["common_name_en"] == "Domestic cat"
        assert result["common_name_zh"] is None
        assert result["taxon_rank"] == "SPECIES"
        assert result["kingdom"] == "Animalia"
        assert result["taxon_path"] is not None

    def test_minimal_data(self):
        result = _gbif_result_to_dict({"canonicalName": "Unknown"}, 1)
        assert result["taxon_id"] == 1
        assert result["scientific_name"] == "Unknown"

    def test_uses_canonical_when_no_scientific(self):
        result = _gbif_result_to_dict({"canonicalName": "Canis lupus"}, 42)
        assert result["scientific_name"] == "Canis lupus"


# ---------------------------------------------------------------------------
# _resolve_synonym — mock HTTP
# ---------------------------------------------------------------------------


class TestResolveSynonym:
    @patch("app.services.gbif.external_session")
    def test_resolves_accepted(self, mock_session):
        """Synonym key → acceptedKey → fetch accepted species."""
        synonym_resp = MagicMock()
        synonym_resp.status_code = 200
        synonym_resp.json.return_value = {
            "acceptedKey": 200,
            "canonicalName": "Old name",
        }

        accepted_resp = MagicMock()
        accepted_resp.status_code = 200
        accepted_resp.json.return_value = {
            "key": 200,
            "scientificName": "Accepted species",
            "rank": "SPECIES",
            "kingdom": "Animalia",
        }

        mock_session.get.side_effect = [synonym_resp, accepted_resp]

        result = _resolve_synonym(100, "Old name")
        assert result is not None
        assert result["taxon_id"] == 200
        assert result["synonym_name"] == "Old name"

    @patch("app.services.gbif.external_session")
    def test_skips_when_accepted_already_seen(self, mock_session):
        """If accepted key is in seen_keys, skip the second HTTP call."""
        synonym_resp = MagicMock()
        synonym_resp.status_code = 200
        synonym_resp.json.return_value = {"acceptedKey": 200}

        mock_session.get.return_value = synonym_resp

        result = _resolve_synonym(100, "Old name", seen_keys={200})
        assert result is None
        assert mock_session.get.call_count == 1  # only the synonym lookup

    @patch("app.services.gbif.external_session")
    def test_returns_none_on_no_accepted_key(self, mock_session):
        resp = MagicMock()
        resp.status_code = 200
        resp.json.return_value = {}  # no acceptedKey
        mock_session.get.return_value = resp

        assert _resolve_synonym(100, "Name") is None

    @patch("app.services.gbif.external_session")
    def test_returns_none_on_http_error(self, mock_session):
        mock_session.get.side_effect = requests.RequestException("timeout")
        assert _resolve_synonym(100, "Name") is None

    @patch("app.services.gbif.external_session")
    def test_returns_none_on_404(self, mock_session):
        resp = MagicMock()
        resp.status_code = 404
        mock_session.get.return_value = resp
        assert _resolve_synonym(100, "Name") is None


# ---------------------------------------------------------------------------
# match_species — mock HTTP
# ---------------------------------------------------------------------------


class TestMatchSpecies:
    @patch("app.services.gbif.external_session")
    @patch("app.services.chinese_names._enrich_chinese_names")
    def test_returns_match(self, mock_enrich, mock_session):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "matchType": "EXACT",
            "confidence": 99,
            "usageKey": 9685,
            "scientificName": "Felis catus",
            "rank": "SPECIES",
            "status": "ACCEPTED",
            "kingdom": "Animalia",
        }
        mock_resp.raise_for_status = lambda: None
        mock_session.get.return_value = mock_resp

        result = match_species("Felis catus")
        assert result is not None
        assert result["taxon_id"] == 9685
        assert result["match_type"] == "EXACT"
        assert result["confidence"] == 99

    @patch("app.services.gbif.external_session")
    def test_returns_none_on_no_match(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"matchType": "NONE"}
        mock_resp.raise_for_status = lambda: None
        mock_session.get.return_value = mock_resp

        assert match_species("xyzabc") is None

    @patch("app.services.gbif.external_session")
    def test_returns_none_on_no_usage_key(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"matchType": "EXACT"}  # no usageKey
        mock_resp.raise_for_status = lambda: None
        mock_session.get.return_value = mock_resp

        assert match_species("something") is None


# ---------------------------------------------------------------------------
# _search_breeds — DB query
# ---------------------------------------------------------------------------


class TestSearchBreeds:
    def test_search_chinese_prefix(self, db_session):
        sp = SpeciesCache(taxon_id=9685, scientific_name="Felis catus", taxon_rank="SPECIES", taxon_path="test")
        breed = Breed(taxon_id=9685, name_en="Persian", name_zh="波斯貓")
        db_session.add(sp)
        db_session.add(breed)
        db_session.flush()

        results = _search_breeds("波斯")
        assert len(results) == 1
        assert results[0]["result_type"] == "breed"
        assert results[0]["breed"]["name_zh"] == "波斯貓"

    def test_search_english(self, db_session):
        sp = SpeciesCache(taxon_id=9685, scientific_name="Felis catus", taxon_rank="SPECIES", taxon_path="test")
        breed = Breed(taxon_id=9685, name_en="Persian", name_zh="波斯貓")
        db_session.add(sp)
        db_session.add(breed)
        db_session.flush()

        results = _search_breeds("pers")
        assert len(results) == 1

    def test_empty_query(self, db_session):
        assert _search_breeds("") == []


# ---------------------------------------------------------------------------
# _search_local_cache_chinese — DB query
# ---------------------------------------------------------------------------


class TestSearchLocalCacheChinese:
    def test_finds_by_common_name(self, db_session):
        sp = SpeciesCache(
            taxon_id=9685,
            scientific_name="Felis catus",
            common_name_zh="貓",
            taxon_rank="SPECIES",
            taxon_path="test",
        )
        db_session.add(sp)
        db_session.flush()

        results = _search_local_cache_chinese("貓")
        assert len(results) == 1
        assert results[0]["common_name_zh"] == "貓"

    def test_empty_query(self, db_session):
        assert _search_local_cache_chinese("") == []
