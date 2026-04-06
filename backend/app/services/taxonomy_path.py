"""Taxonomy path construction utilities.

Builds and realigns materialized paths (taxon_path, path_zh) used for
tree visualisation. Extracted from species_cache.py for separation of concerns.
"""

import re
from typing import Any

from ..models import SpeciesCache
from .taxonomy_zh import get_taxonomy_zh

RANK_ORDER = ["kingdom", "phylum", "class", "order", "family", "genus", "species"]


def _build_taxon_path(data: dict[str, Any]) -> str | None:
    """Build materialized path from GBIF hierarchy: Kingdom|Phylum|Class|...|Species.

    Always includes all rank positions (empty string for missing ranks) up to
    the deepest known rank so that position index == rank index.
    e.g. Animalia|Chordata|||Arandaspididae|Sacabambaspis

    For SUBPHYLUM/SUBCLASS rank taxa, appends the canonical name after the
    standard hierarchy so the path is distinguishable from the parent rank.
    e.g. Medusozoa -> Animalia|Cnidaria|Medusozoa
         Hydroidolina -> Animalia|Cnidaria|Hydrozoa|Hydroidolina
    """
    field_map = {
        "kingdom": "kingdom",
        "phylum": "phylum",
        "class": "class",
        "order": "order",
        "family": "family",
        "genus": "genus",
        "species": "species",
    }
    parts = []
    last_non_empty = -1
    for i, rank in enumerate(RANK_ORDER):
        value = data.get(field_map[rank])
        parts.append(value or "")
        if value:
            last_non_empty = i
    if last_non_empty < 0:
        return None
    path = "|".join(parts[: last_non_empty + 1])

    # For SUBPHYLUM/SUBCLASS, append canonical name so the path includes
    # the sub-rank taxon itself (not just its parent hierarchy)
    taxon_rank = (data.get("rank") or "").upper()
    if taxon_rank in ("SUBPHYLUM", "SUBCLASS"):
        canonical = data.get("canonicalName") or data.get("scientificName", "")
        if canonical:
            # Strip author citation
            canonical = re.sub(r"\s+\(?[A-Z][\w.\s,\'\'-]*,\s*\d{4}\)?$", "", canonical).strip()
            if canonical and not path.endswith(canonical):
                path = path + "|" + canonical
    elif taxon_rank in ("SUBSPECIES", "VARIETY", "FORM"):
        # species field (field_map) already provides the parent binomial (7th segment).
        # Append the full trinomial (canonicalName) as the 8th segment.
        canonical = data.get("canonicalName") or data.get("scientificName", "")
        if canonical:
            canonical = re.sub(r"\s+\(?[A-Z][\w.\s,\'\'-]*,\s*\d{4}\)?$", "", canonical).strip()
            if canonical and not path.endswith(canonical):
                path = path + "|" + canonical

    return path


def _build_path_zh(data: dict[str, Any]) -> dict[str, str | None]:
    """Build path_zh dict from static table + Wikidata fallback.

    Called once when a species is first cached, so Wikidata HTTP calls
    only happen at cache-write time, never on the /tree read path.
    """
    from .chinese_names import _resolve_chinese_name, _resolve_rank_zh

    result = {}
    for field, rank in [
        ("kingdom", "KINGDOM"),
        ("phylum", "PHYLUM"),
        ("class", "CLASS"),
        ("order", "ORDER"),
        ("family", "FAMILY"),
        ("genus", "GENUS"),
    ]:
        latin = data.get(field) or data.get(field + "_")
        if latin:
            zh = get_taxonomy_zh(latin) or _resolve_rank_zh(latin, rank=rank)
            result[field] = zh

    # For SUBPHYLUM/SUBCLASS taxa, add sub-rank zh from static table
    taxon_rank = (data.get("taxon_rank") or data.get("rank") or "").upper()
    if taxon_rank == "SUBPHYLUM":
        canonical = data.get("canonical_name") or data.get("canonicalName") or data.get("scientific_name", "")
        if canonical:
            zh = get_taxonomy_zh(canonical)
            if zh:
                result["subphylum"] = zh
    elif taxon_rank == "SUBCLASS":
        canonical = data.get("canonical_name") or data.get("canonicalName") or data.get("scientific_name", "")
        if canonical:
            zh = get_taxonomy_zh(canonical)
            if zh:
                result["subclass"] = zh
    elif taxon_rank in ("SUBSPECIES", "VARIETY", "FORM"):
        # Resolve parent species Chinese name for the "species" row in path display
        species_key = data.get("speciesKey") or data.get("species_key")
        species_binomial = data.get("species") or data.get("species_binomial")
        if species_key:
            species_zh = _resolve_chinese_name(species_key, species_binomial)
            if species_zh:
                result["species"] = species_zh

    return result


def _realign_taxon_path(species: SpeciesCache) -> tuple[str | None, bool]:
    """Rebuild taxon_path from individual rank fields to fix old compact paths.

    Old format skipped null ranks: Animalia|Chordata|Arandaspididae|Sacabambaspis
    New format preserves positions: Animalia|Chordata|||Arandaspididae|Sacabambaspis

    For SUBPHYLUM/SUBCLASS rank taxa, appends the scientific name after the
    standard hierarchy (same logic as _build_taxon_path).

    Returns the corrected path and whether it changed.
    """
    rank_fields = [
        species.kingdom,
        species.phylum,
        species.class_,
        species.order_,
        species.family,
        species.genus,
    ]
    # Include species-level name if the taxon is SPECIES or sub-species rank
    taxon_rank = (species.taxon_rank or "").upper()
    if taxon_rank == "SPECIES":
        # Strip author citations (e.g. "Felis catus Linnaeus, 1758" -> "Felis catus")
        name = re.sub(
            r"\s+\(?[A-Z][\w.\s,\'\'-]*,\s*\d{4}\)?$",
            "",
            species.scientific_name or "",
        ).strip()
        rank_fields.append(name or species.scientific_name)
    elif taxon_rank in ("SUBSPECIES", "VARIETY", "FORM"):
        sci_name = re.sub(
            r"\s+\(?[A-Z][\w.\s,\'\'-]*,\s*\d{4}\)?$",
            "",
            species.scientific_name or "",
        ).strip()
        # Extract parent binomial (first two words) as 7th segment
        parts = sci_name.split()
        parent_binomial = " ".join(parts[:2]) if len(parts) >= 2 else sci_name
        rank_fields.append(parent_binomial)  # 7th: parent species
        if sci_name != parent_binomial:
            rank_fields.append(sci_name)  # 8th: subspecies trinomial

    last_non_empty = -1
    for i, v in enumerate(rank_fields):
        if v:
            last_non_empty = i
    if last_non_empty < 0:
        return species.taxon_path, False

    aligned = "|".join((v or "") for v in rank_fields[: last_non_empty + 1])

    # For SUBPHYLUM/SUBCLASS, append scientific_name after standard hierarchy
    if taxon_rank in ("SUBPHYLUM", "SUBCLASS"):
        sci_name = re.sub(
            r"\s+\(?[A-Z][\w.\s,\'\'-]*,\s*\d{4}\)?$",
            "",
            species.scientific_name or "",
        ).strip()
        if sci_name and not aligned.endswith(sci_name):
            aligned = aligned + "|" + sci_name

    changed = aligned != species.taxon_path
    if changed:
        species.taxon_path = aligned
    return aligned, changed
