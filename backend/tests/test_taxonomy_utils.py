"""Tests for app.utils.taxonomy helpers."""

from app.utils.taxonomy import canonical_name, strip_genus_suffix


class TestStripGenusSuffix:
    """strip_genus_suffix: remove trailing '屬' for species-level taxa."""

    def test_species_rank_strips(self) -> None:
        assert strip_genus_suffix("狐屬", "SPECIES") == "狐"

    def test_subspecies_rank_strips(self) -> None:
        assert strip_genus_suffix("犬屬", "SUBSPECIES") == "犬"

    def test_variety_rank_strips(self) -> None:
        assert strip_genus_suffix("貓屬", "VARIETY") == "貓"

    def test_genus_rank_keeps(self) -> None:
        assert strip_genus_suffix("狐屬", "GENUS") == "狐屬"

    def test_family_rank_keeps(self) -> None:
        assert strip_genus_suffix("犬屬", "FAMILY") == "犬屬"

    def test_no_suffix_unchanged(self) -> None:
        assert strip_genus_suffix("赤狐", "SPECIES") == "赤狐"

    def test_none_returns_none(self) -> None:
        assert strip_genus_suffix(None, "SPECIES") is None

    def test_single_char_屬_keeps(self) -> None:
        assert strip_genus_suffix("屬", "SPECIES") == "屬"

    def test_lowercase_rank(self) -> None:
        assert strip_genus_suffix("狐屬", "species") == "狐"

    def test_none_rank(self) -> None:
        assert strip_genus_suffix("狐屬", None) == "狐屬"


class TestCanonicalName:
    """canonical_name: extract genus + lowercase epithets."""

    def test_binomial_with_author(self) -> None:
        assert canonical_name("Vulpes vulpes Linnaeus, 1758") == "Vulpes vulpes"

    def test_trinomial_with_author(self) -> None:
        assert canonical_name("Canis lupus familiaris Linnaeus, 1758") == "Canis lupus familiaris"

    def test_binomial_no_author(self) -> None:
        assert canonical_name("Felis catus") == "Felis catus"

    def test_genus_only(self) -> None:
        assert canonical_name("Vulpes") == "Vulpes"

    def test_author_in_parentheses(self) -> None:
        assert canonical_name("Oryctolagus cuniculus (Linnaeus, 1758)") == "Oryctolagus cuniculus"
