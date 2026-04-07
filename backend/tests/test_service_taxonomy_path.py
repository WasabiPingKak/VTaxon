"""Unit tests for taxonomy_path service — path ranks, tree post-processing, path_zh rebuild."""

from unittest.mock import patch

from app.models import SpeciesCache
from app.services.taxonomy_path import (
    assign_default_primary,
    compute_path_ranks,
    inject_medusozoa,
    rebuild_path_zh,
)

# ---------------------------------------------------------------------------
# compute_path_ranks — pure logic, no DB
# ---------------------------------------------------------------------------


class TestComputePathRanks:
    def test_standard_7_segment(self):
        result = compute_path_ranks(
            "Animalia|Chordata|Mammalia|Carnivora|Felidae|Felis|Felis catus",
            "SPECIES",
        )
        assert result == ["KINGDOM", "PHYLUM", "CLASS", "ORDER", "FAMILY", "GENUS", "SPECIES"]

    def test_none_path_returns_empty(self):
        assert compute_path_ranks(None, "SPECIES") == []

    def test_subphylum_3_segment(self):
        result = compute_path_ranks("Animalia|Cnidaria|Medusozoa", "SUBPHYLUM")
        assert result == ["KINGDOM", "PHYLUM", "SUBPHYLUM"]

    def test_subclass_4_segment(self):
        result = compute_path_ranks("A|B|C|D", "SUBCLASS")
        assert result == ["KINGDOM", "PHYLUM", "CLASS", "SUBCLASS"]

    def test_subspecies_8_segment(self):
        result = compute_path_ranks("A|B|C|D|E|F|G|H", "SUBSPECIES")
        assert result == [
            "KINGDOM",
            "PHYLUM",
            "CLASS",
            "ORDER",
            "FAMILY",
            "GENUS",
            "SPECIES",
            "SUBSPECIES",
        ]

    def test_variety_8_segment(self):
        result = compute_path_ranks("A|B|C|D|E|F|G|H", "VARIETY")
        assert result[-1] == "VARIETY"
        assert len(result) == 8

    def test_form_8_segment(self):
        result = compute_path_ranks("A|B|C|D|E|F|G|H", "FORM")
        assert result[-1] == "FORM"
        assert len(result) == 8

    def test_shorter_path_truncates(self):
        result = compute_path_ranks("A|B|C", "CLASS")
        assert result == ["KINGDOM", "PHYLUM", "CLASS"]


# ---------------------------------------------------------------------------
# assign_default_primary — pure logic, no DB
# ---------------------------------------------------------------------------


class TestAssignDefaultPrimary:
    def test_auto_assign_first_entry(self):
        entries = [{"user_id": "u1", "is_live_primary": False}]
        assign_default_primary(entries)
        assert entries[0]["is_live_primary"] is True

    def test_existing_primary_preserved(self):
        entries = [
            {"user_id": "u1", "is_live_primary": True},
            {"user_id": "u1", "is_live_primary": False},
        ]
        assign_default_primary(entries)
        assert entries[0]["is_live_primary"] is True
        assert entries[1]["is_live_primary"] is False

    def test_multiple_users(self):
        entries = [
            {"user_id": "u1", "is_live_primary": False},
            {"user_id": "u1", "is_live_primary": False},
            {"user_id": "u2", "is_live_primary": False},
        ]
        assign_default_primary(entries)
        assert entries[0]["is_live_primary"] is True
        assert entries[1]["is_live_primary"] is False
        assert entries[2]["is_live_primary"] is True

    def test_empty_list(self):
        entries: list[dict] = []
        assign_default_primary(entries)
        assert entries == []


# ---------------------------------------------------------------------------
# inject_medusozoa — pure logic, no DB
# ---------------------------------------------------------------------------


def _make_entry(
    taxon_path: str | None,
    path_ranks: list[str] | None = None,
    path_zh: dict | None = None,
) -> dict:
    """Helper to build a minimal tree entry dict."""
    entry: dict = {"taxon_path": taxon_path}
    if path_ranks is not None:
        entry["path_ranks"] = path_ranks
    if path_zh is not None:
        entry["path_zh"] = path_zh
    return entry


