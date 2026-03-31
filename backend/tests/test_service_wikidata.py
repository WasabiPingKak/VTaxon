"""Unit tests for wikidata service — label fetching, cache, batch, aliases."""

from unittest.mock import MagicMock, patch

import pytest
import requests

from app.services.wikidata import (
    WIKIDATA_API,
    _find_entity_by_gbif_id,
    _get_labels,
    _pick_zh_label,
    _wikidata_get,
    clear_cache,
    get_aliases_by_gbif_id,
    get_chinese_name_by_gbif_id,
    get_chinese_names_batch,
)


@pytest.fixture(autouse=True)
def _clear_lru_cache():
    """Clear LRU cache before and after every test."""
    clear_cache()
    yield
    clear_cache()


# ---------------------------------------------------------------------------
# _pick_zh_label — pure function (mock _s2twp only)
# ---------------------------------------------------------------------------


class TestPickZhLabel:
    @patch("app.services.wikidata._s2twp")
    def test_prefers_zh_tw(self, mock_cc):
        mock_cc.convert.side_effect = lambda x: x
        labels = {
            "zh-tw": {"value": "家貓"},
            "zh-hant": {"value": "家貓hant"},
            "zh": {"value": "家猫"},
        }
        assert _pick_zh_label(labels) == "家貓"
        mock_cc.convert.assert_called_once_with("家貓")

    @patch("app.services.wikidata._s2twp")
    def test_falls_back_to_zh_hant(self, mock_cc):
        mock_cc.convert.side_effect = lambda x: x
        labels = {"zh-hant": {"value": "家貓hant"}, "zh": {"value": "家猫"}}
        assert _pick_zh_label(labels) == "家貓hant"

    @patch("app.services.wikidata._s2twp")
    def test_falls_back_to_zh(self, mock_cc):
        mock_cc.convert.side_effect = lambda x: f"converted_{x}"
        labels = {"zh": {"value": "家猫"}}
        assert _pick_zh_label(labels) == "converted_家猫"

    @patch("app.services.wikidata._s2twp")
    def test_returns_none_when_empty(self, mock_cc):
        assert _pick_zh_label({}) is None
        mock_cc.convert.assert_not_called()

    @patch("app.services.wikidata._s2twp")
    def test_skips_empty_value(self, mock_cc):
        labels = {"zh-tw": {"value": ""}, "zh": {"value": "猫"}}
        mock_cc.convert.side_effect = lambda x: x
        assert _pick_zh_label(labels) == "猫"


# ---------------------------------------------------------------------------
# _wikidata_get
# ---------------------------------------------------------------------------


class TestWikidataGet:
    @patch("app.services.wikidata.external_session")
    def test_calls_session_with_correct_params(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"query": {}}
        mock_session.get.return_value = mock_resp

        params = {"action": "query", "list": "search"}
        result = _wikidata_get(params)

        mock_session.get.assert_called_once_with(
            WIKIDATA_API,
            params={"action": "query", "list": "search", "format": "json"},
            headers={"User-Agent": "VTaxon/1.0 (https://github.com/VTaxon)"},
            timeout=10,
        )
        mock_resp.raise_for_status.assert_called_once()
        assert result == {"query": {}}

    @patch("app.services.wikidata.external_session")
    def test_does_not_overwrite_existing_format(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {}
        mock_session.get.return_value = mock_resp

        params = {"action": "query", "format": "xml"}
        _wikidata_get(params)

        call_params = mock_session.get.call_args[1]["params"]
        assert call_params["format"] == "xml"


# ---------------------------------------------------------------------------
# _find_entity_by_gbif_id
# ---------------------------------------------------------------------------


class TestFindEntityByGbifId:
    @patch("app.services.wikidata.external_session")
    def test_returns_qid_on_match(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "query": {"search": [{"title": "Q42627"}]},
        }
        mock_resp.raise_for_status.return_value = None
        mock_session.get.return_value = mock_resp

        assert _find_entity_by_gbif_id(2435099) == "Q42627"

    @patch("app.services.wikidata.external_session")
    def test_returns_none_on_empty_results(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"query": {"search": []}}
        mock_resp.raise_for_status.return_value = None
        mock_session.get.return_value = mock_resp

        assert _find_entity_by_gbif_id(9999999) is None

    @patch("app.services.wikidata.external_session")
    def test_returns_none_on_request_error(self, mock_session):
        mock_session.get.side_effect = requests.RequestException("timeout")

        assert _find_entity_by_gbif_id(123) is None

    @patch("app.services.wikidata.external_session")
    def test_caches_result(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "query": {"search": [{"title": "Q100"}]},
        }
        mock_resp.raise_for_status.return_value = None
        mock_session.get.return_value = mock_resp

        assert _find_entity_by_gbif_id(555) == "Q100"
        assert _find_entity_by_gbif_id(555) == "Q100"
        # Should only call the API once due to lru_cache
        assert mock_session.get.call_count == 1


# ---------------------------------------------------------------------------
# _get_labels
# ---------------------------------------------------------------------------


class TestGetLabels:
    @patch("app.services.wikidata._s2twp")
    @patch("app.services.wikidata.external_session")
    def test_returns_zh_and_en(self, mock_session, mock_cc):
        mock_cc.convert.side_effect = lambda x: x
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "entities": {
                "Q42627": {
                    "labels": {
                        "zh-tw": {"value": "家貓"},
                        "en": {"value": "Domestic cat"},
                    }
                }
            }
        }
        mock_resp.raise_for_status.return_value = None
        mock_session.get.return_value = mock_resp

        zh, en = _get_labels("Q42627")
        assert zh == "家貓"
        assert en == "Domestic cat"

    @patch("app.services.wikidata.external_session")
    def test_returns_none_tuple_on_error(self, mock_session):
        mock_session.get.side_effect = requests.RequestException("fail")

        zh, en = _get_labels("Q42627")
        assert zh is None
        assert en is None


