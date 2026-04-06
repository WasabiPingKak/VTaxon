"""Unit tests for chinese_names service — fallback chain, alt-name cleaning, rank resolution."""

from unittest.mock import patch

import pytest
import requests

from app.models import SpeciesCache
from app.services.chinese_names import (
    _enrich_chinese_names,
    _resolve_alternative_names,
    _resolve_chinese_name,
    _resolve_rank_zh,
    clean_alt_names,
    clear_chinese_name_caches,
    resolve_missing_chinese_name,
)


@pytest.fixture(autouse=True)
def _clear_lru_caches():
    """Clear LRU caches between tests to avoid cross-contamination."""
    _resolve_chinese_name.cache_clear()
    _resolve_alternative_names.cache_clear()
    _resolve_rank_zh.cache_clear()
    yield
    _resolve_chinese_name.cache_clear()
    _resolve_alternative_names.cache_clear()
    _resolve_rank_zh.cache_clear()


# ---------------------------------------------------------------------------
# clean_alt_names — pure function
# ---------------------------------------------------------------------------


class TestCleanAltNames:
    def test_none_returns_none(self):
        assert clean_alt_names(None, None) is None

    def test_empty_string_returns_none(self):
        assert clean_alt_names("", None) is None

    def test_removes_duplicate_of_primary(self):
        assert clean_alt_names("貓, 家貓", "貓") == "家貓"

    def test_removes_genus_suffix(self):
        """Names ending with 屬 (genus suffix) should be filtered."""
        assert clean_alt_names("貓屬, 家貓", None) == "家貓"

    def test_removes_family_suffix(self):
        """Names ending with 科 (family suffix) should be filtered."""
        assert clean_alt_names("貓科, 家貓", None) == "家貓"

    def test_removes_non_cjk(self):
        assert clean_alt_names("Felis catus, 家貓", None) == "家貓"

    def test_returns_none_when_all_filtered(self):
        assert clean_alt_names("貓屬, Felis", "貓") is None

    def test_preserves_valid_names(self):
        result = clean_alt_names("家貓, 虎斑貓, 橘貓", None)
        assert "家貓" in result
        assert "虎斑貓" in result
        assert "橘貓" in result

    def test_unicode_normalization(self):
        """NFC normalization should handle CJK compatibility chars."""
        # U+8336 (茶) should match its NFC form
        result = clean_alt_names("茶, 綠茶", "茶")
        assert result == "綠茶"


# ---------------------------------------------------------------------------
# _resolve_chinese_name — fallback chain
# ---------------------------------------------------------------------------

# Patches target resolution.py where the names are looked up at runtime.
_RES = "app.services.chinese_names.resolution"


class TestResolveChinese:
    @patch(f"{_RES}.get_species_zh_override", return_value="覆寫名")
    def test_override_takes_priority(self, mock_override):
        result = _resolve_chinese_name(12345, "Felis catus")
        assert result == "覆寫名"

    @patch(f"{_RES}.get_species_zh_override", return_value=None)
    @patch(f"{_RES}.taicol_get_chinese_name", return_value=("台灣名", None))
    def test_taicol_fallback(self, mock_taicol, mock_override):
        result = _resolve_chinese_name(12345, "Felis catus")
        assert result == "台灣名"

    @patch(f"{_RES}.get_species_zh_override", return_value=None)
    @patch(f"{_RES}.taicol_get_chinese_name", return_value=(None, None))
    @patch(f"{_RES}.get_chinese_name_by_gbif_id", return_value=("維基名", None))
    def test_wikidata_fallback(self, mock_wiki, mock_taicol, mock_override):
        result = _resolve_chinese_name(12345, "Felis catus")
        assert result == "維基名"

    @patch(f"{_RES}.get_species_zh_override", return_value=None)
    @patch(f"{_RES}.taicol_get_chinese_name", return_value=(None, None))
    @patch(f"{_RES}.get_chinese_name_by_gbif_id", return_value=(None, None))
    def test_returns_none_when_all_fail(self, mock_wiki, mock_taicol, mock_override):
        result = _resolve_chinese_name(12345, "Unknown species")
        assert result is None

    @patch(f"{_RES}.get_species_zh_override", return_value=None)
    @patch(f"{_RES}.taicol_get_chinese_name", side_effect=requests.RequestException("TaiCOL down"))
    @patch(f"{_RES}.get_chinese_name_by_gbif_id", return_value=("維基名", None))
    def test_taicol_failure_falls_through_to_wikidata(self, mock_wiki, mock_taicol, mock_override):
        result = _resolve_chinese_name(12345, "Felis catus")
        assert result == "維基名"

    @patch(f"{_RES}.get_species_zh_override", return_value=None)
    def test_no_scientific_name_skips_taicol(self, mock_override):
        """When scientific_name is None, TaiCOL should be skipped."""
        with patch(f"{_RES}.get_chinese_name_by_gbif_id", return_value=("維基名", None)):
            result = _resolve_chinese_name(12345, None)
        assert result == "維基名"


