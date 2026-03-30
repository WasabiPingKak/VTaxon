"""Species cache management and taxonomy path utilities.

Handles caching of species data from GBIF API to local PostgreSQL,
taxonomy path construction, and subspecies retrieval.
"""

import json
import logging
import re

from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import SpeciesCache
from .http_client import external_session
from .taxonomy_zh import get_species_zh_override, get_taxonomy_zh, get_taxonomy_zh_for_ranks

logger = logging.getLogger(__name__)

GBIF_BASE = "https://api.gbif.org/v1"

RANK_ORDER = ["kingdom", "phylum", "class", "order", "family", "genus", "species"]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_species(taxon_id):
    """Get a single species by GBIF taxon_id. Check cache first."""
    from .chinese_names import _resolve_chinese_name

    cached = db.session.get(SpeciesCache, taxon_id)
    if cached:
        # Realign taxon_path if it was stored in old compact format
        _, path_changed = _realign_taxon_path(cached)
        if path_changed:
            try:
                db.session.commit()
            except SQLAlchemyError:
                db.session.rollback()
        d = cached.to_dict()
        # Fill in any missing *_zh from static table (backward compat for old rows)
        _fill_missing_rank_zh(d, cached)
        return d

    resp = external_session.get(f"{GBIF_BASE}/species/{taxon_id}", timeout=10)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    data = resp.json()

    # Fetch Chinese name before caching
    zh_name = _resolve_chinese_name(taxon_id, data.get("canonicalName") or data.get("scientificName"))

    cached = _cache_species(data, common_name_zh=zh_name)
    if not cached:
        return None
    d = cached.to_dict()
    _fill_missing_rank_zh(d, cached)
    return d


def _fill_missing_rank_zh(d, species):
    """Fill in missing *_zh fields from static table without overwriting existing values."""
    static_zh = get_taxonomy_zh_for_ranks(
        kingdom=species.kingdom,
        phylum=species.phylum,
        class_=species.class_,
        order=species.order_,
        family=species.family,
        genus=species.genus,
    )
    for key, val in static_zh.items():
        if val and not d.get(key):
            d[key] = val


def cache_from_search_result(gbif_data):
    """Cache a species from a GBIF search/suggest result dict."""
    usage_key = gbif_data.get("key") or gbif_data.get("usageKey")
    if not usage_key:
        return None

    existing = db.session.get(SpeciesCache, usage_key)
    if existing:
        return existing

    return _cache_species(gbif_data, common_name_zh=gbif_data.get("common_name_zh"))


# ---------------------------------------------------------------------------
# Subspecies (children) API
# ---------------------------------------------------------------------------


def get_subspecies(species_key, limit=50):
    """Fetch subspecies of a species via GBIF children API.

    Returns a list of enriched subspecies dicts.
    """
    from .chinese_names import _enrich_chinese_names
    from .gbif import _gbif_result_to_dict

    resp = external_session.get(f"{GBIF_BASE}/species/{species_key}/children", params={"limit": limit}, timeout=10)
    resp.raise_for_status()
    results = resp.json().get("results", [])

    subspecies = []
    seen_keys = set()
    for r in results:
        rank = (r.get("rank") or "").upper()
        status = (r.get("taxonomicStatus") or r.get("status") or "").upper()
        if rank not in ("SUBSPECIES", "VARIETY", "FORM"):
            continue
        if status and status != "ACCEPTED":
            continue
        key = r.get("key")
        if not key or key in seen_keys:
            continue
        seen_keys.add(key)
        subspecies.append(_gbif_result_to_dict(r, key))

    _enrich_chinese_names(subspecies)

    # Sort: entries with Chinese names first, then alphabetically by scientific name
    subspecies.sort(
        key=lambda s: (
            0 if s.get("common_name_zh") else 1,
            s.get("scientific_name") or "",
        )
    )

    return subspecies


def get_subspecies_stream(species_key, limit=50):
    """Streaming version of get_subspecies - yields one NDJSON line per result."""
    from .chinese_names import _enrich_chinese_names
    from .gbif import _gbif_result_to_dict

    resp = external_session.get(f"{GBIF_BASE}/species/{species_key}/children", params={"limit": limit}, timeout=10)
    resp.raise_for_status()
    results = resp.json().get("results", [])

    subspecies = []
    seen_keys = set()
    for r in results:
        rank = (r.get("rank") or "").upper()
        status = (r.get("taxonomicStatus") or r.get("status") or "").upper()
        if rank not in ("SUBSPECIES", "VARIETY", "FORM"):
            continue
        if status and status != "ACCEPTED":
            continue
        key = r.get("key")
        if not key or key in seen_keys:
            continue
        seen_keys.add(key)
        subspecies.append(_gbif_result_to_dict(r, key))

    for sp in subspecies:
        _enrich_chinese_names([sp])
        yield json.dumps(sp, ensure_ascii=False) + "\n"


# ---------------------------------------------------------------------------
# Cache write helpers
# ---------------------------------------------------------------------------


