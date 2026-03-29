"""Unit tests for app.services.gbif — GBIF API client, Chinese names, helpers."""

from unittest.mock import MagicMock, patch

# ---------------------------------------------------------------------------
# Pure functions (no DB / HTTP needed)
# ---------------------------------------------------------------------------


class TestHasCjk:
    """_has_cjk: CJK character detection."""

    def test_chinese_text(self, app):
        with app.app_context():
            from app.services.gbif import _has_cjk

            assert _has_cjk("貓") is True
            assert _has_cjk("台灣黑熊") is True

    def test_mixed_text(self, app):
        with app.app_context():
            from app.services.gbif import _has_cjk

            assert _has_cjk("hello貓") is True

    def test_latin_only(self, app):
        with app.app_context():
            from app.services.gbif import _has_cjk

            assert _has_cjk("Felis catus") is False

    def test_empty(self, app):
        with app.app_context():
            from app.services.gbif import _has_cjk

            assert _has_cjk("") is False


class TestCleanAltNames:
    """clean_alt_names: alternative name dedup and filtering."""

    def test_removes_duplicate_of_primary(self, app):
        with app.app_context():
            from app.services.gbif import clean_alt_names

            result = clean_alt_names("家貓, 貓咪", "家貓")
            assert result == "貓咪"

    def test_removes_genus_suffix(self, app):
        with app.app_context():
            from app.services.gbif import clean_alt_names

            result = clean_alt_names("獰貓屬, 獰貓", "獰貓")
            assert result is None

    def test_removes_family_suffix(self, app):
        with app.app_context():
            from app.services.gbif import clean_alt_names

            result = clean_alt_names("貓科, 虎", None)
            assert result == "虎"

    def test_removes_non_cjk(self, app):
        with app.app_context():
            from app.services.gbif import clean_alt_names

            result = clean_alt_names("Domestic cat, 家貓", None)
            assert result == "家貓"

    def test_returns_none_for_empty(self, app):
        with app.app_context():
            from app.services.gbif import clean_alt_names

            assert clean_alt_names(None, "貓") is None
            assert clean_alt_names("", "貓") is None

    def test_returns_none_when_all_filtered(self, app):
        with app.app_context():
            from app.services.gbif import clean_alt_names

            assert clean_alt_names("貓科", None) is None


class TestBuildTaxonPath:
    """_build_taxon_path: materialized path construction."""

    def test_species_path(self, app):
        with app.app_context():
            from app.services.gbif import _build_taxon_path

            data = {
                "kingdom": "Animalia",
                "phylum": "Chordata",
                "class": "Mammalia",
                "order": "Carnivora",
                "family": "Felidae",
                "genus": "Felis",
                "species": "Felis catus",
            }
            path = _build_taxon_path(data)
            assert path == "Animalia|Chordata|Mammalia|Carnivora|Felidae|Felis|Felis catus"

    def test_genus_path_stops_early(self, app):
        with app.app_context():
            from app.services.gbif import _build_taxon_path

            data = {
                "kingdom": "Animalia",
                "phylum": "Chordata",
                "class": "Mammalia",
                "order": "Carnivora",
                "family": "Felidae",
                "genus": "Felis",
            }
            path = _build_taxon_path(data)
            assert path == "Animalia|Chordata|Mammalia|Carnivora|Felidae|Felis"

    def test_missing_middle_ranks(self, app):
        """Missing ranks should be empty strings, preserving position."""
        with app.app_context():
            from app.services.gbif import _build_taxon_path

            data = {
                "kingdom": "Animalia",
                "phylum": "Chordata",
                "family": "Arandaspididae",
                "genus": "Sacabambaspis",
            }
            path = _build_taxon_path(data)
            assert path == "Animalia|Chordata|||Arandaspididae|Sacabambaspis"

    def test_returns_none_for_empty_data(self, app):
        with app.app_context():
            from app.services.gbif import _build_taxon_path

            assert _build_taxon_path({}) is None

    def test_subspecies_appends_trinomial(self, app):
        with app.app_context():
            from app.services.gbif import _build_taxon_path

            data = {
                "kingdom": "Animalia",
                "phylum": "Chordata",
                "class": "Mammalia",
                "order": "Carnivora",
                "family": "Felidae",
                "genus": "Felis",
                "species": "Felis silvestris",
                "rank": "SUBSPECIES",
                "canonicalName": "Felis silvestris catus",
            }
            path = _build_taxon_path(data)
            assert path.endswith("|Felis silvestris|Felis silvestris catus")

    def test_subphylum_appends_canonical(self, app):
        with app.app_context():
            from app.services.gbif import _build_taxon_path

            data = {
                "kingdom": "Animalia",
                "phylum": "Cnidaria",
                "rank": "SUBPHYLUM",
                "canonicalName": "Medusozoa",
            }
            path = _build_taxon_path(data)
            assert path == "Animalia|Cnidaria|Medusozoa"


