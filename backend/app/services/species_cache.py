"""Species cache management — GBIF data caching and subspecies retrieval.

Taxonomy path construction has been extracted to taxonomy_path.py.
"""

import json
import logging
from collections.abc import Generator
from typing import Any

from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import SpeciesCache
from ..response_schemas import SpeciesCacheResponse
from .circuit_breaker import gbif_cb
from .http_client import external_session
from .taxonomy_path import _build_path_zh, _build_taxon_path, _realign_taxon_path
from .taxonomy_zh import get_species_zh_override, get_taxonomy_zh_for_ranks

logger = logging.getLogger(__name__)

GBIF_BASE = "https://api.gbif.org/v1"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_species(taxon_id: int) -> dict[str, Any] | None:
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
        d = SpeciesCacheResponse.from_model(cached).model_dump(mode="json")
        # Fill in any missing *_zh from static table (backward compat for old rows)
        _fill_missing_rank_zh(d, cached)
        return d

    gbif_cb.guard()
    resp = external_session.get(f"{GBIF_BASE}/species/{taxon_id}", timeout=10)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    gbif_cb.record_success()
    data = resp.json()

    # Fetch Chinese name before caching
    zh_name = _resolve_chinese_name(taxon_id, data.get("canonicalName") or data.get("scientificName"))

    cached = _cache_species(data, common_name_zh=zh_name)
    if not cached:
        return None
    d = SpeciesCacheResponse.from_model(cached).model_dump(mode="json")
    _fill_missing_rank_zh(d, cached)
    return d


def _fill_missing_rank_zh(d: dict[str, Any], species: SpeciesCache) -> None:
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


def cache_from_search_result(gbif_data: dict[str, Any]) -> SpeciesCache | None:
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


def get_subspecies(species_key: int, limit: int = 50) -> list[dict[str, Any]]:
    """Fetch subspecies of a species via GBIF children API.

    Returns a list of enriched subspecies dicts.
    """
    from .chinese_names import _enrich_chinese_names
    from .gbif import _gbif_result_to_dict

    gbif_cb.guard()
    resp = external_session.get(f"{GBIF_BASE}/species/{species_key}/children", params={"limit": limit}, timeout=10)
    resp.raise_for_status()
    gbif_cb.record_success()
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


def get_subspecies_stream(species_key: int, limit: int = 50) -> Generator[str, None, None]:
    """Streaming version of get_subspecies - yields one NDJSON line per result."""
    from .chinese_names import _enrich_chinese_names
    from .gbif import _gbif_result_to_dict

    gbif_cb.guard()
    resp = external_session.get(f"{GBIF_BASE}/species/{species_key}/children", params={"limit": limit}, timeout=10)
    resp.raise_for_status()
    gbif_cb.record_success()
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


def _cache_enriched_species(species_list: list[dict[str, Any]]) -> None:
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


def _cache_species(data: dict[str, Any], common_name_zh: str | None = None) -> SpeciesCache | None:
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
