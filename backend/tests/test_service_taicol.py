"""Unit tests for taicol service — Chinese name search, scientific name lookup, higher taxa."""

from unittest.mock import MagicMock, patch

import pytest
import requests

from app.services.taicol import (
    TAICOL_BASE,
    clear_cache,
    get_chinese_name,
    get_higher_taxa_zh,
    search_by_chinese,
    search_by_scientific_name,
)


@pytest.fixture(autouse=True)
def _clear_lru_cache():
    """Clear LRU cache before and after every test."""
    clear_cache()
    yield
    clear_cache()


# ---------------------------------------------------------------------------
# search_by_chinese
# ---------------------------------------------------------------------------


class TestSearchByChinese:
    @patch("app.services.taicol.external_session")
    def test_primary_common_name_search(self, mock_session):
        """Primary search returns results; supplement not needed."""
        resp_common = MagicMock()
        resp_common.status_code = 200
        resp_common.json.return_value = {
            "data": [
                {
                    "simple_name": "Felis catus",
                    "common_name_c": "家貓",
                    "alternative_name_c": None,
                    "rank": "Species",
                    "kingdom": "Animalia",
                    "taxon_id": "t001",
                },
            ]
        }
        # supplement response (won't be collected since limit=1 reached)
        resp_group = MagicMock()
        resp_group.status_code = 200
        resp_group.json.return_value = {"data": [], "info": {"total": 0}}

        mock_session.get.side_effect = [resp_common, resp_group]

        results = search_by_chinese("貓", limit=1)
        assert len(results) == 1
        assert results[0]["scientific_name"] == "Felis catus"
        assert results[0]["common_name_zh"] == "家貓"
        assert results[0]["taicol_taxon_id"] == "t001"

    @patch("app.services.taicol.external_session")
    def test_supplement_with_taxon_group(self, mock_session):
        """Primary returns fewer than limit; supplement adds more."""
        resp_common = MagicMock()
        resp_common.status_code = 200
        resp_common.json.return_value = {
            "data": [
                {
                    "simple_name": "Sp A",
                    "common_name_c": "A中文",
                    "alternative_name_c": None,
                    "rank": "Species",
                    "kingdom": "Animalia",
                    "taxon_id": "t1",
                },
            ]
        }
        resp_group = MagicMock()
        resp_group.status_code = 200
        resp_group.json.return_value = {
            "data": [
                {
                    "simple_name": "Sp B",
                    "common_name_c": "B中文",
                    "alternative_name_c": None,
                    "rank": "Species",
                    "kingdom": "Animalia",
                    "taxon_id": "t2",
                },
            ],
            "info": {"total": 1},
        }
        mock_session.get.side_effect = [resp_common, resp_group]

        results = search_by_chinese("某物種", limit=10)
        assert len(results) == 2
        names = {r["scientific_name"] for r in results}
        assert names == {"Sp A", "Sp B"}

    @patch("app.services.taicol.external_session")
    def test_dedupes_by_scientific_name(self, mock_session):
        """Same scientific_name from both queries appears only once."""
        entry = {
            "simple_name": "Dup",
            "common_name_c": "重複",
            "alternative_name_c": None,
            "rank": "Species",
            "kingdom": "K",
            "taxon_id": "t",
        }
        resp_common = MagicMock()
        resp_common.status_code = 200
        resp_common.json.return_value = {"data": [entry]}

        resp_group = MagicMock()
        resp_group.status_code = 200
        resp_group.json.return_value = {"data": [entry], "info": {"total": 1}}

        mock_session.get.side_effect = [resp_common, resp_group]

        results = search_by_chinese("重複", limit=10)
        assert len(results) == 1

    @patch("app.services.taicol.external_session")
    def test_discards_taxon_group_if_total_too_large(self, mock_session):
        """Taxon group results discarded when total > 5000."""
        resp_common = MagicMock()
        resp_common.status_code = 200
        resp_common.json.return_value = {"data": []}

        resp_group = MagicMock()
        resp_group.status_code = 200
        resp_group.json.return_value = {
            "data": [
                {
                    "simple_name": "Big",
                    "common_name_c": "大量",
                    "alternative_name_c": None,
                    "rank": "Species",
                    "kingdom": "K",
                    "taxon_id": "t",
                },
            ],
            "info": {"total": 124000},
        }
        mock_session.get.side_effect = [resp_common, resp_group]

        results = search_by_chinese("亂搜", limit=10)
        assert len(results) == 0

    @patch("app.services.taicol.external_session")
    def test_handles_common_name_request_error(self, mock_session):
        """Primary search fails; supplement still runs."""
        mock_session.get.side_effect = [
            requests.RequestException("timeout"),
            MagicMock(
                status_code=200,
                json=MagicMock(
                    return_value={
                        "data": [
                            {
                                "simple_name": "Ok",
                                "common_name_c": "好",
                                "alternative_name_c": None,
                                "rank": "S",
                                "kingdom": "K",
                                "taxon_id": "t",
                            }
                        ],
                        "info": {"total": 1},
                    }
                ),
            ),
        ]

        results = search_by_chinese("搜", limit=10)
        assert len(results) == 1

    @patch("app.services.taicol.external_session")
    def test_respects_limit(self, mock_session):
        """Results are capped at limit."""
        entries = [
            {
                "simple_name": f"Sp{i}",
                "common_name_c": f"中{i}",
                "alternative_name_c": None,
                "rank": "S",
                "kingdom": "K",
                "taxon_id": f"t{i}",
            }
            for i in range(20)
        ]
        resp_common = MagicMock()
        resp_common.status_code = 200
        resp_common.json.return_value = {"data": entries}

        resp_group = MagicMock()
        resp_group.status_code = 200
        resp_group.json.return_value = {"data": [], "info": {"total": 0}}

        mock_session.get.side_effect = [resp_common, resp_group]

        results = search_by_chinese("中", limit=5)
        assert len(results) == 5


