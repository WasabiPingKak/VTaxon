"""Taxonomy path construction utilities.

Builds and realigns materialized paths (taxon_path, path_zh) used for
tree visualisation.  Also provides post-processing helpers consumed by
the /tree and /fictional-tree route handlers (path ranks, Medusozoa
injection, default primary assignment, path_zh rebuild).
"""

import re
from typing import Any

from ..models import SpeciesCache
from .taxonomy_zh import get_taxonomy_zh

RANK_ORDER = ["kingdom", "phylum", "class", "order", "family", "genus", "species"]

# Standard 7-position rank order (uppercase) for path_ranks computation
STANDARD_RANKS = ["KINGDOM", "PHYLUM", "CLASS", "ORDER", "FAMILY", "GENUS", "SPECIES"]

# Medusozoa classes: Cnidaria classes that belong under the Medusozoa subphylum
MEDUSOZOA_CLASSES = {"Scyphozoa", "Cubozoa", "Staurozoa", "Hydrozoa"}


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


# ---------------------------------------------------------------------------
# Tree display post-processing helpers (extracted from routes/taxonomy.py)
# ---------------------------------------------------------------------------


def compute_path_ranks(taxon_path: str | None, taxon_rank: str | None) -> list[str]:
    """Compute a rank label array for each segment of taxon_path.

    Standard 7-segment paths map 1:1 to STANDARD_RANKS.
    SUBPHYLUM taxa (3 segments like Animalia|Cnidaria|Medusozoa):
        → ['KINGDOM', 'PHYLUM', 'SUBPHYLUM']
    SUBCLASS taxa (4 segments like Animalia|Cnidaria|Hydrozoa|Hydroidolina):
        → ['KINGDOM', 'PHYLUM', 'CLASS', 'SUBCLASS']
    """
    if not taxon_path:
        return []
    parts = taxon_path.split("|")
    n = len(parts)
    rank_upper = (taxon_rank or "").upper()

    # For SUBPHYLUM/SUBCLASS, the last segment is the sub-rank taxon itself
    if rank_upper == "SUBPHYLUM" and n >= 2:
        ranks = list(STANDARD_RANKS[: n - 1])
        ranks.append("SUBPHYLUM")
        return ranks
    if rank_upper == "SUBCLASS" and n >= 3:
        ranks = list(STANDARD_RANKS[: n - 1])
        ranks.append("SUBCLASS")
        return ranks

    # SUBSPECIES/VARIETY/FORM: 8-segment path (7 standard + sub-species rank)
    _SUB_SPECIES_RANKS = {"SUBSPECIES", "VARIETY", "FORM"}
    if rank_upper in _SUB_SPECIES_RANKS and n > len(STANDARD_RANKS):
        ranks = list(STANDARD_RANKS)  # first 7 (KINGDOM→SPECIES)
        ranks.append(rank_upper)  # 8th segment
        return ranks

    # Standard path: use positional mapping
    return list(STANDARD_RANKS[:n])


def assign_default_primary(entries: list[dict[str, Any]]) -> None:
    """For users without an explicit live primary trait, mark their first entry."""
    users_with_primary: set[str] = set()
    for e in entries:
        if e.get("is_live_primary"):
            users_with_primary.add(e["user_id"])
    first_seen: set[str] = set()
    for e in entries:
        uid = e["user_id"]
        if uid not in users_with_primary and uid not in first_seen:
            first_seen.add(uid)
            e["is_live_primary"] = True


def inject_medusozoa(entries: list[dict[str, Any]]) -> None:
    """Post-process entries to inject Medusozoa subphylum between Cnidaria and its classes.

    Only modifies entries where phylum=Cnidaria and class is one of the
    Medusozoa classes. Inserts 'Medusozoa' into taxon_path and updates
    path_ranks and path_zh accordingly.

    This is display-only — does NOT modify the DB.
    """
    for entry in entries:
        path = entry.get("taxon_path")
        if not path:
            continue

        parts = path.split("|")
        path_ranks = entry.get("path_ranks", [])

        # Find phylum position (should be index 1)
        phylum_idx = None
        for i, r in enumerate(path_ranks):
            if r == "PHYLUM":
                phylum_idx = i
                break
        if phylum_idx is None or phylum_idx + 1 >= len(parts):
            continue

        # Check: is this a Cnidaria entry with a Medusozoa class?
        if parts[phylum_idx] != "Cnidaria":
            continue
        class_idx = phylum_idx + 1
        if class_idx >= len(parts):
            continue
        class_name = parts[class_idx]
        if class_name not in MEDUSOZOA_CLASSES:
            continue

        # Insert Medusozoa between phylum and class
        insert_pos = phylum_idx + 1
        parts.insert(insert_pos, "Medusozoa")
        path_ranks.insert(insert_pos, "SUBPHYLUM")

        entry["taxon_path"] = "|".join(parts)
        entry["path_ranks"] = path_ranks

        # Update path_zh with subphylum
        pzh = entry.get("path_zh") or {}
        if isinstance(pzh, dict):
            pzh["subphylum"] = "水母亞門"
            entry["path_zh"] = pzh


def rebuild_path_zh(species: SpeciesCache) -> dict[str, str | None] | None:
    """Rebuild path_zh using full fallback chain (static table + Wikidata).

    Uses _build_path_zh which has @lru_cache on Wikidata calls,
    so external API hits only happen once per unique rank name.
    """
    data: dict[str, Any] = {
        "kingdom": species.kingdom,
        "phylum": species.phylum,
        "class": species.class_,
        "order": species.order_,
        "family": species.family,
        "genus": species.genus,
        "taxon_rank": species.taxon_rank,
        "scientific_name": species.scientific_name,
    }
    rank = (species.taxon_rank or "").upper()
    if rank in ("SUBSPECIES", "VARIETY", "FORM"):
        # Derive parent species binomial and look up its taxon_id for zh resolution
        parts = (species.scientific_name or "").split()
        parent_binomial = " ".join(parts[:2]) if len(parts) >= 2 else None
        if parent_binomial:
            parent = SpeciesCache.query.filter(
                SpeciesCache.scientific_name.ilike(f"{parent_binomial}%"),
                SpeciesCache.taxon_rank == "SPECIES",
            ).first()
            if parent:
                data["speciesKey"] = parent.taxon_id
                data["species"] = parent_binomial
    result = _build_path_zh(data)
    if result:
        species.path_zh = result
    return result
