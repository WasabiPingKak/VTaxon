"""Unit tests for chinese_names service — fallback chain, alt-name cleaning, rank resolution."""

from unittest.mock import patch

import pytest
import requests

from app.services.chinese_names import (
    _resolve_alternative_names,
    _resolve_chinese_name,
    _resolve_rank_zh,
    clean_alt_names,
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


class TestResolveChinese:
    @patch("app.services.chinese_names.get_species_zh_override", return_value="覆寫名")
    def test_override_takes_priority(self, mock_override):
        result = _resolve_chinese_name(12345, "Felis catus")
        assert result == "覆寫名"

    @patch("app.services.chinese_names.get_species_zh_override", return_value=None)
    @patch("app.services.chinese_names.taicol_get_chinese_name", return_value=("台灣名", None))
    def test_taicol_fallback(self, mock_taicol, mock_override):
        result = _resolve_chinese_name(12345, "Felis catus")
        assert result == "台灣名"

    @patch("app.services.chinese_names.get_species_zh_override", return_value=None)
    @patch("app.services.chinese_names.taicol_get_chinese_name", return_value=(None, None))
    @patch("app.services.chinese_names.get_chinese_name_by_gbif_id", return_value=("維基名", None))
    def test_wikidata_fallback(self, mock_wiki, mock_taicol, mock_override):
        result = _resolve_chinese_name(12345, "Felis catus")
        assert result == "維基名"

    @patch("app.services.chinese_names.get_species_zh_override", return_value=None)
    @patch("app.services.chinese_names.taicol_get_chinese_name", return_value=(None, None))
    @patch("app.services.chinese_names.get_chinese_name_by_gbif_id", return_value=(None, None))
    def test_returns_none_when_all_fail(self, mock_wiki, mock_taicol, mock_override):
        result = _resolve_chinese_name(12345, "Unknown species")
        assert result is None

    @patch("app.services.chinese_names.get_species_zh_override", return_value=None)
    @patch("app.services.chinese_names.taicol_get_chinese_name", side_effect=requests.RequestException("TaiCOL down"))
    @patch("app.services.chinese_names.get_chinese_name_by_gbif_id", return_value=("維基名", None))
    def test_taicol_failure_falls_through_to_wikidata(self, mock_wiki, mock_taicol, mock_override):
        result = _resolve_chinese_name(12345, "Felis catus")
        assert result == "維基名"

    @patch("app.services.chinese_names.get_species_zh_override", return_value=None)
    def test_no_scientific_name_skips_taicol(self, mock_override):
        """When scientific_name is None, TaiCOL should be skipped."""
        with patch("app.services.chinese_names.get_chinese_name_by_gbif_id", return_value=("維基名", None)):
            result = _resolve_chinese_name(12345, None)
        assert result == "維基名"


# ---------------------------------------------------------------------------
# _resolve_alternative_names
# ---------------------------------------------------------------------------


class TestResolveAlternativeNames:
    @patch("app.services.chinese_names.taicol_get_chinese_name", return_value=(None, "別名A, 別名B"))
    def test_taicol_alternatives(self, mock_taicol):
        result = _resolve_alternative_names(12345, "Felis catus")
        assert result == "別名A, 別名B"

    @patch("app.services.chinese_names.taicol_get_chinese_name", return_value=(None, None))
    @patch("app.services.chinese_names.get_aliases_by_gbif_id", return_value="維基別名")
    def test_wikidata_aliases_fallback(self, mock_wiki, mock_taicol):
        result = _resolve_alternative_names(12345, "Felis catus")
        assert result == "維基別名"

    def test_skips_higher_ranks(self):
        """Higher ranks (FAMILY, ORDER, etc.) should return None without calling APIs."""
        result = _resolve_alternative_names(12345, "Canidae", taxon_rank="FAMILY")
        assert result is None

    @patch("app.services.chinese_names.taicol_get_chinese_name", return_value=(None, "別名"))
    def test_species_rank_resolves(self, mock_taicol):
        result = _resolve_alternative_names(12345, "Felis catus", taxon_rank="SPECIES")
        assert result == "別名"

    @patch("app.services.chinese_names.taicol_get_chinese_name", return_value=(None, None))
    @patch("app.services.chinese_names.get_aliases_by_gbif_id", return_value=None)
    def test_returns_none_when_all_fail(self, mock_wiki, mock_taicol):
        result = _resolve_alternative_names(12345, "Unknown")
        assert result is None


# ---------------------------------------------------------------------------
# _resolve_rank_zh
# ---------------------------------------------------------------------------


class TestResolveRankZh:
    @patch("app.services.chinese_names.get_taxonomy_zh", return_value="犬科")
    def test_static_table_hit(self, mock_static):
        result = _resolve_rank_zh("Canidae", rank="FAMILY")
        assert result == "犬科"

    @patch("app.services.chinese_names.get_taxonomy_zh", return_value=None)
    @patch("app.services.chinese_names.external_session")
    @patch("app.services.chinese_names.get_chinese_name_by_gbif_id", return_value=("犬科", None))
    def test_gbif_match_then_wikidata(self, mock_wiki, mock_session, mock_static):
        mock_resp = mock_session.get.return_value
        mock_resp.raise_for_status = lambda: None
        mock_resp.json.return_value = {"matchType": "EXACT", "usageKey": 9703}

        result = _resolve_rank_zh("Canidae", rank="FAMILY")
        assert result == "犬科"

    @patch("app.services.chinese_names.get_taxonomy_zh", return_value=None)
    @patch("app.services.chinese_names.external_session")
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
