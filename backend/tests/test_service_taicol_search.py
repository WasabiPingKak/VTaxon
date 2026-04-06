"""Unit tests for chinese_names/taicol_search — TaiCOL search and fallback builder."""

import json
from unittest.mock import patch

import requests

from app.models import SpeciesCache

_TC = "app.services.chinese_names.taicol_search"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_TAICOL_RESULT = {
    "scientific_name": "Branta leucopsis",
    "rank": "SPECIES",
    "common_name_zh": "白頰黑雁",
    "kingdom": "Animalia",
    "taicol_taxon_id": "t0001",
}

_GBIF_MATCHED = {
    "taxon_id": 2498007,
    "scientific_name": "Branta leucopsis",
    "taxon_rank": "SPECIES",
    "kingdom": "Animalia",
    "phylum": "Chordata",
}


# ---------------------------------------------------------------------------
# _build_from_taicol
# ---------------------------------------------------------------------------


class TestBuildFromTaicol:
    def test_returns_none_without_scientific_name(self, app):
        from app.services.chinese_names.taicol_search import _build_from_taicol

        with app.app_context():
            assert _build_from_taicol({"rank": "SPECIES"}) is None

    def test_returns_none_without_rank(self, app):
        from app.services.chinese_names.taicol_search import _build_from_taicol

        with app.app_context():
            assert _build_from_taicol({"scientific_name": "Foo bar"}) is None

    @patch("app.services.species_cache._build_path_zh", return_value={})
    @patch(f"{_TC}.taicol_get_higher_taxa_zh", return_value=[])
    @patch(f"{_TC}.get_taxonomy_zh", return_value=None)
    @patch(f"{_TC}.get_taxonomy_zh_for_ranks", return_value={})
    @patch(f"{_TC}._resolve_genus_zh", return_value=None)
    def test_builds_species_dict_with_negative_id(
        self, mock_genus, mock_ranks, mock_zh, mock_higher, mock_path, db_session
    ):
        from app.services.chinese_names.taicol_search import _build_from_taicol

        tr = {"scientific_name": "Fictus animalus", "rank": "SPECIES", "common_name_zh": "虛構獸"}
        result = _build_from_taicol(tr)

        assert result is not None
        assert result["taxon_id"] < 0
        assert result["scientific_name"] == "Fictus animalus"
        assert result["common_name_zh"] == "虛構獸"
        assert result["taxon_rank"] == "SPECIES"
        assert result["_from_taicol"] is True

    @patch("app.services.species_cache._build_path_zh", return_value={})
    @patch(f"{_TC}.taicol_get_higher_taxa_zh", return_value=[])
    @patch(f"{_TC}.get_taxonomy_zh", return_value=None)
    @patch(f"{_TC}.get_taxonomy_zh_for_ranks", return_value={})
    @patch(f"{_TC}._resolve_genus_zh", return_value=None)
    def test_negative_id_is_stable(self, mock_genus, mock_ranks, mock_zh, mock_higher, mock_path, db_session):
        """Same scientific_name should always produce the same negative ID."""
        from app.services.chinese_names.taicol_search import _build_from_taicol

        tr = {"scientific_name": "Stabilis constans", "rank": "SPECIES"}
        r1 = _build_from_taicol(tr)
        # Clear the cached DB entry so _build_from_taicol runs the full path again
        db_session.rollback()
        SpeciesCache.query.filter_by(taxon_id=r1["taxon_id"]).delete()
        db_session.commit()
        r2 = _build_from_taicol(tr)
        assert r1["taxon_id"] == r2["taxon_id"]

    @patch("app.services.species_cache._build_path_zh", return_value={})
    @patch(
        f"{_TC}.taicol_get_higher_taxa_zh",
        return_value=[
            {"rank": "KINGDOM", "name": "Animalia"},
            {"rank": "PHYLUM", "name": "Chordata"},
            {"rank": "FAMILY", "name": "Anatidae"},
        ],
    )
    @patch(f"{_TC}.get_taxonomy_zh", return_value=None)
    @patch(f"{_TC}.get_taxonomy_zh_for_ranks", return_value={})
    @patch(f"{_TC}._resolve_genus_zh", return_value=None)
    def test_builds_hierarchy_from_higher_taxa(
        self, mock_genus, mock_ranks, mock_zh, mock_higher, mock_path, db_session
    ):
        from app.services.chinese_names.taicol_search import _build_from_taicol

        tr = {"scientific_name": "Branta leucopsis", "rank": "SPECIES", "taicol_taxon_id": "t001"}
        result = _build_from_taicol(tr)

        assert result["kingdom"] == "Animalia"
        assert result["phylum"] == "Chordata"
        assert result["family"] == "Anatidae"
        assert result["taxon_path"] is not None
        assert "Animalia" in result["taxon_path"]

    @patch("app.services.species_cache._fill_missing_rank_zh")
    def test_returns_cached_entry(self, mock_fill, db_session):
        """If negative ID is already cached, return from DB instead of rebuilding."""
        from app.services.chinese_names.taicol_search import _build_from_taicol

        sci_name = "Cached taicolis"
        taxon_id = -(abs(hash(sci_name)) % 900_000_000 + 100_000_000)
        sp = SpeciesCache(
            taxon_id=taxon_id,
            scientific_name=sci_name,
            common_name_zh="快取名",
            taxon_rank="SPECIES",
            taxon_path="Animalia",
        )
        db_session.add(sp)
        db_session.flush()

        result = _build_from_taicol({"scientific_name": sci_name, "rank": "SPECIES"})
        assert result is not None
        assert result["scientific_name"] == sci_name
        # Should NOT have called the TaiCOL higher taxa API
        mock_fill.assert_called_once()

    @patch("app.services.species_cache._build_path_zh", return_value={})
    @patch(f"{_TC}.taicol_get_higher_taxa_zh", return_value=[])
    @patch(f"{_TC}.get_taxonomy_zh", return_value=None)
    @patch(f"{_TC}.get_taxonomy_zh_for_ranks", return_value={})
    @patch(f"{_TC}._resolve_genus_zh", return_value=None)
    def test_uses_kingdom_from_tr_when_not_in_hierarchy(
        self, mock_genus, mock_ranks, mock_zh, mock_higher, mock_path, db_session
    ):
        from app.services.chinese_names.taicol_search import _build_from_taicol

        tr = {"scientific_name": "Foo bar", "rank": "SPECIES", "kingdom": "Plantae"}
        result = _build_from_taicol(tr)
        assert result["kingdom"] == "Plantae"

    @patch("app.services.species_cache._build_path_zh", return_value={})
    @patch(f"{_TC}.taicol_get_higher_taxa_zh", return_value=[])
    @patch(f"{_TC}.get_taxonomy_zh", return_value="靜態名")
    @patch(f"{_TC}.get_taxonomy_zh_for_ranks", return_value={})
    @patch(f"{_TC}._resolve_genus_zh", return_value=None)
    def test_static_zh_fills_common_name_when_taicol_has_none(
        self, mock_genus, mock_ranks, mock_zh, mock_higher, mock_path, db_session
    ):
        from app.services.chinese_names.taicol_search import _build_from_taicol

        tr = {"scientific_name": "Known taxon", "rank": "FAMILY"}
        result = _build_from_taicol(tr)
        assert result["common_name_zh"] == "靜態名"