# ---------------------------------------------------------------------------
# get_chinese_name
# ---------------------------------------------------------------------------


class TestGetChineseName:
    @patch("app.services.taicol.external_session")
    def test_returns_name_and_alternative(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"data": [{"common_name_c": "家貓", "alternative_name_c": "貓咪,喵"}]}
        mock_session.get.return_value = mock_resp

        zh, alt = get_chinese_name("Felis catus")
        assert zh == "家貓"
        assert alt == "貓咪,喵"

    @patch("app.services.taicol.external_session")
    def test_returns_none_on_non_200(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.status_code = 404
        mock_session.get.return_value = mock_resp

        zh, alt = get_chinese_name("Unknown sp")
        assert zh is None
        assert alt is None

    @patch("app.services.taicol.external_session")
    def test_returns_none_on_empty_data(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"data": []}
        mock_session.get.return_value = mock_resp

        zh, alt = get_chinese_name("Nothing")
        assert zh is None
        assert alt is None

    @patch("app.services.taicol.external_session")
    def test_returns_none_on_request_error(self, mock_session):
        mock_session.get.side_effect = requests.RequestException("fail")

        zh, alt = get_chinese_name("Error sp")
        assert zh is None
        assert alt is None

    @patch("app.services.taicol.external_session")
    def test_caches_result(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"data": [{"common_name_c": "貓", "alternative_name_c": None}]}
        mock_session.get.return_value = mock_resp

        get_chinese_name("Felis catus cached")
        get_chinese_name("Felis catus cached")
        assert mock_session.get.call_count == 1


# ---------------------------------------------------------------------------
# search_by_scientific_name
# ---------------------------------------------------------------------------


class TestSearchByScientificName:
    @patch("app.services.taicol.external_session")
    def test_returns_list_of_dicts(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "data": [
                {
                    "simple_name": "Felis catus",
                    "common_name_c": "家貓",
                    "rank": "Species",
                    "kingdom": "Animalia",
                    "taxon_id": "t1",
                },
            ]
        }
        mock_session.get.return_value = mock_resp

        results = search_by_scientific_name("Felis catus")
        assert len(results) == 1
        assert results[0]["scientific_name"] == "Felis catus"
        assert results[0]["common_name_zh"] == "家貓"

    @patch("app.services.taicol.external_session")
    def test_returns_empty_on_non_200(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_session.get.return_value = mock_resp

        assert search_by_scientific_name("Unknown") == []

    @patch("app.services.taicol.external_session")
    def test_returns_empty_on_request_error(self, mock_session):
        mock_session.get.side_effect = requests.RequestException("timeout")

        assert search_by_scientific_name("Error") == []


# ---------------------------------------------------------------------------
# get_higher_taxa_zh
# ---------------------------------------------------------------------------


class TestGetHigherTaxaZh:
    @patch("app.services.taicol.external_session")
    def test_returns_hierarchy(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "data": [
                {"rank": "Kingdom", "simple_name": "Animalia", "common_name_c": "動物界"},
                {"rank": "Phylum", "simple_name": "Chordata", "common_name_c": "脊索動物門"},
            ]
        }
        mock_session.get.return_value = mock_resp

        results = get_higher_taxa_zh("t001")
        assert len(results) == 2
        assert results[0] == {"rank": "Kingdom", "name": "Animalia", "name_zh": "動物界"}
        assert results[1] == {"rank": "Phylum", "name": "Chordata", "name_zh": "脊索動物門"}

    @patch("app.services.taicol.external_session")
    def test_returns_empty_on_non_200(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.status_code = 404
        mock_session.get.return_value = mock_resp

        assert get_higher_taxa_zh("bad_id") == []

    @patch("app.services.taicol.external_session")
    def test_returns_empty_on_request_error(self, mock_session):
        mock_session.get.side_effect = requests.RequestException("fail")

        assert get_higher_taxa_zh("t001") == []

    @patch("app.services.taicol.external_session")
    def test_correct_api_url_called(self, mock_session):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"data": []}
        mock_session.get.return_value = mock_resp

        get_higher_taxa_zh("t123")
        mock_session.get.assert_called_once_with(
            f"{TAICOL_BASE}/higherTaxa",
            params={"taxon_id": "t123"},
            timeout=10,
        )