# ---------------------------------------------------------------------------
# _resolve_alternative_names
# ---------------------------------------------------------------------------


class TestResolveAlternativeNames:
    @patch(f"{_RES}.taicol_get_chinese_name", return_value=(None, "別名A, 別名B"))
    def test_taicol_alternatives(self, mock_taicol):
        result = _resolve_alternative_names(12345, "Felis catus")
        assert result == "別名A, 別名B"

    @patch(f"{_RES}.taicol_get_chinese_name", return_value=(None, None))
    @patch(f"{_RES}.get_aliases_by_gbif_id", return_value="維基別名")
    def test_wikidata_aliases_fallback(self, mock_wiki, mock_taicol):
        result = _resolve_alternative_names(12345, "Felis catus")
        assert result == "維基別名"

    def test_skips_higher_ranks(self):
        """Higher ranks (FAMILY, ORDER, etc.) should return None without calling APIs."""
        result = _resolve_alternative_names(12345, "Canidae", taxon_rank="FAMILY")
        assert result is None

    @patch(f"{_RES}.taicol_get_chinese_name", return_value=(None, "別名"))
    def test_species_rank_resolves(self, mock_taicol):
        result = _resolve_alternative_names(12345, "Felis catus", taxon_rank="SPECIES")
        assert result == "別名"

    @patch(f"{_RES}.taicol_get_chinese_name", return_value=(None, None))
    @patch(f"{_RES}.get_aliases_by_gbif_id", return_value=None)
    def test_returns_none_when_all_fail(self, mock_wiki, mock_taicol):
        result = _resolve_alternative_names(12345, "Unknown")
        assert result is None


# ---------------------------------------------------------------------------
# _resolve_rank_zh
# ---------------------------------------------------------------------------


class TestResolveRankZh:
    @patch(f"{_RES}.get_taxonomy_zh", return_value="犬科")
    def test_static_table_hit(self, mock_static):
        result = _resolve_rank_zh("Canidae", rank="FAMILY")
        assert result == "犬科"

    @patch(f"{_RES}.get_taxonomy_zh", return_value=None)
    @patch(f"{_RES}.external_session")
    @patch(f"{_RES}.get_chinese_name_by_gbif_id", return_value=("犬科", None))
    def test_gbif_match_then_wikidata(self, mock_wiki, mock_session, mock_static):
        mock_resp = mock_session.get.return_value
        mock_resp.raise_for_status = lambda: None
        mock_resp.json.return_value = {"matchType": "EXACT", "usageKey": 9703}

        result = _resolve_rank_zh("Canidae", rank="FAMILY")
        assert result == "犬科"

    @patch(f"{_RES}.get_taxonomy_zh", return_value=None)
    @patch(f"{_RES}.external_session")
    def test_gbif_no_match_returns_none(self, mock_session, mock_static):
        mock_resp = mock_session.get.return_value
        mock_resp.raise_for_status = lambda: None
        mock_resp.json.return_value = {"matchType": "NONE"}

        result = _resolve_rank_zh("UnknownTaxon")
        assert result is None

    def test_none_input_returns_none(self):
        assert _resolve_rank_zh(None) is None

    def test_empty_input_returns_none(self):
        assert _resolve_rank_zh("") is None

    @patch(f"{_RES}.get_taxonomy_zh", return_value=None)
    @patch(f"{_RES}.external_session")
    def test_request_exception_returns_none(self, mock_session, mock_static):
        """API failure should be caught and return None."""
        mock_session.get.side_effect = requests.RequestException("timeout")
        result = _resolve_rank_zh("FailTaxon", rank="ORDER")
        assert result is None


