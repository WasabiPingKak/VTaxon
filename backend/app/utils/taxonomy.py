"""Shared taxonomy helper functions."""

_SPECIES_LEVEL_RANKS = {"SPECIES", "SUBSPECIES", "VARIETY"}


def strip_genus_suffix(zh: str | None, taxon_rank: str | None) -> str | None:
    """Strip trailing '屬' from Chinese name for species-level taxa.

    GBIF sometimes returns the genus Chinese name (e.g. '狐屬') even for
    species/subspecies records.  This helper removes the suffix so the
    display name reads '狐' instead of '狐屬'.
    """
    if zh and zh.endswith("屬") and len(zh) >= 2 and (taxon_rank or "").upper() in _SPECIES_LEVEL_RANKS:
        return zh[:-1]
    return zh


def canonical_name(scientific_name: str) -> str:
    """Extract canonical name (genus + lowercase epithets), stripping author.

    Example: "Canis lupus familiaris Linnaeus, 1758" → "Canis lupus familiaris"
    """
    parts = scientific_name.split()
    canon = [parts[0]]
    for p in parts[1:]:
        if p[0].islower():
            canon.append(p)
        else:
            break
    return " ".join(canon)
