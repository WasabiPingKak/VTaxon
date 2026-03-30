"""GBIF Species API client — search and autocomplete.

Search strategy:
  - /species/suggest  -> autocomplete (returns Backbone results, no duplicates)
  - /species/match    -> exact match (single authoritative Backbone result)

Chinese name enrichment and species caching are delegated to sibling modules:
  - chinese_names.py  -> Chinese name resolution, TaiCOL integration
  - species_cache.py  -> species cache management, taxonomy paths
"""

import json
import logging

import requests
from sqlalchemy import func

from ..extensions import db
from ..models import Breed, SpeciesCache

# ---------------------------------------------------------------------------
# Re-exports: keep ``from ..services.gbif import X`` working for all callers.
# ---------------------------------------------------------------------------
from .chinese_names import (  # noqa: F401
    _resolve_chinese_name,
    clean_alt_names,
    clear_chinese_name_caches,
    resolve_missing_chinese_name,
)
from .http_client import external_session
from .species_cache import (  # noqa: F401
    _build_path_zh,
    _build_taxon_path,
    _realign_taxon_path,
    cache_from_search_result,
    get_species,
    get_subspecies,
    get_subspecies_stream,
)

logger = logging.getLogger(__name__)

GBIF_BASE = "https://api.gbif.org/v1"

RANK_ORDER = ["kingdom", "phylum", "class", "order", "family", "genus", "species"]
_MAX_SYNONYM_RESOLVES = 8


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def suggest_species(query, limit=10):
    """Autocomplete species search using GBIF /species/suggest.

    Returns Backbone-only results (no duplicates).
    Each result is enriched with Chinese names via the fallback chain.
    """
    from .chinese_names import _enrich_chinese_names, _fallback_taicol_by_name

    # Request more results to capture subspecies alongside species
    fetch_limit = min(limit * 3, 60)
    resp = external_session.get(
        f"{GBIF_BASE}/species/suggest",
        params={
            "q": query,
            "limit": fetch_limit,
        },
        timeout=10,
    )
    resp.raise_for_status()
    results = resp.json()  # suggest returns a plain list, not {results: [...]}

    species_list = []
    seen_keys = set()
    synonym_attempts = 0
    for r in results:
        key = r.get("key")
        if not key or key in seen_keys:
            continue
        status = (r.get("status") or "").upper()
        rank = (r.get("rank") or "").upper()
        if rank not in (
            "KINGDOM",
            "PHYLUM",
            "SUBPHYLUM",
            "CLASS",
            "SUBCLASS",
            "ORDER",
            "FAMILY",
            "GENUS",
            "SPECIES",
            "SUBSPECIES",
            "VARIETY",
            "FORM",
        ):
            continue
        # SYNONYM -> resolve to accepted species (cap to avoid HTTP flood)
        if status == "SYNONYM":
            if synonym_attempts >= _MAX_SYNONYM_RESOLVES:
                continue
            synonym_attempts += 1
            resolved = _resolve_synonym(key, r.get("canonicalName"), seen_keys=seen_keys)
            if resolved and resolved["taxon_id"] not in seen_keys:
                seen_keys.add(resolved["taxon_id"])
                species_list.append(resolved)
            continue
        if status and status != "ACCEPTED":
            continue
        seen_keys.add(key)
        species_list.append(_gbif_result_to_dict(r, key))

    # Fallback: GBIF suggest returned nothing - try match, then TaiCOL
    if not species_list:
        matched = match_species(query)
        if matched:
            matched.pop("match_type", None)
            matched.pop("confidence", None)
            species_list.append(matched)
        else:
            species_list = _fallback_taicol_by_name(query, limit=limit)

    # Enrich with Chinese names
    _enrich_chinese_names(species_list)

    # Sort by taxon_path for taxonomy tree order
    species_list.sort(key=lambda s: s.get("taxon_path") or "")

    return species_list