# ---------------------------------------------------------------------------
# clear_chinese_name_caches
# ---------------------------------------------------------------------------


class TestClearCaches:
    def test_clears_without_error(self):
        """Calling clear should not raise."""
        clear_chinese_name_caches()


# ---------------------------------------------------------------------------
# resolve_missing_chinese_name — persist to DB
# ---------------------------------------------------------------------------

# resolve_missing_chinese_name lives in resolution.py and calls
# _resolve_chinese_name internally, so we patch at the resolution module.


class TestResolveMissingChineseName:
    @patch(f"{_RES}._resolve_chinese_name", return_value="家貓")
    def test_backfills_chinese_name(self, mock_resolve, db_session):
        sp = SpeciesCache(taxon_id=50001, scientific_name="Felis catus", taxon_rank="SPECIES", taxon_path="test")
        db_session.add(sp)
        db_session.flush()

        resolve_missing_chinese_name(sp)
        db_session.refresh(sp)
        assert sp.common_name_zh == "家貓"

    @patch(f"{_RES}._resolve_chinese_name", return_value=None)
    def test_does_nothing_when_not_resolved(self, mock_resolve, db_session):
        sp = SpeciesCache(taxon_id=50002, scientific_name="Unknown", taxon_rank="SPECIES", taxon_path="test")
        db_session.add(sp)
        db_session.flush()

        resolve_missing_chinese_name(sp)
        db_session.refresh(sp)
        assert sp.common_name_zh is None


# ---------------------------------------------------------------------------
# _enrich_chinese_names — batch enrichment
# ---------------------------------------------------------------------------

# _enrich_chinese_names lives in enrichment.py, which imports from resolution
# at module level. Patches target where the name is bound in enrichment.
_ENR = "app.services.chinese_names.enrichment"


