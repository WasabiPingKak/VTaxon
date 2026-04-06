"""TaiCOL-based Chinese search and fallback builder for taxa missing from GBIF."""

import json
import logging
from collections.abc import Generator
from typing import Any

import requests
from sqlalchemy.exc import SQLAlchemyError

from ...extensions import db
from ...models import SpeciesCache
from ...response_schemas import SpeciesCacheResponse
from ..taicol import get_chinese_name as taicol_get_chinese_name
from ..taicol import get_higher_taxa_zh as taicol_get_higher_taxa_zh
from ..taicol import search_by_chinese as taicol_search_chinese
from ..taicol import search_by_scientific_name as taicol_search_by_scientific_name
from ..taxonomy_zh import get_taxonomy_zh, get_taxonomy_zh_for_ranks
from .resolution import _resolve_genus_zh

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# TaiCOL-based Chinese search
# ---------------------------------------------------------------------------


def _fallback_taicol_by_name(query: str, limit: int = 10) -> list[dict[str, Any]]:
    """Fallback for Latin queries: search TaiCOL by scientific_name when GBIF has no results.

    Returns a list of species dicts built from TaiCOL + GBIF match.
    """
    from ..gbif import match_species

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
    from ..gbif import match_species

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
    from ..gbif import match_species

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
    from ..species_cache import _fill_missing_rank_zh
    from ..taxonomy_path import _build_path_zh

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