class TestInjectMedusozoa:
    def test_cnidaria_scyphozoa(self):
        entry = _make_entry(
            "Animalia|Cnidaria|Scyphozoa|O|F|G|S",
            ["KINGDOM", "PHYLUM", "CLASS", "ORDER", "FAMILY", "GENUS", "SPECIES"],
            {"kingdom": "動物界", "phylum": "刺胞動物門"},
        )
        inject_medusozoa([entry])

        assert entry["taxon_path"] == "Animalia|Cnidaria|Medusozoa|Scyphozoa|O|F|G|S"
        assert entry["path_ranks"][2] == "SUBPHYLUM"
        assert entry["path_zh"]["subphylum"] == "水母亞門"

    def test_non_cnidaria_untouched(self):
        entry = _make_entry(
            "Animalia|Chordata|Mammalia|O|F|G|S",
            ["KINGDOM", "PHYLUM", "CLASS", "ORDER", "FAMILY", "GENUS", "SPECIES"],
        )
        original_path = entry["taxon_path"]
        inject_medusozoa([entry])
        assert entry["taxon_path"] == original_path

    def test_cnidaria_anthozoa_untouched(self):
        """Anthozoa is Cnidaria but NOT a Medusozoa class."""
        entry = _make_entry(
            "Animalia|Cnidaria|Anthozoa|O|F|G|S",
            ["KINGDOM", "PHYLUM", "CLASS", "ORDER", "FAMILY", "GENUS", "SPECIES"],
        )
        original_path = entry["taxon_path"]
        inject_medusozoa([entry])
        assert entry["taxon_path"] == original_path

    def test_no_path_skipped(self):
        entry = _make_entry(None)
        inject_medusozoa([entry])
        assert entry["taxon_path"] is None

    def test_existing_path_zh_keys_preserved(self):
        entry = _make_entry(
            "Animalia|Cnidaria|Hydrozoa|O|F|G|S",
            ["KINGDOM", "PHYLUM", "CLASS", "ORDER", "FAMILY", "GENUS", "SPECIES"],
            {"kingdom": "動物界", "phylum": "刺胞動物門", "class": "水螅綱"},
        )
        inject_medusozoa([entry])
        assert entry["path_zh"]["kingdom"] == "動物界"
        assert entry["path_zh"]["phylum"] == "刺胞動物門"
        assert entry["path_zh"]["class"] == "水螅綱"
        assert entry["path_zh"]["subphylum"] == "水母亞門"


# ---------------------------------------------------------------------------
# rebuild_path_zh — needs DB for parent lookup, mock _build_path_zh
# ---------------------------------------------------------------------------


class TestRebuildPathZh:
    @patch("app.services.taxonomy_path._build_path_zh")
    def test_basic_species(self, mock_build, db_session):
        mock_build.return_value = {"kingdom": "動物界", "phylum": "脊索動物門"}
        sp = SpeciesCache(
            taxon_id=9999,
            scientific_name="Felis catus",
            taxon_rank="SPECIES",
            kingdom="Animalia",
            phylum="Chordata",
            class_="Mammalia",
            order_="Carnivora",
            family="Felidae",
            genus="Felis",
        )
        db_session.add(sp)
        db_session.flush()

        result = rebuild_path_zh(sp)

        assert result == {"kingdom": "動物界", "phylum": "脊索動物門"}
        assert sp.path_zh == result
        mock_build.assert_called_once()
        call_data = mock_build.call_args[0][0]
        assert call_data["kingdom"] == "Animalia"
        assert call_data["genus"] == "Felis"

    @patch("app.services.taxonomy_path._build_path_zh")
    def test_subspecies_with_parent(self, mock_build, db_session):
        mock_build.return_value = {"kingdom": "動物界"}
        # Create parent species in DB
        parent = SpeciesCache(
            taxon_id=9694,
            scientific_name="Canis lupus",
            taxon_rank="SPECIES",
        )
        db_session.add(parent)
        db_session.flush()

        sp = SpeciesCache(
            taxon_id=9695,
            scientific_name="Canis lupus familiaris",
            taxon_rank="SUBSPECIES",
        )
        db_session.add(sp)
        db_session.flush()

        rebuild_path_zh(sp)

        call_data = mock_build.call_args[0][0]
        assert call_data["speciesKey"] == 9694
        assert call_data["species"] == "Canis lupus"

    @patch("app.services.taxonomy_path._build_path_zh")
    def test_subspecies_no_parent(self, mock_build, db_session):
        mock_build.return_value = {"kingdom": "動物界"}
        sp = SpeciesCache(
            taxon_id=9696,
            scientific_name="Canis lupus familiaris",
            taxon_rank="SUBSPECIES",
        )
        db_session.add(sp)
        db_session.flush()

        rebuild_path_zh(sp)

        call_data = mock_build.call_args[0][0]
        assert "speciesKey" not in call_data

    @patch("app.services.taxonomy_path._build_path_zh")
    def test_returns_none_when_build_returns_none(self, mock_build, db_session):
        mock_build.return_value = None
        sp = SpeciesCache(
            taxon_id=9997,
            scientific_name="Unknown sp.",
            taxon_rank="SPECIES",
            path_zh={"old": "value"},
        )
        db_session.add(sp)
        db_session.flush()

        result = rebuild_path_zh(sp)

        assert result is None
        # path_zh should NOT be overwritten when result is falsy
        assert sp.path_zh == {"old": "value"}