# ---------------------------------------------------------------------------
# _fallback_taicol_by_name
# ---------------------------------------------------------------------------


class TestFallbackTaicolByName:
    @patch(f"{_TC}.taicol_get_chinese_name", return_value=(None, None))
    def test_returns_empty_when_taicol_unknown(self, mock_taicol):
        from app.services.chinese_names.taicol_search import _fallback_taicol_by_name

        assert _fallback_taicol_by_name("Unknown species") == []

    @patch(f"{_TC}.taicol_get_chinese_name", side_effect=requests.RequestException("network"))
    def test_returns_empty_on_taicol_exception(self, mock_taicol):
        from app.services.chinese_names.taicol_search import _fallback_taicol_by_name

        assert _fallback_taicol_by_name("Foo bar") == []

    @patch("app.services.gbif.match_species", return_value=_GBIF_MATCHED.copy())
    @patch(f"{_TC}.taicol_get_chinese_name", return_value=("白頰黑雁", None))
    def test_gbif_match_gets_taicol_zh(self, mock_taicol, mock_gbif):
        from app.services.chinese_names.taicol_search import _fallback_taicol_by_name

        result = _fallback_taicol_by_name("Branta leucopsis")
        assert len(result) == 1
        assert result[0]["common_name_zh"] == "白頰黑雁"
        assert result[0]["taxon_id"] == 2498007

    @patch("app.services.gbif.match_species", return_value={"taxon_id": 123, "common_name_zh": "已有名"})
    @patch(f"{_TC}.taicol_get_chinese_name", return_value=("TaiCOL名", None))
    def test_does_not_overwrite_existing_zh(self, mock_taicol, mock_gbif):
        """If GBIF match already has common_name_zh, don't overwrite with TaiCOL's."""
        from app.services.chinese_names.taicol_search import _fallback_taicol_by_name

        result = _fallback_taicol_by_name("Some species")
        assert result[0]["common_name_zh"] == "已有名"

    @patch(f"{_TC}._build_from_taicol", return_value={"taxon_id": -999, "scientific_name": "X"})
    @patch(f"{_TC}.taicol_search_by_scientific_name", return_value=[_TAICOL_RESULT])
    @patch("app.services.gbif.match_species", return_value=None)
    @patch(f"{_TC}.taicol_get_chinese_name", return_value=("名稱", None))
    def test_falls_back_to_build_from_taicol(self, mock_cn, mock_gbif, mock_search, mock_build):
        from app.services.chinese_names.taicol_search import _fallback_taicol_by_name

        result = _fallback_taicol_by_name("Missing from GBIF")
        assert len(result) == 1
        mock_build.assert_called_once()