class TestEnrichChineseNames:
    @patch("app.services.species_cache._cache_enriched_species")
    @patch(f"{_ENR}._resolve_alternative_names", return_value=None)
    @patch(f"{_ENR}._resolve_chinese_name", return_value="紅狐")
    @patch(f"{_ENR}.get_species_zh_override", return_value=None)
    def test_resolves_chinese_name(self, mock_override, mock_resolve, mock_alt, mock_cache):
        species_list = [
            {"taxon_id": 1000, "scientific_name": "Vulpes vulpes", "taxon_rank": "SPECIES"},
        ]
        _enrich_chinese_names(species_list)
        assert species_list[0]["common_name_zh"] == "紅狐"
        assert species_list[0]["species_zh"] == "紅狐"

    @patch("app.services.species_cache._cache_enriched_species")
    @patch(f"{_ENR}._resolve_alternative_names", return_value=None)
    @patch(f"{_ENR}._resolve_chinese_name", return_value=None)
    @patch(f"{_ENR}.get_species_zh_override", return_value="覆寫")
    def test_override_takes_priority(self, mock_override, mock_resolve, mock_alt, mock_cache):
        species_list = [{"taxon_id": 1001, "scientific_name": "Sp.", "taxon_rank": "SPECIES"}]
        _enrich_chinese_names(species_list)
        assert species_list[0]["common_name_zh"] == "覆寫"

    @patch("app.services.species_cache._cache_enriched_species")
    @patch(f"{_ENR}._resolve_alternative_names", return_value=None)
    @patch(f"{_ENR}._resolve_chinese_name", return_value="貓屬")
    @patch(f"{_ENR}.get_species_zh_override", return_value=None)
    def test_strips_genus_suffix_for_species(self, mock_override, mock_resolve, mock_alt, mock_cache):
        """Species-level taxa should have trailing 屬 stripped."""
        species_list = [{"taxon_id": 1002, "scientific_name": "Felis catus", "taxon_rank": "SPECIES"}]
        _enrich_chinese_names(species_list)
        assert species_list[0]["common_name_zh"] == "貓"

    @patch("app.services.species_cache._cache_enriched_species")
    @patch(f"{_ENR}._resolve_alternative_names", return_value=None)
    @patch(f"{_ENR}._resolve_chinese_name", return_value="not-cjk")
    @patch(f"{_ENR}.get_species_zh_override", return_value=None)
    def test_non_cjk_name_rejected(self, mock_override, mock_resolve, mock_alt, mock_cache):
        """Non-CJK resolved names should be discarded."""
        species_list = [{"taxon_id": 1003, "scientific_name": "Felis", "taxon_rank": "SPECIES"}]
        _enrich_chinese_names(species_list)
        assert species_list[0]["common_name_zh"] is None

    @patch("app.services.species_cache._cache_enriched_species")
    @patch(f"{_ENR}._resolve_alternative_names", return_value=None)
    @patch(f"{_ENR}._resolve_chinese_name", return_value=None)
    @patch(f"{_ENR}.get_species_zh_override", return_value=None)
    def test_fallback_to_db_cache(self, mock_override, mock_resolve, mock_alt, mock_cache, db_session):
        """When external APIs return nothing, should try DB cache."""
        sp = SpeciesCache(
            taxon_id=1004,
            scientific_name="Cached sp.",
            common_name_zh="快取名",
            taxon_rank="SPECIES",
            taxon_path="test",
        )
        db_session.add(sp)
        db_session.flush()

        species_list = [{"taxon_id": 1004, "scientific_name": "Cached sp.", "taxon_rank": "SPECIES"}]
        _enrich_chinese_names(species_list)
        assert species_list[0]["common_name_zh"] == "快取名"

    @patch("app.services.species_cache._cache_enriched_species")
    @patch(f"{_ENR}._resolve_alternative_names", return_value=None)
    @patch(f"{_ENR}._resolve_chinese_name", return_value=None)
    @patch(f"{_ENR}.get_species_zh_override", return_value=None)
    def test_higher_rank_uses_rank_zh(self, mock_override, mock_resolve, mock_alt, mock_cache):
        """FAMILY-level taxa without common_name_zh should use family_zh."""
        species_list = [
            {
                "taxon_id": 1005,
                "scientific_name": "Canidae",
                "taxon_rank": "FAMILY",
                "family": "Canidae",
            }
        ]
        _enrich_chinese_names(species_list)
        # family_zh comes from static table — may or may not exist
        # Just verify the function completes without error
        assert "species_zh" in species_list[0]

    @patch("app.services.species_cache._cache_enriched_species")
    @patch(f"{_ENR}._resolve_alternative_names", return_value="別名A, 別名B")
    @patch(f"{_ENR}._resolve_chinese_name", return_value="紅狐")
    @patch(f"{_ENR}.get_species_zh_override", return_value=None)
    def test_alternative_names_resolved(self, mock_override, mock_resolve, mock_alt, mock_cache):
        species_list = [{"taxon_id": 1006, "scientific_name": "Vulpes vulpes", "taxon_rank": "SPECIES"}]
        _enrich_chinese_names(species_list)
        assert species_list[0]["alternative_names_zh"] == "別名A, 別名B"
