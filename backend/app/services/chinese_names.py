"""Chinese name resolution and TaiCOL integration.

Fallback chain for species-level Chinese names:
  0. Static override table (corrects known Wikidata errors)
  1. TaiCOL (by scientific name) - authoritative for zh-tw
  2. Wikidata (by GBIF taxon ID) - broader coverage, less reliable
  3. Static taxonomy_zh table (higher ranks only)
"""

import json
import logging
import unicodedata
from collections.abc import Generator
from functools import lru_cache
from typing import Any

import requests
from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import SpeciesCache
from ..response_schemas import SpeciesCacheResponse
from .http_client import external_session
from .taicol import clear_cache as taicol_clear_cache
from .taicol import get_chinese_name as taicol_get_chinese_name
from .taicol import get_higher_taxa_zh as taicol_get_higher_taxa_zh
from .taicol import search_by_chinese as taicol_search_chinese
from .taicol import search_by_scientific_name as taicol_search_by_scientific_name
from .taxonomy_zh import get_species_name_override, get_species_zh_override, get_taxonomy_zh, get_taxonomy_zh_for_ranks
from .wikidata import clear_cache as wikidata_clear_cache
from .wikidata import get_aliases_by_gbif_id, get_chinese_name_by_gbif_id

logger = logging.getLogger(__name__)

GBIF_BASE = "https://api.gbif.org/v1"


def clear_chinese_name_caches() -> None:
    """Clear all in-memory Chinese name LRU caches across all services."""
    _resolve_chinese_name.cache_clear()
    _resolve_rank_zh.cache_clear()
    wikidata_clear_cache()
    taicol_clear_cache()


# ---------------------------------------------------------------------------
# Chinese name resolution
# ---------------------------------------------------------------------------


@lru_cache(maxsize=500)
def _resolve_chinese_name(taxon_id: int, scientific_name: str | None) -> str | None:
    """Resolve Chinese name through the fallback chain.

    0. Static override table (corrects known Wikidata errors)
    1. TaiCOL (by scientific name) - authoritative for zh-tw
    2. Wikidata (by GBIF taxon ID) - broader coverage, less reliable
    Returns Chinese name string or None.
    """
    # Check override table first
    override = get_species_zh_override(taxon_id)
    if override:
        return override

    # Try TaiCOL first (authoritative for zh-tw names)
    if scientific_name:
        try:
            zh_name, _alt = taicol_get_chinese_name(scientific_name)
            if zh_name:
                return zh_name
        except (requests.RequestException, ValueError):
            logger.debug("TaiCOL lookup failed for %s", scientific_name)

    # Fallback to Wikidata
    try:
        zh_name, _en_name = get_chinese_name_by_gbif_id(taxon_id)
        if zh_name:
            return zh_name
    except (requests.RequestException, ValueError):
        logger.debug("Wikidata lookup failed for taxon_id=%s", taxon_id)

    return None


@lru_cache(maxsize=500)
def _resolve_alternative_names(taxon_id: int, scientific_name: str | None, taxon_rank: str | None = None) -> str | None:
    """Resolve alternative Chinese names through TaiCOL -> Wikidata aliases.

    Only resolves for SPECIES/SUBSPECIES/VARIETY ranks - higher ranks return None.
    Returns comma-separated string of alternative names, or None.
    """
    # Only species-level taxa have meaningful alternative names
    if taxon_rank:
        rank_upper = taxon_rank.upper()
        if rank_upper not in ("SPECIES", "SUBSPECIES", "VARIETY", "FORM"):
            return None
    # TaiCOL alternative_name_c
    if scientific_name:
        try:
            _zh, alt = taicol_get_chinese_name(scientific_name)
            if alt:
                return alt
        except (requests.RequestException, ValueError):
            pass

    # Wikidata aliases fallback
    try:
        aliases = get_aliases_by_gbif_id(taxon_id)
        if aliases:
            return aliases
    except (requests.RequestException, ValueError):
        pass

    return None