def _cache_enriched_species(species_list):
    """Persist enriched species data to species_cache table.

    Uses the enriched dict format (not raw GBIF format).
    Silently ignores errors to avoid disrupting the main flow.
    """
    try:
        for sp in species_list:
            taxon_id = sp.get("taxon_id")
            if not taxon_id:
                continue
            # Skip TaiCOL-only results with pseudo IDs - not real GBIF keys
            if sp.get("_from_taicol"):
                continue
            existing = db.session.get(SpeciesCache, taxon_id)
            if existing:
                # Core taxonomy fields - always update from fresh GBIF data
                # so corrupted/stale cache entries get self-corrected.
                if sp.get("scientific_name") and existing.scientific_name != sp["scientific_name"]:
                    existing.scientific_name = sp["scientific_name"]
                if sp.get("taxon_rank") and existing.taxon_rank != sp["taxon_rank"]:
                    existing.taxon_rank = sp["taxon_rank"]
                if sp.get("taxon_path") and existing.taxon_path != sp["taxon_path"]:
                    existing.taxon_path = sp["taxon_path"]
                for field, attr in [
                    ("kingdom", "kingdom"),
                    ("phylum", "phylum"),
                    ("class", "class_"),
                    ("order", "order_"),
                    ("family", "family"),
                    ("genus", "genus"),
                ]:
                    val = sp.get(field)
                    if val and getattr(existing, attr) != val:
                        setattr(existing, attr, val)
                # Update common_name_en if available
                if sp.get("common_name_en") and not existing.common_name_en:
                    existing.common_name_en = sp["common_name_en"]
                # Update common_name_zh: override table wins; otherwise
                # accept any freshly-resolved name that differs from cache
                # so stale/wrong cached names get corrected over time.
                override = get_species_zh_override(taxon_id)
                if override and existing.common_name_zh != override:
                    existing.common_name_zh = override
                elif sp.get("common_name_zh") and existing.common_name_zh != sp["common_name_zh"]:
                    existing.common_name_zh = sp["common_name_zh"]
                # Backfill alternative_names_zh if empty
                if sp.get("alternative_names_zh") and not existing.alternative_names_zh:
                    existing.alternative_names_zh = sp["alternative_names_zh"]
                # Update path_zh
                pzh = _build_path_zh(sp)
                if pzh and existing.path_zh != pzh:
                    existing.path_zh = pzh
            else:
                entry = SpeciesCache(
                    taxon_id=taxon_id,
                    scientific_name=sp.get("scientific_name", ""),
                    common_name_en=sp.get("common_name_en"),
                    common_name_zh=sp.get("common_name_zh"),
                    alternative_names_zh=sp.get("alternative_names_zh"),
                    taxon_rank=sp.get("taxon_rank"),
                    taxon_path=sp.get("taxon_path"),
                    kingdom=sp.get("kingdom"),
                    phylum=sp.get("phylum"),
                    class_=sp.get("class"),
                    order_=sp.get("order"),
                    family=sp.get("family"),
                    genus=sp.get("genus"),
                    path_zh=_build_path_zh(sp),
                )
                db.session.add(entry)
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        logger.debug("Failed to cache enriched species data", exc_info=True)


def _cache_species(data, common_name_zh=None):
    """Create or update a SpeciesCache entry from GBIF data."""
    from .gbif import _has_cjk

    usage_key = data.get("key") or data.get("usageKey")
    if not usage_key:
        return None

    # Reject non-CJK values (e.g. Latin names from Wikidata languagefallback)
    if common_name_zh and not _has_cjk(common_name_zh):
        common_name_zh = None

    taxon_path = _build_taxon_path(data)
    path_zh = _build_path_zh(data)

    existing = db.session.get(SpeciesCache, usage_key)
    if existing:
        # Always refresh core taxonomy fields from authoritative GBIF data
        sci_name = data.get("scientificName", data.get("canonicalName", ""))
        if sci_name and existing.scientific_name != sci_name:
            existing.scientific_name = sci_name
        for gbif_key, attr in [
            ("rank", "taxon_rank"),
            ("kingdom", "kingdom"),
            ("phylum", "phylum"),
            ("class", "class_"),
            ("order", "order_"),
            ("family", "family"),
            ("genus", "genus"),
        ]:
            val = data.get(gbif_key)
            if val and getattr(existing, attr) != val:
                setattr(existing, attr, val)
        existing.taxon_path = taxon_path
        if common_name_zh and not existing.common_name_zh:
            existing.common_name_zh = common_name_zh
        if path_zh and (not existing.path_zh or existing.path_zh == {}):
            existing.path_zh = path_zh
        db.session.commit()
        return existing

    species = SpeciesCache(
        taxon_id=usage_key,
        scientific_name=data.get("scientificName", data.get("canonicalName", "")),
        common_name_en=data.get("vernacularName"),
        common_name_zh=common_name_zh,
        taxon_rank=data.get("rank"),
        taxon_path=taxon_path,
        kingdom=data.get("kingdom"),
        phylum=data.get("phylum"),
        class_=data.get("class"),
        order_=data.get("order"),
        family=data.get("family"),
        genus=data.get("genus"),
        path_zh=path_zh,
    )
    db.session.add(species)
    db.session.commit()
    return species


# ---------------------------------------------------------------------------
# Taxonomy path utilities
# ---------------------------------------------------------------------------


def _build_taxon_path(data):
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


def _build_path_zh(data):
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


def _realign_taxon_path(species):
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