# ---------------------------------------------------------------------------
# _search_via_taicol
# ---------------------------------------------------------------------------


class TestSearchViaTaicol:
    @patch(f"{_TC}.taicol_search_chinese", return_value=[])
    def test_returns_empty_when_no_taicol_results(self, mock_search):
        from app.services.chinese_names.taicol_search import _search_via_taicol

        assert _search_via_taicol("不存在的") == []

    @patch("app.services.gbif.match_species", return_value=_GBIF_MATCHED.copy())
    @patch(f"{_TC}.taicol_search_chinese", return_value=[_TAICOL_RESULT])
    def test_enriches_with_gbif_match(self, mock_search, mock_gbif):
        from app.services.chinese_names.taicol_search import _search_via_taicol

        result = _search_via_taicol("白頰黑雁")
        assert len(result) == 1
        assert result[0]["taxon_id"] == 2498007
        assert result[0]["common_name_zh"] == "白頰黑雁"

    @patch("app.services.gbif.match_species", return_value=_GBIF_MATCHED.copy())
    @patch(
        f"{_TC}.taicol_search_chinese",
        return_value=[
            {"scientific_name": "Branta leucopsis", "common_name_zh": "白頰黑雁"},
            {"scientific_name": "Branta leucopsis", "common_name_zh": "白頰黑雁"},
        ],
    )
    def test_deduplicates_by_taxon_id(self, mock_search, mock_gbif):
        from app.services.chinese_names.taicol_search import _search_via_taicol

        result = _search_via_taicol("白頰黑雁")
        assert len(result) == 1

    @patch(f"{_TC}._build_from_taicol", return_value={"taxon_id": -999, "scientific_name": "X"})
    @patch("app.services.gbif.match_species", return_value=None)
    @patch(f"{_TC}.taicol_search_chinese", return_value=[_TAICOL_RESULT])
    def test_falls_back_to_build_from_taicol(self, mock_search, mock_gbif, mock_build):
        from app.services.chinese_names.taicol_search import _search_via_taicol

        result = _search_via_taicol("白頰黑雁")
        assert len(result) == 1
        mock_build.assert_called_once()

    @patch(f"{_TC}.taicol_search_chinese", return_value=[{"common_name_zh": "名"}])
    def test_skips_entries_without_scientific_name(self, mock_search):
        from app.services.chinese_names.taicol_search import _search_via_taicol

        result = _search_via_taicol("名")
        assert result == []


# ---------------------------------------------------------------------------
# _search_via_taicol_stream
# ---------------------------------------------------------------------------


class TestSearchViaTaicolStream:
    @patch(f"{_TC}.taicol_search_chinese", return_value=[])
    def test_yields_nothing_when_no_results(self, mock_search):
        from app.services.chinese_names.taicol_search import _search_via_taicol_stream

        lines = list(_search_via_taicol_stream("不存在"))
        assert lines == []

    @patch("app.services.gbif.match_species", return_value=_GBIF_MATCHED.copy())
    @patch(f"{_TC}.taicol_search_chinese", return_value=[_TAICOL_RESULT])
    def test_yields_ndjson_lines(self, mock_search, mock_gbif):
        from app.services.chinese_names.taicol_search import _search_via_taicol_stream

        lines = list(_search_via_taicol_stream("白頰黑雁"))
        assert len(lines) == 1
        parsed = json.loads(lines[0])
        assert parsed["taxon_id"] == 2498007
        assert parsed["common_name_zh"] == "白頰黑雁"

    @patch("app.services.gbif.match_species", return_value=_GBIF_MATCHED.copy())
    @patch(f"{_TC}.taicol_search_chinese", return_value=[_TAICOL_RESULT])
    def test_exclude_ids_filters_results(self, mock_search, mock_gbif):
        from app.services.chinese_names.taicol_search import _search_via_taicol_stream

        lines = list(_search_via_taicol_stream("白頰黑雁", exclude_ids={2498007}))
        assert lines == []
