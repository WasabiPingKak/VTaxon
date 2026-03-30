"""Unit tests for taxonomy_zh service — pure function lookups, no mocking needed."""

from app.services.taxonomy_zh import (
    get_parent_species_zh_by_name,
    get_species_name_override,
    get_species_zh_override,
    get_taxonomy_zh,
    get_taxonomy_zh_for_ranks,
)

# ---------------------------------------------------------------------------
# get_taxonomy_zh
# ---------------------------------------------------------------------------


class TestGetTaxonomyZh:
    def test_known_class(self):
        assert get_taxonomy_zh("Mammalia") == "哺乳綱"

    def test_known_family(self):
        assert get_taxonomy_zh("Felidae") == "貓科"

    def test_known_genus(self):
        assert get_taxonomy_zh("Canis") == "犬屬"

    def test_known_kingdom(self):
        assert get_taxonomy_zh("Animalia") == "動物界"

    def test_unknown_name(self):
        assert get_taxonomy_zh("Nonexistentia") is None


# ---------------------------------------------------------------------------
# get_species_zh_override
# ---------------------------------------------------------------------------


class TestGetSpeciesZhOverride:
    def test_emperor_penguin(self):
        assert get_species_zh_override(2481661) == "皇帝企鵝"

    def test_wolf(self):
        assert get_species_zh_override(5219173) == "狼"

    def test_pallas_cat(self):
        assert get_species_zh_override(2435023) == "兔猻"

    def test_unknown_id(self):
        assert get_species_zh_override(9999999) is None


# ---------------------------------------------------------------------------
# get_parent_species_zh_by_name
# ---------------------------------------------------------------------------


class TestGetParentSpeciesZhByName:
    def test_canis_lupus(self):
        assert get_parent_species_zh_by_name("Canis lupus") == "狼"

    def test_sus_scrofa(self):
        assert get_parent_species_zh_by_name("Sus scrofa") == "野豬"

    def test_unknown_binomial(self):
        assert get_parent_species_zh_by_name("Homo sapiens") is None


# ---------------------------------------------------------------------------
# get_species_name_override
# ---------------------------------------------------------------------------


class TestGetSpeciesNameOverride:
    def test_pallas_cat_name(self):
        assert get_species_name_override(2435023) == "Otocolobus manul"

    def test_unknown_id(self):
        assert get_species_name_override(9999999) is None


# ---------------------------------------------------------------------------
# get_taxonomy_zh_for_ranks
# ---------------------------------------------------------------------------


class TestGetTaxonomyZhForRanks:
    def test_all_ranks_provided(self):
        result = get_taxonomy_zh_for_ranks(
            kingdom="Animalia",
            phylum="Chordata",
            class_="Mammalia",
            order="Carnivora",
            family="Felidae",
            genus="Felis",
        )
        assert result["kingdom_zh"] == "動物界"
        assert result["phylum_zh"] == "脊索動物門"
        assert result["class_zh"] == "哺乳綱"
        assert result["order_zh"] == "食肉目"
        assert result["family_zh"] == "貓科"
        assert result["genus_zh"] == "貓屬"

    def test_partial_ranks(self):
        result = get_taxonomy_zh_for_ranks(
            kingdom="Animalia",
            phylum="Chordata",
            class_=None,
            order=None,
            family="Canidae",
            genus=None,
        )
        assert result["kingdom_zh"] == "動物界"
        assert result["phylum_zh"] == "脊索動物門"
        assert result["class_zh"] is None
        assert result["order_zh"] is None
        assert result["family_zh"] == "犬科"
        assert result["genus_zh"] is None

    def test_all_none(self):
        result = get_taxonomy_zh_for_ranks()
        assert all(v is None for v in result.values())
        assert len(result) == 6

    def test_unknown_values_return_none(self):
        result = get_taxonomy_zh_for_ranks(
            kingdom="FakeKingdom",
            phylum=None,
            class_=None,
            order=None,
            family=None,
            genus=None,
        )
        assert result["kingdom_zh"] is None
