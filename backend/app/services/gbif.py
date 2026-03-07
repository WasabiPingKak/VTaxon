"""GBIF Species API client with Chinese name resolution.

Search strategy:
  - /species/suggest  → autocomplete (returns Backbone results, no duplicates)
  - /species/match    → exact match (single authoritative Backbone result)

Chinese name fallback chain:
  1. Wikidata (by GBIF taxon ID → zh-tw label)
  2. TaiCOL   (by scientific name → common_name_c)
  3. Static taxonomy_zh table (higher ranks only)
"""

import json
import logging
import re
from functools import lru_cache

import requests

from sqlalchemy import func

from ..extensions import db
from ..models import Breed, SpeciesCache
from .taxonomy_zh import get_taxonomy_zh, get_taxonomy_zh_for_ranks, get_species_zh_override
from .wikidata import get_chinese_name_by_gbif_id, get_aliases_by_gbif_id
from .wikidata import clear_cache as wikidata_clear_cache
from .taicol import get_chinese_name as taicol_get_chinese_name
from .taicol import search_by_chinese as taicol_search_chinese
from .taicol import clear_cache as taicol_clear_cache

log = logging.getLogger(__name__)

GBIF_BASE = 'https://api.gbif.org/v1'

RANK_ORDER = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species']
_MAX_SYNONYM_RESOLVES = 8


def clear_chinese_name_caches():
    """Clear all in-memory Chinese name LRU caches across all services."""
    _resolve_chinese_name.cache_clear()
    _resolve_rank_zh.cache_clear()
    wikidata_clear_cache()
    taicol_clear_cache()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def suggest_species(query, limit=10):
    """Autocomplete species search using GBIF /species/suggest.

    Returns Backbone-only results (no duplicates).
    Each result is enriched with Chinese names via the fallback chain.
    """
    # Request more results to capture subspecies alongside species
    fetch_limit = min(limit * 3, 60)
    resp = requests.get(f'{GBIF_BASE}/species/suggest', params={
        'q': query,
        'limit': fetch_limit,
    }, timeout=10)
    resp.raise_for_status()
    results = resp.json()  # suggest returns a plain list, not {results: [...]}

    species_list = []
    seen_keys = set()
    synonym_attempts = 0
    for r in results:
        key = r.get('key')
        if not key or key in seen_keys:
            continue
        status = (r.get('status') or '').upper()
        rank = (r.get('rank') or '').upper()
        if rank not in ('KINGDOM', 'PHYLUM', 'SUBPHYLUM', 'CLASS', 'ORDER', 'FAMILY', 'GENUS', 'SPECIES', 'SUBSPECIES', 'VARIETY'):
            continue
        # SYNONYM → resolve to accepted species (cap to avoid HTTP flood)
        if status == 'SYNONYM':
            if synonym_attempts >= _MAX_SYNONYM_RESOLVES:
                continue
            synonym_attempts += 1
            resolved = _resolve_synonym(key, r.get('canonicalName'), seen_keys=seen_keys)
            if resolved and resolved['taxon_id'] not in seen_keys:
                seen_keys.add(resolved['taxon_id'])
                species_list.append(resolved)
            continue
        if status and status != 'ACCEPTED':
            continue
        seen_keys.add(key)
        species_list.append(_gbif_result_to_dict(r, key))

    # Enrich with Chinese names
    _enrich_chinese_names(species_list)

    # Sort by taxon_path for taxonomy tree order
    species_list.sort(key=lambda s: s.get('taxon_path') or '')

    return species_list