class TestGbifResultToDict:
    """_gbif_result_to_dict: GBIF API result → internal dict format."""

    def test_basic_conversion(self, app):
        with app.app_context():
            from app.services.gbif import _gbif_result_to_dict

            raw = {
                "scientificName": "Felis catus Linnaeus, 1758",
                "canonicalName": "Felis catus",
                "vernacularName": "Domestic Cat",
                "rank": "SPECIES",
                "kingdom": "Animalia",
                "phylum": "Chordata",
                "class": "Mammalia",
                "order": "Carnivora",
                "family": "Felidae",
                "genus": "Felis",
                "species": "Felis catus",
            }
            d = _gbif_result_to_dict(raw, 9685)
            assert d["taxon_id"] == 9685
            assert d["scientific_name"] == "Felis catus Linnaeus, 1758"
            assert d["canonical_name"] == "Felis catus"
            assert d["common_name_en"] == "Domestic Cat"
            assert d["common_name_zh"] is None
            assert d["taxon_rank"] == "SPECIES"
            assert d["kingdom"] == "Animalia"
            assert d["taxon_path"] is not None


# ---------------------------------------------------------------------------
# Functions requiring HTTP mocking
# ---------------------------------------------------------------------------


class TestMatchSpecies:
    """match_species: GBIF /species/match wrapper."""

    def test_exact_match(self, app):
        with app.app_context():
            from app.services.gbif import match_species

            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.raise_for_status = MagicMock()
            mock_resp.json.return_value = {
                "usageKey": 9685,
                "matchType": "EXACT",
                "confidence": 99,
                "status": "ACCEPTED",
                "rank": "SPECIES",
                "scientificName": "Felis catus",
                "canonicalName": "Felis catus",
                "kingdom": "Animalia",
                "phylum": "Chordata",
                "class": "Mammalia",
                "order": "Carnivora",
                "family": "Felidae",
                "genus": "Felis",
                "species": "Felis catus",
            }

            with patch("app.services.gbif.external_session.get", return_value=mock_resp):
                with patch("app.services.chinese_names._enrich_chinese_names"):
                    result = match_species("Felis catus")
                    assert result is not None
                    assert result["taxon_id"] == 9685
                    assert result["match_type"] == "EXACT"
                    assert result["confidence"] == 99

    def test_no_match(self, app):
        with app.app_context():
            from app.services.gbif import match_species

            mock_resp = MagicMock()
            mock_resp.raise_for_status = MagicMock()
            mock_resp.json.return_value = {"matchType": "NONE"}

            with patch("app.services.gbif.external_session.get", return_value=mock_resp):
                result = match_species("NotARealSpecies")
                assert result is None

    def test_synonym_resolves_to_accepted(self, app):
        with app.app_context():
            from app.services.gbif import match_species

            mock_resp = MagicMock()
            mock_resp.raise_for_status = MagicMock()
            mock_resp.json.return_value = {
                "usageKey": 100,
                "matchType": "EXACT",
                "confidence": 95,
                "status": "SYNONYM",
                "acceptedUsageKey": 200,
                "canonicalName": "Old name",
                "kingdom": "Animalia",
            }

            resolved = {
                "taxon_id": 200,
                "scientific_name": "Accepted name",
                "canonical_name": "Accepted name",
                "common_name_en": None,
                "common_name_zh": None,
                "taxon_rank": "SPECIES",
                "kingdom": "Animalia",
                "taxon_path": "Animalia",
            }

            with patch("app.services.gbif.external_session.get", return_value=mock_resp):
                with patch("app.services.gbif._resolve_synonym", return_value=resolved):
                    with patch("app.services.chinese_names._enrich_chinese_names"):
                        result = match_species("Old name")
                        assert result is not None
                        assert result["taxon_id"] == 200
                        assert result["match_type"] == "EXACT"