def resolve_missing_chinese_name(species_cache_obj: SpeciesCache) -> None:
    """Back-fill common_name_zh on a SpeciesCache row and persist to DB."""
    zh = _resolve_chinese_name(
        species_cache_obj.taxon_id,
        species_cache_obj.scientific_name,
    )
    if zh:
        species_cache_obj.common_name_zh = zh
        try:
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            logger.debug("Failed to persist Chinese name for taxon_id=%s", species_cache_obj.taxon_id)


@lru_cache(maxsize=500)
def _resolve_rank_zh(taxon_name: str | None, rank: str | None = None) -> str | None:
    """Resolve Chinese name for any taxon via static table -> GBIF match -> Wikidata.

    Cached to avoid repeated lookups for the same taxon.
    Returns Chinese name string or None.
    """
    if not taxon_name:
        return None

    # Static table first
    zh = get_taxonomy_zh(taxon_name)
    if zh:
        return zh

    # GBIF match to get taxon_id, then Wikidata
    try:
        params = {"name": taxon_name, "verbose": "false"}
        if rank:
            params["rank"] = rank
        resp = external_session.get(f"{GBIF_BASE}/species/match", params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        match_type = data.get("matchType", "")
        if match_type in ("HIGHERRANK", "NONE"):
            return None
        usage_key = data.get("usageKey")
        if usage_key:
            zh_name, _en = get_chinese_name_by_gbif_id(usage_key)
            return zh_name
    except (requests.RequestException, ValueError):
        logger.debug("rank_zh Wikidata fallback failed for %s (rank=%s)", taxon_name, rank)

    return None


def _resolve_genus_zh(genus_name: str) -> str | None:
    """Resolve Chinese name for a genus. Delegates to _resolve_rank_zh."""
    return _resolve_rank_zh(genus_name, rank="GENUS")


def _enrich_chinese_names(species_list: list[dict[str, Any]]) -> None:
    """Enrich a list of species dicts with Chinese names.

    Adds:
      - common_name_zh: species-level Chinese name
      - alternative_names_zh: comma-separated alternative names
      - species_zh: alias for common_name_zh (for breadcrumb consistency)
      - kingdom_zh, phylum_zh, class_zh, order_zh, family_zh, genus_zh

    Resolution order: override table -> external APIs (with LRU cache) -> DB cache.
    External APIs are checked before DB cache so stale/wrong cached names get
    corrected automatically.  The @lru_cache on _resolve_chinese_name keeps
    repeated lookups fast within the same process.
    """
    from .gbif import _has_cjk
    from .species_cache import _cache_enriched_species

    for sp in species_list:
        # Static override takes highest priority (corrects known errors)
        override = get_species_zh_override(sp["taxon_id"])
        if override:
            sp["common_name_zh"] = override

        # Resolve via external APIs (TaiCOL -> Wikidata, with LRU in-process cache)
        # Prefer canonical_name (no author) - TaiCOL fails with author strings
        if not sp.get("common_name_zh"):
            sp["common_name_zh"] = _resolve_chinese_name(
                sp["taxon_id"],
                sp.get("canonical_name") or sp.get("scientific_name") or sp.get("canonicalName"),
            )

        # Fallback to DB cache when external APIs returned nothing
        if not sp.get("common_name_zh"):
            try:
                cached = db.session.get(SpeciesCache, sp["taxon_id"])
                if cached:
                    if cached.common_name_zh:
                        sp["common_name_zh"] = cached.common_name_zh
                    if cached.alternative_names_zh:
                        sp["alternative_names_zh"] = cached.alternative_names_zh
            except SQLAlchemyError:
                pass

        # Validate: common_name_zh must actually contain CJK characters
        zh = sp.get("common_name_zh")
        if zh and not _has_cjk(zh):
            sp["common_name_zh"] = None

        # Fix: strip trailing "genus suffix" for species/subspecies ranks.
        # Wikidata sometimes returns genus-level names for species-level taxa.
        zh = sp.get("common_name_zh")
        taxon_rank = (sp.get("taxon_rank") or "").upper()
        if zh and zh.endswith("\u5c6c") and len(zh) >= 2 and taxon_rank in ("SPECIES", "SUBSPECIES", "VARIETY"):
            sp["common_name_zh"] = zh[:-1]

        # species_zh alias for breadcrumb consistency
        sp["species_zh"] = sp.get("common_name_zh")

        # Alternative names - resolve if not already from DB cache
        if not sp.get("alternative_names_zh"):
            sp["alternative_names_zh"] = _resolve_alternative_names(
                sp["taxon_id"],
                sp.get("canonical_name") or sp.get("scientific_name") or sp.get("canonicalName"),
                taxon_rank=sp.get("taxon_rank"),
            )

        # Clean alt names: remove duplicates, genus names, non-CJK
        sp["alternative_names_zh"] = clean_alt_names(sp.get("alternative_names_zh"), sp.get("common_name_zh"))

        # Higher taxonomy Chinese names (static table)
        rank_zh = get_taxonomy_zh_for_ranks(
            kingdom=sp.get("kingdom"),
            phylum=sp.get("phylum"),
            class_=sp.get("class"),
            order=sp.get("order"),
            family=sp.get("family"),
            genus=sp.get("genus"),
        )

        # genus_zh Wikidata fallback if static table missed
        if not rank_zh.get("genus_zh") and sp.get("genus"):
            rank_zh["genus_zh"] = _resolve_genus_zh(sp["genus"])

        sp.update(rank_zh)

        # Fallback: for higher-rank taxa, use {rank}_zh as common_name_zh
        if not sp.get("common_name_zh"):
            taxon_rank = (sp.get("taxon_rank") or "").upper()
            rank_key_map = {
                "KINGDOM": "kingdom_zh",
                "PHYLUM": "phylum_zh",
                "CLASS": "class_zh",
                "ORDER": "order_zh",
                "FAMILY": "family_zh",
                "GENUS": "genus_zh",
            }
            zh_key = rank_key_map.get(taxon_rank)
            if zh_key and sp.get(zh_key):
                sp["common_name_zh"] = sp[zh_key]
                sp["species_zh"] = sp[zh_key]

    # Apply scientific name overrides (e.g. Felis manul -> Otocolobus manul)
    for sp in species_list:
        name_override = get_species_name_override(sp["taxon_id"])
        if name_override:
            sp["display_name_override"] = name_override

    # Write enriched Chinese names back to DB cache
    _cache_enriched_species(species_list)


# ---------------------------------------------------------------------------
# Alt-name cleaning
# ---------------------------------------------------------------------------


def clean_alt_names(alt_str: str | None, primary_zh: str | None) -> str | None:
    """Clean alternative names: remove duplicates, genus names, non-CJK entries.

    Args:
        alt_str: comma-separated alternative names string
        primary_zh: the primary common_name_zh to deduplicate against
    Returns:
        cleaned comma-separated string, or None if empty after cleaning.
    """
    from .gbif import _has_cjk

    if not alt_str:
        return None
    # Normalize to NFC to handle CJK compatibility chars (e.g. U+F9FE -> U+8336)
    alt_str = unicodedata.normalize("NFC", alt_str)
    primary_norm = unicodedata.normalize("NFC", primary_zh) if primary_zh else None
    parts = [n.strip() for n in alt_str.split(",")]
    cleaned = []
    for n in parts:
        if not n:
            continue
        # Skip if same as primary name
        if primary_norm and n == primary_norm:
            continue
        # Skip taxonomy-style names ending with genus or family suffix
        if n.endswith("\u5c6c") or n.endswith("\u79d1"):
            continue
        # Skip non-CJK entries (e.g. Latin scientific names)
        if not _has_cjk(n):
            continue
        cleaned.append(n)
    return ", ".join(cleaned) if cleaned else None


# ---------------------------------------------------------------------------
# TaiCOL-based Chinese search
# ---------------------------------------------------------------------------


def _fallback_taicol_by_name(query: str, limit: int = 10) -> list[dict[str, Any]]:
    """Fallback for Latin queries: search TaiCOL by scientific_name when GBIF has no results.

    Returns a list of species dicts built from TaiCOL + GBIF match.
    """
    from .gbif import match_species

    try:
        zh_name, _alt = taicol_get_chinese_name(query)
    except (requests.RequestException, ValueError):
        zh_name = None

    if not zh_name:
        return []

    # TaiCOL knows this name - try GBIF match first
    matched = match_species(query)
    if matched:
        if not matched.get("common_name_zh"):
            matched["common_name_zh"] = zh_name
        return [matched]

    # GBIF also has no match - build from TaiCOL data
    taicol_results = taicol_search_by_scientific_name(query, limit=limit)
    results = []
    for tr in taicol_results:
        built = _build_from_taicol(tr)
        if built:
            results.append(built)
    return results


def _search_via_taicol(query: str, limit: int = 10) -> list[dict[str, Any]]:
    """Search by Chinese name via TaiCOL, then enrich with GBIF data.

    Flow: TaiCOL (Chinese search) -> GBIF /species/match (full taxonomy)
    Falls back to _build_from_taicol() when GBIF has no match.
    """
    from .gbif import match_species

    taicol_results = taicol_search_chinese(query, limit=limit)
    if not taicol_results:
        return []

    species_list = []
    seen_keys = set()
    for tr in taicol_results:
        scientific_name = tr.get("scientific_name")
        if not scientific_name:
            continue

        # Use GBIF match to get authoritative taxonomy + taxon_id
        matched = match_species(scientific_name)

        # GBIF Backbone not found - build from TaiCOL data
        if not matched:
            matched = _build_from_taicol(tr)
            if not matched:
                continue

        taxon_id = matched["taxon_id"]
        if taxon_id in seen_keys:
            continue
        seen_keys.add(taxon_id)

        # Prefer TaiCOL's Chinese name (authoritative for zh-tw)
        if tr.get("common_name_zh") and not matched.get("common_name_zh"):
            matched["common_name_zh"] = tr["common_name_zh"]

        species_list.append(matched)

    return species_list


def _search_via_taicol_stream(
    query: str, limit: int = 10, exclude_ids: set[int] | None = None
) -> Generator[str, None, None]:
    """Streaming version of _search_via_taicol - yields one NDJSON line per result.

    Args:
        exclude_ids: set of taxon_ids already returned by earlier phases
                     (e.g. local cache), to avoid duplicate results.
    """
    from .gbif import match_species

    taicol_results = taicol_search_chinese(query, limit=limit)
    if not taicol_results:
        return

    seen_keys = set(exclude_ids or ())
    for tr in taicol_results:
        scientific_name = tr.get("scientific_name")
        if not scientific_name:
            continue

        matched = match_species(scientific_name)

        # GBIF Backbone not found - build from TaiCOL data
        if not matched:
            matched = _build_from_taicol(tr)
            if not matched:
                continue

        taxon_id = matched["taxon_id"]
        if taxon_id in seen_keys:
            continue
        seen_keys.add(taxon_id)

        if tr.get("common_name_zh") and not matched.get("common_name_zh"):
            matched["common_name_zh"] = tr["common_name_zh"]

        yield json.dumps(matched, ensure_ascii=False) + "\n"


# ---------------------------------------------------------------------------
# TaiCOL fallback builder (for taxa missing from GBIF Backbone)
# ---------------------------------------------------------------------------


def _build_from_taicol(tr: dict[str, Any]) -> dict[str, Any] | None:
    """Build a species dict from TaiCOL data when GBIF Backbone has no match.

    Uses a negative ID derived from the scientific name hash to avoid
    collisions with GBIF's positive integer IDs.
    Uses TaiCOL higherTaxa API to fill in the full taxonomy hierarchy.
    Writes result to species_cache so trait creation can find it later.
    """
    from .species_cache import _fill_missing_rank_zh
    from .taxonomy_path import _build_path_zh

    scientific_name = tr.get("scientific_name")
    if not scientific_name:
        return None

    rank = (tr.get("rank") or "").upper()
    if not rank:
        return None

    # Generate a stable negative ID from scientific name
    taxon_id = -(abs(hash(scientific_name)) % 900_000_000 + 100_000_000)

    # Check if already cached (by negative ID)
    cached = db.session.get(SpeciesCache, taxon_id)
    if cached:
        d = SpeciesCacheResponse.from_model(cached).model_dump(mode="json")
        _fill_missing_rank_zh(d, cached)
        return d

    common_name_zh = tr.get("common_name_zh")

    # Build hierarchy from TaiCOL higherTaxa API
    hierarchy = {}
    taicol_taxon_id = tr.get("taicol_taxon_id")
    if taicol_taxon_id:
        higher_taxa = taicol_get_higher_taxa_zh(taicol_taxon_id)
        for ht in higher_taxa:
            ht_rank = (ht.get("rank") or "").upper()
            ht_name = ht.get("name")
            if ht_rank and ht_name:
                rank_field_map = {
                    "KINGDOM": "kingdom",
                    "PHYLUM": "phylum",
                    "CLASS": "class",
                    "ORDER": "order",
                    "FAMILY": "family",
                    "GENUS": "genus",
                }
                field = rank_field_map.get(ht_rank)
                if field:
                    hierarchy[field] = ht_name

    # Use kingdom from TaiCOL result if not in hierarchy
    kingdom = tr.get("kingdom")
    if kingdom and "kingdom" not in hierarchy:
        hierarchy["kingdom"] = kingdom

    # Build taxon_path from hierarchy
    rank_order = ["kingdom", "phylum", "class", "order", "family", "genus"]
    parts = [hierarchy.get(r, "") for r in rank_order]
    last_non_empty = -1
    for i, v in enumerate(parts):
        if v:
            last_non_empty = i
    taxon_path = "|".join(parts[: last_non_empty + 1]) if last_non_empty >= 0 else None

    result = {
        "taxon_id": taxon_id,
        "scientific_name": scientific_name,
        "canonical_name": scientific_name,
        "common_name_en": None,
        "common_name_zh": common_name_zh,
        "taxon_rank": rank,
        "species_binomial": None,
        "species_key": None,
        "kingdom": hierarchy.get("kingdom"),
        "phylum": hierarchy.get("phylum"),
        "class": hierarchy.get("class"),
        "order": hierarchy.get("order"),
        "family": hierarchy.get("family"),
        "genus": hierarchy.get("genus"),
        "taxon_path": taxon_path,
        "_from_taicol": True,
    }

    # Fill *_zh fields from static table + Wikidata fallback
    rank_zh = get_taxonomy_zh_for_ranks(
        kingdom=hierarchy.get("kingdom"),
        phylum=hierarchy.get("phylum"),
        class_=hierarchy.get("class"),
        order=hierarchy.get("order"),
        family=hierarchy.get("family"),
        genus=hierarchy.get("genus"),
    )
    # genus_zh Wikidata fallback if static table missed
    if not rank_zh.get("genus_zh") and hierarchy.get("genus"):
        rank_zh["genus_zh"] = _resolve_genus_zh(hierarchy["genus"])
    result.update(rank_zh)
    result["species_zh"] = result.get("common_name_zh")

    # Try to get higher taxonomy zh from static table
    zh = get_taxonomy_zh(scientific_name)
    if zh and not common_name_zh:
        result["common_name_zh"] = zh

    # Write to species_cache for trait creation
    try:
        entry = SpeciesCache(
            taxon_id=taxon_id,
            scientific_name=scientific_name,
            common_name_zh=result.get("common_name_zh"),
            taxon_rank=rank,
            taxon_path=taxon_path,
            kingdom=hierarchy.get("kingdom"),
            phylum=hierarchy.get("phylum"),
            class_=hierarchy.get("class"),
            order_=hierarchy.get("order"),
            family=hierarchy.get("family"),
            genus=hierarchy.get("genus"),
            path_zh=_build_path_zh(result),
        )
        db.session.add(entry)
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        logger.debug("Failed to cache TaiCOL-only taxon %s", scientific_name)

    return result