# ---------------------------------------------------------------------------
# get_chinese_name_by_gbif_id
# ---------------------------------------------------------------------------


class TestGetChineseNameByGbifId:
    @patch("app.services.wikidata._get_labels", return_value=("家貓", "Cat"))
    @patch("app.services.wikidata._find_entity_by_gbif_id", return_value="Q42627")
    def test_chains_find_and_labels(self, mock_find, mock_labels):
        zh, en = get_chinese_name_by_gbif_id(2435099)
        assert zh == "家貓"
        assert en == "Cat"
        mock_find.assert_called_once_with(2435099)
        mock_labels.assert_called_once_with("Q42627")

    @patch("app.services.wikidata._find_entity_by_gbif_id", return_value=None)
    def test_returns_none_tuple_when_no_entity(self, mock_find):
        zh, en = get_chinese_name_by_gbif_id(9999)
        assert zh is None
        assert en is None


# ---------------------------------------------------------------------------
# get_chinese_names_batch
# ---------------------------------------------------------------------------


class TestGetChineseNamesBatch:
    def test_empty_list_returns_empty_dict(self):
        assert get_chinese_names_batch([]) == {}

    @patch("app.services.wikidata._s2twp")
    @patch("app.services.wikidata.external_session")
    @patch("app.services.wikidata._find_entity_by_gbif_id")
    def test_batch_fetches_labels(self, mock_find, mock_session, mock_cc):
        mock_cc.convert.side_effect = lambda x: x
        mock_find.side_effect = lambda tid: {"100": "Q1", "200": "Q2"}.get(str(tid))

        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "entities": {
                "Q1": {"labels": {"zh-tw": {"value": "貓"}, "en": {"value": "Cat"}}},
                "Q2": {"labels": {"en": {"value": "Dog"}}},
            }
        }
        mock_resp.raise_for_status.return_value = None
        mock_session.get.return_value = mock_resp

        result = get_chinese_names_batch([100, 200])
        assert result[100] == ("貓", "Cat")
        assert result[200] == (None, "Dog")

    @patch("app.services.wikidata._find_entity_by_gbif_id", return_value=None)
    def test_all_unresolved_returns_empty(self, mock_find):
        assert get_chinese_names_batch([1, 2, 3]) == {}

    @patch("app.services.wikidata._s2twp")
    @patch("app.services.wikidata.external_session")
    @patch("app.services.wikidata._find_entity_by_gbif_id")
    def test_partial_resolve(self, mock_find, mock_session, mock_cc):
        mock_cc.convert.side_effect = lambda x: x
        mock_find.side_effect = lambda tid: "Q1" if tid == 100 else None

        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "entities": {
                "Q1": {"labels": {"zh": {"value": "猫"}, "en": {"value": "Cat"}}},
            }
        }
        mock_resp.raise_for_status.return_value = None
        mock_session.get.return_value = mock_resp

        result = get_chinese_names_batch([100, 200])
        assert 100 in result
        assert 200 not in result


# ---------------------------------------------------------------------------
# get_aliases_by_gbif_id
# ---------------------------------------------------------------------------


class TestGetAliasesByGbifId:
    @patch("app.services.wikidata._s2twp")
    @patch("app.services.wikidata.external_session")
    @patch("app.services.wikidata._find_entity_by_gbif_id", return_value="Q42627")
    def test_returns_comma_separated_aliases(self, mock_find, mock_session, mock_cc):
        mock_cc.convert.side_effect = lambda x: x
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "entities": {
                "Q42627": {
                    "aliases": {
                        "zh-tw": [{"value": "家貓"}, {"value": "貓咪"}],
                    }
                }
            }
        }
        mock_resp.raise_for_status.return_value = None
        mock_session.get.return_value = mock_resp

        result = get_aliases_by_gbif_id(2435099)
        assert result == "家貓, 貓咪"

    @patch("app.services.wikidata._find_entity_by_gbif_id", return_value=None)
    def test_returns_none_when_no_qid(self, mock_find):
        assert get_aliases_by_gbif_id(9999) is None

    @patch("app.services.wikidata.external_session")
    @patch("app.services.wikidata._find_entity_by_gbif_id", return_value="Q1")
    def test_returns_none_on_request_error(self, mock_find, mock_session):
        mock_session.get.side_effect = requests.RequestException("fail")
        assert get_aliases_by_gbif_id(123) is None

    @patch("app.services.wikidata._s2twp")
    @patch("app.services.wikidata.external_session")
    @patch("app.services.wikidata._find_entity_by_gbif_id", return_value="Q1")
    def test_dedupes_across_langs(self, mock_find, mock_session, mock_cc):
        mock_cc.convert.side_effect = lambda x: "same_value"
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "entities": {
                "Q1": {
                    "aliases": {
                        "zh-tw": [{"value": "a"}],
                        "zh-hant": [{"value": "b"}],
                        "zh": [{"value": "c"}],
                    }
                }
            }
        }
        mock_resp.raise_for_status.return_value = None
        mock_session.get.return_value = mock_resp

        result = get_aliases_by_gbif_id(1)
        # All convert to same value, so only one entry
        assert result == "same_value"

    @patch("app.services.wikidata._s2twp")
    @patch("app.services.wikidata.external_session")
    @patch("app.services.wikidata._find_entity_by_gbif_id", return_value="Q1")
    def test_returns_none_when_no_aliases(self, mock_find, mock_session, mock_cc):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"entities": {"Q1": {"aliases": {}}}}
        mock_resp.raise_for_status.return_value = None
        mock_session.get.return_value = mock_resp

        assert get_aliases_by_gbif_id(1) is None