class TestResolveSynonym:
    """_resolve_synonym: synonym → accepted species via GBIF API."""

    def test_resolves_accepted(self, app):
        with app.app_context():
            from app.services.gbif import _resolve_synonym

            # First call: get synonym details (returns acceptedKey)
            resp1 = MagicMock()
            resp1.status_code = 200
            resp1.json.return_value = {
                "key": 100,
                "acceptedKey": 200,
                "canonicalName": "Synonym name",
            }
            # Second call: get accepted species
            resp2 = MagicMock()
            resp2.status_code = 200
            resp2.json.return_value = {
                "key": 200,
                "scientificName": "Accepted sp.",
                "canonicalName": "Accepted sp.",
                "rank": "SPECIES",
                "kingdom": "Animalia",
                "phylum": "Chordata",
                "class": "Mammalia",
                "order": "Carnivora",
                "family": "Felidae",
                "genus": "Felis",
                "species": "Accepted sp.",
            }

            with patch("app.services.gbif.external_session.get", side_effect=[resp1, resp2]):
                result = _resolve_synonym(100, "Synonym name")
                assert result is not None
                assert result["taxon_id"] == 200
                assert result["synonym_name"] == "Synonym name"

    def test_skips_if_already_seen(self, app):
        with app.app_context():
            from app.services.gbif import _resolve_synonym

            resp1 = MagicMock()
            resp1.status_code = 200
            resp1.json.return_value = {"key": 100, "acceptedKey": 200}

            with patch("app.services.gbif.external_session.get", return_value=resp1):
                result = _resolve_synonym(100, "X", seen_keys={200})
                assert result is None

    def test_returns_none_on_404(self, app):
        with app.app_context():
            from app.services.gbif import _resolve_synonym

            resp = MagicMock()
            resp.status_code = 404

            with patch("app.services.gbif.external_session.get", return_value=resp):
                result = _resolve_synonym(999, "Ghost")
                assert result is None


class TestResolveChineseName:
    """_resolve_chinese_name: fallback chain (override → TaiCOL → Wikidata)."""

    def test_override_wins(self, app):
        with app.app_context():
            from app.services.gbif import _resolve_chinese_name

            _resolve_chinese_name.cache_clear()

            with patch("app.services.chinese_names.get_species_zh_override", return_value="手動覆蓋"):
                result = _resolve_chinese_name(9685, "Felis catus")
                assert result == "手動覆蓋"

    def test_taicol_fallback(self, app):
        with app.app_context():
            from app.services.gbif import _resolve_chinese_name

            _resolve_chinese_name.cache_clear()

            with patch("app.services.chinese_names.get_species_zh_override", return_value=None):
                with patch("app.services.chinese_names.taicol_get_chinese_name", return_value=("家貓", None)):
                    result = _resolve_chinese_name(9685, "Felis catus")
                    assert result == "家貓"

    def test_wikidata_fallback(self, app):
        with app.app_context():
            from app.services.gbif import _resolve_chinese_name

            _resolve_chinese_name.cache_clear()

            with patch("app.services.chinese_names.get_species_zh_override", return_value=None):
                with patch("app.services.chinese_names.taicol_get_chinese_name", return_value=(None, None)):
                    with patch("app.services.chinese_names.get_chinese_name_by_gbif_id", return_value=("貓", "Cat")):
                        result = _resolve_chinese_name(9685, "Felis catus")
                        assert result == "貓"

    def test_returns_none_when_all_fail(self, app):
        with app.app_context():
            from app.services.gbif import _resolve_chinese_name

            _resolve_chinese_name.cache_clear()

            with patch("app.services.chinese_names.get_species_zh_override", return_value=None):
                with patch("app.services.chinese_names.taicol_get_chinese_name", return_value=(None, None)):
                    with patch("app.services.chinese_names.get_chinese_name_by_gbif_id", return_value=(None, None)):
                        result = _resolve_chinese_name(99999, "Unknown sp.")
                        assert result is None