def match_species(name):
    """Exact species match using GBIF /species/match.

    Returns a single authoritative Backbone result or None.
    """
    resp = requests.get(f'{GBIF_BASE}/species/match', params={
        'name': name,
        'verbose': 'false',
    }, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    if data.get('matchType') == 'NONE':
        return None

    usage_key = data.get('usageKey')
    if not usage_key:
        return None

    # If SYNONYM, resolve to accepted species
    status = (data.get('status') or '').upper()
    if status == 'SYNONYM':
        accepted_key = data.get('acceptedUsageKey')
        if accepted_key:
            synonym_name = data.get('canonicalName')
            resolved = _resolve_synonym(usage_key, synonym_name)
            if resolved:
                resolved['match_type'] = data.get('matchType')
                resolved['confidence'] = data.get('confidence')
                _enrich_chinese_names([resolved])
                return resolved

    result = _gbif_result_to_dict(data, usage_key)
    result['match_type'] = data.get('matchType')
    result['confidence'] = data.get('confidence')

    # Enrich with Chinese names
    _enrich_chinese_names([result])

    return result


def search_species(query, limit=20):
    """Search for species — routes to the appropriate API based on query language.

    Includes local breed results first, then:
    - Latin/English queries → GBIF /species/suggest
    - Chinese queries → TaiCOL taxon_group search → GBIF /species/match for full data
    """
    breed_results = _search_breeds(query, limit=limit)
    if _has_cjk(query):
        species_results = _search_via_taicol(query, limit=limit)
    else:
        species_results = suggest_species(query, limit=limit)
    return breed_results + species_results


def search_species_stream(query, limit=10):
    """Streaming version of search_species — yields one NDJSON line per result.

    Phase 1: Local breed search (instant, from DB)
    Phase 2: GBIF/TaiCOL species search (slower, from external APIs)

    Each result is enriched with Chinese names one at a time, so the frontend
    can display results incrementally as they arrive.
    """
    # Phase 1: Local breed search — instant results
    breed_results = _search_breeds(query, limit=limit)
    for br in breed_results:
        yield json.dumps(br, ensure_ascii=False) + '\n'

    # Phase 2: GBIF species search — streaming
    if _has_cjk(query):
        yield from _search_via_taicol_stream(query, limit=limit)
    else:
        yield from _suggest_species_stream(query, limit=limit)


def _search_breeds(query, limit=10):
    """Search breeds by name (zh prefix or en case-insensitive prefix).

    Returns list of dicts with result_type='breed', breed info, and parent species data.
    """
    query = query.strip()
    if not query:
        return []

    if _has_cjk(query):
        breeds = (Breed.query
                  .filter(Breed.name_zh.isnot(None))
                  .filter(Breed.name_zh.like(f'{query}%'))
                  .limit(limit)
                  .all())
    else:
        breeds = (Breed.query
                  .filter(func.lower(Breed.name_en).like(f'{query.lower()}%'))
                  .limit(limit)
                  .all())

    results = []
    for breed in breeds:
        # Get parent species from species_cache
        species = db.session.get(SpeciesCache, breed.taxon_id)
        species_dict = species.to_dict() if species else {}

        # Fill missing rank_zh from static table
        if species:
            _fill_missing_rank_zh(species_dict, species)

        result = {
            'result_type': 'breed',
            'breed': breed.to_dict(),
            'taxon_id': breed.taxon_id,
            'scientific_name': species_dict.get('scientific_name', ''),
            'canonical_name': species_dict.get('scientific_name', ''),
            'common_name_en': species_dict.get('common_name_en'),
            'common_name_zh': species_dict.get('common_name_zh'),
            'taxon_rank': species_dict.get('taxon_rank'),
            'taxon_path': species_dict.get('taxon_path'),
            'kingdom': species_dict.get('kingdom'),
            'phylum': species_dict.get('phylum'),
            'class': species_dict.get('class'),
            'order': species_dict.get('order'),
            'family': species_dict.get('family'),
            'genus': species_dict.get('genus'),
            'kingdom_zh': species_dict.get('kingdom_zh'),
            'phylum_zh': species_dict.get('phylum_zh'),
            'class_zh': species_dict.get('class_zh'),
            'order_zh': species_dict.get('order_zh'),
            'family_zh': species_dict.get('family_zh'),
            'genus_zh': species_dict.get('genus_zh'),
        }
        results.append(result)

    return results


def _suggest_species_stream(query, limit=10):
    """Generator: yield one NDJSON line per enriched GBIF suggest result."""
    fetch_limit = min(limit * 3, 60)
    resp = requests.get(f'{GBIF_BASE}/species/suggest', params={
        'q': query,
        'limit': fetch_limit,
    }, timeout=10)
    resp.raise_for_status()
    raw = resp.json()

    species_list = []
    seen_keys = set()
    synonym_attempts = 0
    for r in raw:
        key = r.get('key')
        if not key or key in seen_keys:
            continue
        status = (r.get('status') or '').upper()
        rank = (r.get('rank') or '').upper()
        if rank not in ('KINGDOM', 'PHYLUM', 'SUBPHYLUM', 'CLASS', 'ORDER', 'FAMILY', 'GENUS', 'SPECIES', 'SUBSPECIES', 'VARIETY'):
            continue
        # SYNONYM → resolve to accepted species (cap to avoid HTTP flood)
        if status == 'SYNONYM':
            if synonym_attempts >= _MAX_SYNONYM_RESOLVES:
                continue
            synonym_attempts += 1
            resolved = _resolve_synonym(key, r.get('canonicalName'), seen_keys=seen_keys)
            if resolved and resolved['taxon_id'] not in seen_keys:
                seen_keys.add(resolved['taxon_id'])
                species_list.append(resolved)
            continue
        if status and status != 'ACCEPTED':
            continue
        seen_keys.add(key)
        species_list.append(_gbif_result_to_dict(r, key))

    for sp in species_list:
        _enrich_chinese_names([sp])
        yield json.dumps(sp, ensure_ascii=False) + '\n'


def _search_via_taicol_stream(query, limit=10):
    """Streaming version of _search_via_taicol — yields one NDJSON line per result."""
    taicol_results = taicol_search_chinese(query, limit=limit)
    if not taicol_results:
        return

    seen_keys = set()
    for tr in taicol_results:
        scientific_name = tr.get('scientific_name')
        if not scientific_name:
            continue

        matched = match_species(scientific_name)

        # GBIF Backbone 找不到 → 用 TaiCOL 資料建構結果
        if not matched:
            matched = _build_from_taicol(tr)
            if not matched:
                continue

        taxon_id = matched['taxon_id']
        if taxon_id in seen_keys:
            continue
        seen_keys.add(taxon_id)

        if tr.get('common_name_zh') and not matched.get('common_name_zh'):
            matched['common_name_zh'] = tr['common_name_zh']

        yield json.dumps(matched, ensure_ascii=False) + '\n'


def get_species(taxon_id):
    """Get a single species by GBIF taxon_id. Check cache first."""
    cached = db.session.get(SpeciesCache, taxon_id)
    if cached:
        # Realign taxon_path if it was stored in old compact format
        _, path_changed = _realign_taxon_path(cached)
        if path_changed:
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
        d = cached.to_dict()
        # Fill in any missing *_zh from static table (backward compat for old rows)
        _fill_missing_rank_zh(d, cached)
        return d

    resp = requests.get(f'{GBIF_BASE}/species/{taxon_id}', timeout=10)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    data = resp.json()

    # Fetch Chinese name before caching
    zh_name = _resolve_chinese_name(
        taxon_id, data.get('canonicalName') or data.get('scientificName'))

    cached = _cache_species(data, common_name_zh=zh_name)
    if not cached:
        return None
    d = cached.to_dict()
    _fill_missing_rank_zh(d, cached)
    return d


def _fill_missing_rank_zh(d, species):
    """Fill in missing *_zh fields from static table without overwriting existing values."""
    static_zh = get_taxonomy_zh_for_ranks(
        kingdom=species.kingdom, phylum=species.phylum,
        class_=species.class_, order=species.order_,
        family=species.family, genus=species.genus,
    )
    for key, val in static_zh.items():
        if val and not d.get(key):
            d[key] = val


def cache_from_search_result(gbif_data):
    """Cache a species from a GBIF search/suggest result dict."""
    usage_key = gbif_data.get('key') or gbif_data.get('usageKey')
    if not usage_key:
        return None

    existing = db.session.get(SpeciesCache, usage_key)
    if existing:
        return existing

    return _cache_species(gbif_data, common_name_zh=gbif_data.get('common_name_zh'))


# ---------------------------------------------------------------------------
# Chinese name resolution
# ---------------------------------------------------------------------------

@lru_cache(maxsize=500)
def _resolve_chinese_name(taxon_id, scientific_name):
    """Resolve Chinese name through the fallback chain.

    0. Static override table (corrects known Wikidata errors)
    1. TaiCOL (by scientific name) — authoritative for zh-tw
    2. Wikidata (by GBIF taxon ID) — broader coverage, less reliable
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
        except Exception:
            log.debug('TaiCOL lookup failed for %s', scientific_name)

    # Fallback to Wikidata
    try:
        zh_name, _en_name = get_chinese_name_by_gbif_id(taxon_id)
        if zh_name:
            return zh_name
    except Exception:
        log.debug('Wikidata lookup failed for taxon_id=%s', taxon_id)

    return None


@lru_cache(maxsize=500)
def _resolve_alternative_names(taxon_id, scientific_name, taxon_rank=None):
    """Resolve alternative Chinese names (俗名) through TaiCOL → Wikidata aliases.

    Only resolves for SPECIES/SUBSPECIES/VARIETY ranks — higher ranks return None.
    Returns comma-separated string of alternative names, or None.
    """
    # Only species-level taxa have meaningful 俗名
    if taxon_rank:
        rank_upper = taxon_rank.upper()
        if rank_upper not in ('SPECIES', 'SUBSPECIES', 'VARIETY'):
            return None
    # TaiCOL alternative_name_c
    if scientific_name:
        try:
            _zh, alt = taicol_get_chinese_name(scientific_name)
            if alt:
                return alt
        except Exception:
            pass

    # Wikidata aliases fallback
    try:
        aliases = get_aliases_by_gbif_id(taxon_id)
        if aliases:
            return aliases
    except Exception:
        pass

    return None


def resolve_missing_chinese_name(species_cache_obj):
    """Back-fill common_name_zh on a SpeciesCache row and persist to DB."""
    zh = _resolve_chinese_name(
        species_cache_obj.taxon_id,
        species_cache_obj.scientific_name,
    )
    if zh:
        species_cache_obj.common_name_zh = zh
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            log.debug('Failed to persist Chinese name for taxon_id=%s',
                      species_cache_obj.taxon_id)


@lru_cache(maxsize=500)
def _resolve_rank_zh(taxon_name, rank=None):
    """Resolve Chinese name for any taxon via static table → GBIF match → Wikidata.

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
        params = {'name': taxon_name, 'verbose': 'false'}
        if rank:
            params['rank'] = rank
        resp = requests.get(f'{GBIF_BASE}/species/match',
                            params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        usage_key = data.get('usageKey')
        if usage_key:
            zh_name, _en = get_chinese_name_by_gbif_id(usage_key)
            return zh_name
    except Exception:
        log.debug('rank_zh Wikidata fallback failed for %s (rank=%s)',
                  taxon_name, rank)

    return None


def _resolve_genus_zh(genus_name):
    """Resolve Chinese name for a genus. Delegates to _resolve_rank_zh."""
    return _resolve_rank_zh(genus_name, rank='GENUS')


def _enrich_chinese_names(species_list):
    """Enrich a list of species dicts with Chinese names.

    Adds:
      - common_name_zh: species-level Chinese name
      - alternative_names_zh: 俗名／別名（逗號分隔）
      - species_zh: alias for common_name_zh (for breadcrumb consistency)
      - kingdom_zh, phylum_zh, class_zh, order_zh, family_zh, genus_zh

    Uses DB cache (species_cache) as first lookup before hitting external APIs.
    """
    for sp in species_list:
        # Static override takes highest priority (corrects known errors)
        override = get_species_zh_override(sp.get('taxon_id'))
        if override:
            sp['common_name_zh'] = override

        # Species-level Chinese name + alternative names — check DB cache first
        if not sp.get('common_name_zh'):
            try:
                cached = db.session.get(SpeciesCache, sp['taxon_id'])
                if cached:
                    if cached.common_name_zh:
                        sp['common_name_zh'] = cached.common_name_zh
                    if cached.alternative_names_zh:
                        sp['alternative_names_zh'] = cached.alternative_names_zh
            except Exception:
                pass

        # Still no Chinese name → resolve via external APIs
        # Prefer canonical_name (no author) — TaiCOL fails with author strings
        if not sp.get('common_name_zh'):
            sp['common_name_zh'] = _resolve_chinese_name(
                sp['taxon_id'],
                sp.get('canonical_name') or sp.get('scientific_name') or sp.get('canonicalName'),
            )

        # Validate: common_name_zh must actually contain CJK characters
        zh = sp.get('common_name_zh')
        if zh and not _has_cjk(zh):
            sp['common_name_zh'] = None

        # species_zh alias for breadcrumb consistency
        sp['species_zh'] = sp.get('common_name_zh')

        # Alternative names (俗名) — resolve if not already from DB cache
        if not sp.get('alternative_names_zh'):
            sp['alternative_names_zh'] = _resolve_alternative_names(
                sp['taxon_id'],
                sp.get('canonical_name') or sp.get('scientific_name') or sp.get('canonicalName'),
                taxon_rank=sp.get('taxon_rank'),
            )

        # Clean alt names: remove duplicates, genus names, non-CJK
        sp['alternative_names_zh'] = clean_alt_names(
            sp.get('alternative_names_zh'), sp.get('common_name_zh')
        )

        # Higher taxonomy Chinese names (static table)
        rank_zh = get_taxonomy_zh_for_ranks(
            kingdom=sp.get('kingdom'), phylum=sp.get('phylum'),
            class_=sp.get('class'), order=sp.get('order'),
            family=sp.get('family'), genus=sp.get('genus'),
        )

        # genus_zh Wikidata fallback if static table missed
        if not rank_zh.get('genus_zh') and sp.get('genus'):
            rank_zh['genus_zh'] = _resolve_genus_zh(sp['genus'])

        sp.update(rank_zh)

        # Fallback: for higher-rank taxa, use {rank}_zh as common_name_zh
        if not sp.get('common_name_zh'):
            taxon_rank = (sp.get('taxon_rank') or '').upper()
            rank_key_map = {
                'KINGDOM': 'kingdom_zh', 'PHYLUM': 'phylum_zh',
                'CLASS': 'class_zh', 'ORDER': 'order_zh',
                'FAMILY': 'family_zh', 'GENUS': 'genus_zh',
            }
            zh_key = rank_key_map.get(taxon_rank)
            if zh_key and sp.get(zh_key):
                sp['common_name_zh'] = sp[zh_key]
                sp['species_zh'] = sp[zh_key]

    # Write enriched Chinese names back to DB cache
    _cache_enriched_species(species_list)


def _cache_enriched_species(species_list):
    """Persist enriched species data to species_cache table.

    Uses the enriched dict format (not raw GBIF format).
    Silently ignores errors to avoid disrupting the main flow.
    """
    try:
        for sp in species_list:
            taxon_id = sp.get('taxon_id')
            if not taxon_id:
                continue
            existing = db.session.get(SpeciesCache, taxon_id)
            if existing:
                # Override table corrections always win over cached values
                override = get_species_zh_override(taxon_id)
                if override and existing.common_name_zh != override:
                    existing.common_name_zh = override
                elif sp.get('common_name_zh') and not existing.common_name_zh:
                    existing.common_name_zh = sp['common_name_zh']
                # Backfill alternative_names_zh if empty
                if sp.get('alternative_names_zh') and not existing.alternative_names_zh:
                    existing.alternative_names_zh = sp['alternative_names_zh']
                # Backfill path_zh if empty
                if not existing.path_zh or existing.path_zh == {}:
                    pzh = _build_path_zh(sp)
                    if pzh:
                        existing.path_zh = pzh
            else:
                entry = SpeciesCache(
                    taxon_id=taxon_id,
                    scientific_name=sp.get('scientific_name', ''),
                    common_name_en=sp.get('common_name_en'),
                    common_name_zh=sp.get('common_name_zh'),
                    alternative_names_zh=sp.get('alternative_names_zh'),
                    taxon_rank=sp.get('taxon_rank'),
                    taxon_path=sp.get('taxon_path'),
                    kingdom=sp.get('kingdom'),
                    phylum=sp.get('phylum'),
                    class_=sp.get('class'),
                    order_=sp.get('order'),
                    family=sp.get('family'),
                    genus=sp.get('genus'),
                    path_zh=_build_path_zh(sp),
                )
                db.session.add(entry)
        db.session.commit()
    except Exception:
        db.session.rollback()
        log.debug('Failed to cache enriched species data', exc_info=True)


# ---------------------------------------------------------------------------
# Subspecies (children) API
# ---------------------------------------------------------------------------

def get_subspecies(species_key, limit=50):
    """Fetch subspecies of a species via GBIF children API.

    Returns a list of enriched subspecies dicts.
    """
    resp = requests.get(f'{GBIF_BASE}/species/{species_key}/children',
                        params={'limit': limit}, timeout=10)
    resp.raise_for_status()
    results = resp.json().get('results', [])

    subspecies = []
    seen_keys = set()
    for r in results:
        rank = (r.get('rank') or '').upper()
        status = (r.get('taxonomicStatus') or r.get('status') or '').upper()
        if rank not in ('SUBSPECIES', 'VARIETY'):
            continue
        if status and status != 'ACCEPTED':
            continue
        key = r.get('key')
        if not key or key in seen_keys:
            continue
        seen_keys.add(key)
        subspecies.append(_gbif_result_to_dict(r, key))

    _enrich_chinese_names(subspecies)

    # Sort: entries with Chinese names first, then alphabetically by scientific name
    subspecies.sort(key=lambda s: (
        0 if s.get('common_name_zh') else 1,
        s.get('scientific_name') or '',
    ))

    return subspecies


def get_subspecies_stream(species_key, limit=50):
    """Streaming version of get_subspecies — yields one NDJSON line per result."""
    resp = requests.get(f'{GBIF_BASE}/species/{species_key}/children',
                        params={'limit': limit}, timeout=10)
    resp.raise_for_status()
    results = resp.json().get('results', [])

    subspecies = []
    seen_keys = set()
    for r in results:
        rank = (r.get('rank') or '').upper()
        status = (r.get('taxonomicStatus') or r.get('status') or '').upper()
        if rank not in ('SUBSPECIES', 'VARIETY'):
            continue
        if status and status != 'ACCEPTED':
            continue
        key = r.get('key')
        if not key or key in seen_keys:
            continue
        seen_keys.add(key)
        subspecies.append(_gbif_result_to_dict(r, key))

    for sp in subspecies:
        _enrich_chinese_names([sp])
        yield json.dumps(sp, ensure_ascii=False) + '\n'


# ---------------------------------------------------------------------------
# Alt-name cleaning
# ---------------------------------------------------------------------------

def clean_alt_names(alt_str, primary_zh):
    """Clean alternative names: remove duplicates, genus names, non-CJK entries.

    Args:
        alt_str: comma-separated alternative names string
        primary_zh: the primary common_name_zh to deduplicate against
    Returns:
        cleaned comma-separated string, or None if empty after cleaning.
    """
    import unicodedata
    if not alt_str:
        return None
    # Normalize to NFC to handle CJK compatibility chars (e.g. U+F9FE → U+8336)
    alt_str = unicodedata.normalize('NFC', alt_str)
    primary_norm = unicodedata.normalize('NFC', primary_zh) if primary_zh else None
    parts = [n.strip() for n in alt_str.split(',')]
    cleaned = []
    for n in parts:
        if not n:
            continue
        # Skip if same as primary name
        if primary_norm and n == primary_norm:
            continue
        # Skip taxonomy-style names ending with 屬 (genus) or 科 (family)
        if n.endswith('屬') or n.endswith('科'):
            continue
        # Skip non-CJK entries (e.g. Latin scientific names)
        if not _has_cjk(n):
            continue
        cleaned.append(n)
    return ', '.join(cleaned) if cleaned else None


# ---------------------------------------------------------------------------
# CJK detection and TaiCOL-based Chinese search
# ---------------------------------------------------------------------------

def _has_cjk(text):
    """Check if text contains CJK (Chinese/Japanese/Korean) characters."""
    for ch in text:
        cp = ord(ch)
        if (0x4E00 <= cp <= 0x9FFF or 0x3400 <= cp <= 0x4DBF
                or 0xF900 <= cp <= 0xFAFF):
            return True
    return False


def _search_via_taicol(query, limit=10):
    """Search by Chinese name via TaiCOL, then enrich with GBIF data.

    Flow: TaiCOL (Chinese search) → GBIF /species/match (full taxonomy)
    """
    taicol_results = taicol_search_chinese(query, limit=limit)
    if not taicol_results:
        return []

    species_list = []
    seen_keys = set()
    for tr in taicol_results:
        scientific_name = tr.get('scientific_name')
        if not scientific_name:
            continue

        # Use GBIF match to get authoritative taxonomy + taxon_id
        matched = match_species(scientific_name)

        # GBIF Backbone 找不到 → 用 TaiCOL 資料建構結果
        if not matched:
            matched = _build_from_taicol(tr)
            if not matched:
                continue

        taxon_id = matched['taxon_id']
        if taxon_id in seen_keys:
            continue
        seen_keys.add(taxon_id)

        # Prefer TaiCOL's Chinese name (authoritative for zh-tw)
        if tr.get('common_name_zh') and not matched.get('common_name_zh'):
            matched['common_name_zh'] = tr['common_name_zh']

        species_list.append(matched)

    return species_list


# ---------------------------------------------------------------------------
# TaiCOL fallback builder (for taxa missing from GBIF Backbone)
# ---------------------------------------------------------------------------

def _build_from_taicol(tr):
    """Build a species dict from TaiCOL data when GBIF Backbone has no match.

    Uses a negative ID derived from the scientific name hash to avoid
    collisions with GBIF's positive integer IDs.
    Writes result to species_cache so trait creation can find it later.
    """
    scientific_name = tr.get('scientific_name')
    if not scientific_name:
        return None

    rank = (tr.get('rank') or '').upper()
    if not rank:
        return None

    # Generate a stable negative ID from scientific name
    taxon_id = -(abs(hash(scientific_name)) % 900_000_000 + 100_000_000)

    # Check if already cached (by negative ID)
    cached = db.session.get(SpeciesCache, taxon_id)
    if cached:
        d = cached.to_dict()
        _fill_missing_rank_zh(d, cached)
        return d

    common_name_zh = tr.get('common_name_zh')

    result = {
        'taxon_id': taxon_id,
        'scientific_name': scientific_name,
        'canonical_name': scientific_name,
        'common_name_en': None,
        'common_name_zh': common_name_zh,
        'taxon_rank': rank,
        'species_binomial': None,
        'species_key': None,
        'kingdom': None,
        'phylum': None,
        'class': None,
        'order': None,
        'family': None,
        'genus': None,
        'taxon_path': None,
    }

    # Try to get higher taxonomy from static table
    zh = get_taxonomy_zh(scientific_name)
    if zh and not common_name_zh:
        result['common_name_zh'] = zh

    # Write to species_cache for trait creation
    try:
        entry = SpeciesCache(
            taxon_id=taxon_id,
            scientific_name=scientific_name,
            common_name_zh=result.get('common_name_zh'),
            taxon_rank=rank,
        )
        db.session.add(entry)
        db.session.commit()
    except Exception:
        db.session.rollback()
        log.debug('Failed to cache TaiCOL-only taxon %s', scientific_name)

    return result


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _build_path_zh(data):
    """Build path_zh dict from static table + Wikidata fallback.

    Called once when a species is first cached, so Wikidata HTTP calls
    only happen at cache-write time, never on the /tree read path.
    """
    result = {}
    for field, rank in [('kingdom', 'KINGDOM'), ('phylum', 'PHYLUM'),
                        ('class', 'CLASS'), ('order', 'ORDER'),
                        ('family', 'FAMILY'), ('genus', 'GENUS')]:
        latin = data.get(field) or data.get(field + '_')
        if latin:
            zh = get_taxonomy_zh(latin) or _resolve_rank_zh(latin, rank=rank)
            result[field] = zh
    return result


def _realign_taxon_path(species):
    """Rebuild taxon_path from individual rank fields to fix old compact paths.

    Old format skipped null ranks: Animalia|Chordata|Arandaspididae|Sacabambaspis
    New format preserves positions: Animalia|Chordata|||Arandaspididae|Sacabambaspis

    Returns the corrected path and whether it changed.
    """
    rank_fields = [
        species.kingdom, species.phylum, species.class_,
        species.order_, species.family, species.genus,
    ]
    # Include species-level name if the taxon is SPECIES/SUBSPECIES/VARIETY
    taxon_rank = (species.taxon_rank or '').upper()
    if taxon_rank in ('SPECIES', 'SUBSPECIES', 'VARIETY'):
        # Strip author citations (e.g. "Felis catus Linnaeus, 1758" → "Felis catus")
        name = re.sub(
            r'\s+\(?[A-Z][\w.\s,\'\'-]*,\s*\d{4}\)?$', '',
            species.scientific_name or '',
        ).strip()
        rank_fields.append(name or species.scientific_name)

    last_non_empty = -1
    for i, v in enumerate(rank_fields):
        if v:
            last_non_empty = i
    if last_non_empty < 0:
        return species.taxon_path, False

    aligned = '|'.join((v or '') for v in rank_fields[:last_non_empty + 1])
    changed = aligned != species.taxon_path
    if changed:
        species.taxon_path = aligned
    return aligned, changed


def _cache_species(data, common_name_zh=None):
    """Create or update a SpeciesCache entry from GBIF data."""
    usage_key = data.get('key') or data.get('usageKey')
    if not usage_key:
        return None

    taxon_path = _build_taxon_path(data)
    path_zh = _build_path_zh(data)

    existing = db.session.get(SpeciesCache, usage_key)
    if existing:
        existing.taxon_path = taxon_path
        if common_name_zh and not existing.common_name_zh:
            existing.common_name_zh = common_name_zh
        if path_zh and (not existing.path_zh or existing.path_zh == {}):
            existing.path_zh = path_zh
        db.session.commit()
        return existing

    species = SpeciesCache(
        taxon_id=usage_key,
        scientific_name=data.get('scientificName', data.get('canonicalName', '')),
        common_name_en=data.get('vernacularName'),
        common_name_zh=common_name_zh,
        taxon_rank=data.get('rank'),
        taxon_path=taxon_path,
        kingdom=data.get('kingdom'),
        phylum=data.get('phylum'),
        class_=data.get('class'),
        order_=data.get('order'),
        family=data.get('family'),
        genus=data.get('genus'),
        path_zh=path_zh,
    )
    db.session.add(species)
    db.session.commit()
    return species


def _build_taxon_path(data):
    """Build materialized path from GBIF hierarchy: Kingdom|Phylum|Class|...|Species.

    Always includes all rank positions (empty string for missing ranks) up to
    the deepest known rank so that position index == rank index.
    e.g. Animalia|Chordata|||Arandaspididae|Sacabambaspis
    """
    field_map = {
        'kingdom': 'kingdom',
        'phylum': 'phylum',
        'class': 'class',
        'order': 'order',
        'family': 'family',
        'genus': 'genus',
        'species': 'species',
    }
    parts = []
    last_non_empty = -1
    for i, rank in enumerate(RANK_ORDER):
        value = data.get(field_map[rank])
        parts.append(value or '')
        if value:
            last_non_empty = i
    if last_non_empty < 0:
        return None
    return '|'.join(parts[:last_non_empty + 1])


def _resolve_synonym(synonym_key, synonym_canonical_name, seen_keys=None):
    """Resolve a SYNONYM to its accepted species via GBIF /species/{key}.

    If seen_keys is provided, skips the second HTTP call when the accepted
    key is already collected — avoids redundant requests for synonyms that
    all resolve to the same accepted species (e.g. Bellis perennis has 35+
    synonyms that all point to the same taxon).

    Returns an accepted species dict with synonym_name attached, or None.
    """
    try:
        resp = requests.get(f'{GBIF_BASE}/species/{synonym_key}', timeout=10)
        if resp.status_code != 200:
            return None
        data = resp.json()
        accepted_key = data.get('acceptedKey')
        if not accepted_key:
            return None

        # Early exit: accepted species already collected
        if seen_keys is not None and accepted_key in seen_keys:
            return None

        # Fetch the accepted species
        resp2 = requests.get(f'{GBIF_BASE}/species/{accepted_key}', timeout=10)
        if resp2.status_code != 200:
            return None
        accepted = resp2.json()

        result = _gbif_result_to_dict(accepted, accepted_key)
        result['synonym_name'] = synonym_canonical_name or data.get('canonicalName')
        return result
    except Exception:
        log.debug('Failed to resolve synonym key=%s', synonym_key)
        return None


def _gbif_result_to_dict(r, usage_key):
    """Convert a GBIF API result to a simplified dict."""
    return {
        'taxon_id': usage_key,
        'scientific_name': r.get('scientificName', r.get('canonicalName', '')),
        'canonical_name': r.get('canonicalName'),    # clean name without author
        'common_name_en': r.get('vernacularName'),
        'common_name_zh': None,
        'taxon_rank': r.get('rank'),
        'species_binomial': r.get('species'),       # e.g. "Milvus migrans" (parent species)
        'species_key': r.get('speciesKey'),          # for subspecies grouping
        'kingdom': r.get('kingdom'),
        'phylum': r.get('phylum'),
        'class': r.get('class'),
        'order': r.get('order'),
        'family': r.get('family'),
        'genus': r.get('genus'),
        'taxon_path': _build_taxon_path(r),
    }