def match_species(name):
    """Exact species match using GBIF /species/match.

    Returns a single authoritative Backbone result or None.
    """
    from .chinese_names import _enrich_chinese_names

    resp = external_session.get(
        f"{GBIF_BASE}/species/match",
        params={
            "name": name,
            "verbose": "false",
        },
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()

    if data.get("matchType") == "NONE":
        return None

    usage_key = data.get("usageKey")
    if not usage_key:
        return None

    # If SYNONYM, resolve to accepted species
    status = (data.get("status") or "").upper()
    if status == "SYNONYM":
        accepted_key = data.get("acceptedUsageKey")
        if accepted_key:
            synonym_name = data.get("canonicalName")
            resolved = _resolve_synonym(usage_key, synonym_name)
            if resolved:
                resolved["match_type"] = data.get("matchType")
                resolved["confidence"] = data.get("confidence")
                _enrich_chinese_names([resolved])
                return resolved

    result = _gbif_result_to_dict(data, usage_key)
    result["match_type"] = data.get("matchType")
    result["confidence"] = data.get("confidence")

    # Enrich with Chinese names
    _enrich_chinese_names([result])

    return result


def search_species(query, limit=20):
    """Search for species - routes to the appropriate API based on query language.

    Includes local breed results first, then:
    - Latin/English queries -> GBIF /species/suggest
    - Chinese queries -> local species_cache -> TaiCOL -> GBIF /species/match
    """
    from .chinese_names import _search_via_taicol

    breed_results = _search_breeds(query, limit=limit)
    if _has_cjk(query):
        local_results = _search_local_cache_chinese(query, limit=limit)
        taicol_results = _search_via_taicol(query, limit=limit)
        # Merge: local first, then TaiCOL (deduped by taxon_id)
        seen = {sp["taxon_id"] for sp in local_results}
        species_results = local_results + [sp for sp in taicol_results if sp["taxon_id"] not in seen]
    else:
        species_results = suggest_species(query, limit=limit)
    return breed_results + species_results


def search_species_stream(query, limit=10):
    """Streaming version of search_species - yields one NDJSON line per result.

    Phase 1: Local breed search (instant, from DB)
    Phase 1.5: Local species_cache Chinese name search (instant, CJK only)
    Phase 2: GBIF/TaiCOL species search (slower, from external APIs)

    Each result is enriched with Chinese names one at a time, so the frontend
    can display results incrementally as they arrive.
    """
    from .chinese_names import _search_via_taicol_stream

    # Phase 1: Local breed search - instant results
    breed_results = _search_breeds(query, limit=limit)
    for br in breed_results:
        yield json.dumps(br, ensure_ascii=False) + "\n"

    # Phase 1.5: Local species_cache Chinese name search (CJK queries only)
    local_seen = set()
    if _has_cjk(query):
        local_results = _search_local_cache_chinese(query, limit=limit)
        for sp in local_results:
            local_seen.add(sp["taxon_id"])
            yield json.dumps(sp, ensure_ascii=False) + "\n"

    # Phase 2: GBIF species search - streaming
    if _has_cjk(query):
        yield from _search_via_taicol_stream(query, limit=limit, exclude_ids=local_seen)
    else:
        yield from _suggest_species_stream(query, limit=limit)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _search_breeds(query, limit=10):
    """Search breeds by name (zh prefix or en case-insensitive prefix).

    Returns list of dicts with result_type='breed', breed info, and parent species data.
    """
    from .species_cache import _fill_missing_rank_zh

    query = query.strip()
    if not query:
        return []

    if _has_cjk(query):
        breeds = (
            Breed.query.filter(Breed.name_zh.isnot(None)).filter(Breed.name_zh.like(f"{query}%")).limit(limit).all()
        )
    else:
        breeds = Breed.query.filter(func.lower(Breed.name_en).like(f"{query.lower()}%")).limit(limit).all()

    results = []
    for breed in breeds:
        # Get parent species from species_cache
        species = db.session.get(SpeciesCache, breed.taxon_id)
        species_dict = species.to_dict() if species else {}

        # Fill missing rank_zh from static table
        if species:
            _fill_missing_rank_zh(species_dict, species)

        result = {
            "result_type": "breed",
            "breed": breed.to_dict(),
            "taxon_id": breed.taxon_id,
            "scientific_name": species_dict.get("scientific_name", ""),
            "canonical_name": species_dict.get("scientific_name", ""),
            "common_name_en": species_dict.get("common_name_en"),
            "common_name_zh": species_dict.get("common_name_zh"),
            "taxon_rank": species_dict.get("taxon_rank"),
            "taxon_path": species_dict.get("taxon_path"),
            "kingdom": species_dict.get("kingdom"),
            "phylum": species_dict.get("phylum"),
            "class": species_dict.get("class"),
            "order": species_dict.get("order"),
            "family": species_dict.get("family"),
            "genus": species_dict.get("genus"),
            "kingdom_zh": species_dict.get("kingdom_zh"),
            "phylum_zh": species_dict.get("phylum_zh"),
            "class_zh": species_dict.get("class_zh"),
            "order_zh": species_dict.get("order_zh"),
            "family_zh": species_dict.get("family_zh"),
            "genus_zh": species_dict.get("genus_zh"),
        }
        results.append(result)

    return results


def _search_local_cache_chinese(query, limit=10):
    """Search local species_cache by Chinese name (common_name_zh / alternative_names_zh).

    This catches species that were previously cached via Latin-name searches
    but would be missed by TaiCOL (which only covers Taiwan-native species).
    """
    from .species_cache import _fill_missing_rank_zh

    query = query.strip()
    if not query:
        return []

    # Search common_name_zh and alternative_names_zh with substring match
    rows = (
        SpeciesCache.query.filter(
            db.or_(
                SpeciesCache.common_name_zh.like(f"%{query}%"),
                SpeciesCache.alternative_names_zh.like(f"%{query}%"),
            )
        )
        .limit(limit)
        .all()
    )

    results = []
    for row in rows:
        d = row.to_dict()
        _fill_missing_rank_zh(d, row)
        results.append(d)
    return results


def _suggest_species_stream(query, limit=10):
    """Generator: yield one NDJSON line per enriched GBIF suggest result."""
    from .chinese_names import _enrich_chinese_names, _fallback_taicol_by_name

    fetch_limit = min(limit * 3, 60)
    resp = external_session.get(
        f"{GBIF_BASE}/species/suggest",
        params={
            "q": query,
            "limit": fetch_limit,
        },
        timeout=10,
    )
    resp.raise_for_status()
    raw = resp.json()

    species_list = []
    seen_keys = set()
    synonym_attempts = 0
    for r in raw:
        key = r.get("key")
        if not key or key in seen_keys:
            continue
        status = (r.get("status") or "").upper()
        rank = (r.get("rank") or "").upper()
        if rank not in (
            "KINGDOM",
            "PHYLUM",
            "SUBPHYLUM",
            "CLASS",
            "SUBCLASS",
            "ORDER",
            "FAMILY",
            "GENUS",
            "SPECIES",
            "SUBSPECIES",
            "VARIETY",
            "FORM",
        ):
            continue
        # SYNONYM -> resolve to accepted species (cap to avoid HTTP flood)
        if status == "SYNONYM":
            if synonym_attempts >= _MAX_SYNONYM_RESOLVES:
                continue
            synonym_attempts += 1
            resolved = _resolve_synonym(key, r.get("canonicalName"), seen_keys=seen_keys)
            if resolved and resolved["taxon_id"] not in seen_keys:
                seen_keys.add(resolved["taxon_id"])
                species_list.append(resolved)
            continue
        if status and status != "ACCEPTED":
            continue
        seen_keys.add(key)
        species_list.append(_gbif_result_to_dict(r, key))

    # Fallback: GBIF suggest returned nothing - try match, then TaiCOL
    if not species_list:
        matched = match_species(query)
        if matched:
            matched.pop("match_type", None)
            matched.pop("confidence", None)
            species_list.append(matched)
        else:
            species_list = _fallback_taicol_by_name(query, limit=limit)

    for sp in species_list:
        _enrich_chinese_names([sp])
        yield json.dumps(sp, ensure_ascii=False) + "\n"


def _has_cjk(text):
    """Check if text contains CJK (Chinese/Japanese/Korean) characters."""
    for ch in text:
        cp = ord(ch)
        if 0x4E00 <= cp <= 0x9FFF or 0x3400 <= cp <= 0x4DBF or 0xF900 <= cp <= 0xFAFF:
            return True
    return False


def _resolve_synonym(synonym_key, synonym_canonical_name, seen_keys=None):
    """Resolve a SYNONYM to its accepted species via GBIF /species/{key}.

    If seen_keys is provided, skips the second HTTP call when the accepted
    key is already collected - avoids redundant requests for synonyms that
    all resolve to the same accepted species (e.g. Bellis perennis has 35+
    synonyms that all point to the same taxon).

    Returns an accepted species dict with synonym_name attached, or None.
    """
    try:
        resp = external_session.get(f"{GBIF_BASE}/species/{synonym_key}", timeout=10)
        if resp.status_code != 200:
            return None
        data = resp.json()
        accepted_key = data.get("acceptedKey")
        if not accepted_key:
            return None

        # Early exit: accepted species already collected
        if seen_keys is not None and accepted_key in seen_keys:
            return None

        # Fetch the accepted species
        resp2 = external_session.get(f"{GBIF_BASE}/species/{accepted_key}", timeout=10)
        if resp2.status_code != 200:
            return None
        accepted = resp2.json()

        result = _gbif_result_to_dict(accepted, accepted_key)
        result["synonym_name"] = synonym_canonical_name or data.get("canonicalName")
        return result
    except requests.RequestException:
        logger.debug("Failed to resolve synonym key=%s", synonym_key)
        return None


def _gbif_result_to_dict(r, usage_key):
    """Convert a GBIF API result to a simplified dict."""
    return {
        "taxon_id": usage_key,
        "scientific_name": r.get("scientificName", r.get("canonicalName", "")),
        "canonical_name": r.get("canonicalName"),  # clean name without author
        "common_name_en": r.get("vernacularName"),
        "common_name_zh": None,
        "taxon_rank": r.get("rank"),
        "species_binomial": r.get("species"),  # e.g. "Milvus migrans" (parent species)
        "species_key": r.get("speciesKey"),  # for subspecies grouping
        "kingdom": r.get("kingdom"),
        "phylum": r.get("phylum"),
        "class": r.get("class"),
        "order": r.get("order"),
        "family": r.get("family"),
        "genus": r.get("genus"),
        "taxon_path": _build_taxon_path(r),
    }