class TestSuggestSpecies:
    """suggest_species: GBIF /species/suggest wrapper with filtering."""

    def test_filters_accepted_species(self, app):
        with app.app_context():
            from app.services.gbif import suggest_species

            mock_resp = MagicMock()
            mock_resp.raise_for_status = MagicMock()
            mock_resp.json.return_value = [
                {
                    "key": 1,
                    "status": "ACCEPTED",
                    "rank": "SPECIES",
                    "scientificName": "Felis catus",
                    "canonicalName": "Felis catus",
                    "kingdom": "Animalia",
                    "phylum": "Chordata",
                    "class": "Mammalia",
                    "order": "Carnivora",
                    "family": "Felidae",
                    "genus": "Felis",
                    "species": "Felis catus",
                },
                {
                    "key": 2,
                    "status": "ACCEPTED",
                    "rank": "UNRANKED",
                    "scientificName": "Bad rank",
                },
            ]

            with patch("app.services.gbif.external_session.get", return_value=mock_resp):
                with patch("app.services.chinese_names._enrich_chinese_names"):
                    results = suggest_species("Felis", limit=10)
                    assert len(results) == 1
                    assert results[0]["taxon_id"] == 1

    def test_deduplicates_by_key(self, app):
        with app.app_context():
            from app.services.gbif import suggest_species

            mock_resp = MagicMock()
            mock_resp.raise_for_status = MagicMock()
            mock_resp.json.return_value = [
                {
                    "key": 1,
                    "status": "ACCEPTED",
                    "rank": "SPECIES",
                    "scientificName": "Sp A",
                    "canonicalName": "Sp A",
                    "kingdom": "Animalia",
                },
                {
                    "key": 1,
                    "status": "ACCEPTED",
                    "rank": "SPECIES",
                    "scientificName": "Sp A duplicate",
                },
            ]

            with patch("app.services.gbif.external_session.get", return_value=mock_resp):
                with patch("app.services.chinese_names._enrich_chinese_names"):
                    results = suggest_species("Sp", limit=10)
                    assert len(results) == 1


class TestSearchSpecies:
    """search_species: routing by query language."""

    def test_cjk_routes_to_local_and_taicol(self, app):
        with app.app_context():
            from app.services.gbif import search_species

            local_result = {"taxon_id": 1, "scientific_name": "Felis catus"}
            taicol_result = {"taxon_id": 2, "scientific_name": "Canis lupus"}

            with patch("app.services.gbif._search_breeds", return_value=[]):
                with patch("app.services.gbif._search_local_cache_chinese", return_value=[local_result]):
                    with patch("app.services.chinese_names._search_via_taicol", return_value=[taicol_result]):
                        results = search_species("貓")
                        assert len(results) == 2
                        ids = [r["taxon_id"] for r in results]
                        assert 1 in ids
                        assert 2 in ids

    def test_cjk_deduplicates_taicol(self, app):
        with app.app_context():
            from app.services.gbif import search_species

            same_result = {"taxon_id": 1, "scientific_name": "Felis catus"}

            with patch("app.services.gbif._search_breeds", return_value=[]):
                with patch("app.services.gbif._search_local_cache_chinese", return_value=[same_result]):
                    with patch("app.services.chinese_names._search_via_taicol", return_value=[same_result]):
                        results = search_species("貓")
                        assert len(results) == 1

    def test_latin_routes_to_suggest(self, app):
        with app.app_context():
            from app.services.gbif import search_species

            suggest_result = {"taxon_id": 1, "scientific_name": "Felis catus"}

            with patch("app.services.gbif._search_breeds", return_value=[]):
                with patch("app.services.gbif.suggest_species", return_value=[suggest_result]):
                    results = search_species("Felis")
                    assert len(results) == 1
                    assert results[0]["taxon_id"] == 1
