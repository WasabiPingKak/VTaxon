"""Chinese name resolution — fallback chain and LRU-cached lookups."""

import logging
from functools import lru_cache

import requests
from sqlalchemy.exc import SQLAlchemyError

from ...extensions import db
from ...models import SpeciesCache
from ..http_client import external_session
from ..taicol import clear_cache as taicol_clear_cache
from ..taicol import get_chinese_name as taicol_get_chinese_name
from ..taxonomy_zh import get_species_zh_override, get_taxonomy_zh
from ..wikidata import clear_cache as wikidata_clear_cache
from ..wikidata import get_aliases_by_gbif_id, get_chinese_name_by_gbif_id

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
