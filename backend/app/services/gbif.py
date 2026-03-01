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
from functools import lru_cache

import requests

from ..extensions import db
from ..models import SpeciesCache
from .taxonomy_zh import get_taxonomy_zh, get_taxonomy_zh_for_ranks
from .wikidata import get_chinese_name_by_gbif_id
from .wikidata import clear_cache as wikidata_clear_cache
from .taicol import get_chinese_name as taicol_get_chinese_name
from .taicol import search_by_chinese as taicol_search_chinese
from .taicol import clear_cache as taicol_clear_cache

log = logging.getLogger(__name__)

GBIF_BASE = 'https://api.gbif.org/v1'

RANK_ORDER = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species']


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
    for r in results:
        key = r.get('key')
        if not key or key in seen_keys:
            continue
        # suggest may return SYNONYM entries; skip non-ACCEPTED
        status = (r.get('status') or '').upper()
        if status and status != 'ACCEPTED':
            continue
        # Only include SPECIES and SUBSPECIES ranks
        rank = (r.get('rank') or '').upper()
        if rank not in ('ORDER', 'FAMILY', 'GENUS', 'SPECIES', 'SUBSPECIES', 'VARIETY'):
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

    result = _gbif_result_to_dict(data, usage_key)
    result['match_type'] = data.get('matchType')
    result['confidence'] = data.get('confidence')

    # Enrich with Chinese names
    _enrich_chinese_names([result])

    return result


def search_species(query, limit=20):
    """Search for species — routes to the appropriate API based on query language.

    - Latin/English queries → GBIF /species/suggest
    - Chinese queries → TaiCOL taxon_group search → GBIF /species/match for full data
    """
    if _has_cjk(query):
        return _search_via_taicol(query, limit=limit)
    return suggest_species(query, limit=limit)


def search_species_stream(query, limit=10):
    """Streaming version of search_species — yields one NDJSON line per result.

    Each result is enriched with Chinese names one at a time, so the frontend
    can display results incrementally as they arrive.
    """
    if _has_cjk(query):
        yield from _search_via_taicol_stream(query, limit=limit)
    else:
        yield from _suggest_species_stream(query, limit=limit)


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
    for r in raw:
        key = r.get('key')
        if not key or key in seen_keys:
            continue
        status = (r.get('status') or '').upper()
        if status and status != 'ACCEPTED':
            continue
        rank = (r.get('rank') or '').upper()
        if rank not in ('ORDER', 'FAMILY', 'GENUS', 'SPECIES', 'SUBSPECIES', 'VARIETY'):
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
        d = cached.to_dict()
        # Add taxonomy_zh from static table if not stored
        d.update(get_taxonomy_zh_for_ranks(
            kingdom=cached.kingdom, phylum=cached.phylum,
            class_=cached.class_, order=cached.order_,
            family=cached.family, genus=cached.genus,
        ))
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
    d.update(get_taxonomy_zh_for_ranks(
        kingdom=cached.kingdom, phylum=cached.phylum,
        class_=cached.class_, order=cached.order_,
        family=cached.family, genus=cached.genus,
    ))
    return d


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

    1. TaiCOL (by scientific name) — authoritative for zh-tw
    2. Wikidata (by GBIF taxon ID) — broader coverage, less reliable
    Returns Chinese name string or None.
    """
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
      - species_zh: alias for common_name_zh (for breadcrumb consistency)
      - kingdom_zh, phylum_zh, class_zh, order_zh, family_zh, genus_zh

    Uses DB cache (species_cache) as first lookup before hitting external APIs.
    """
    for sp in species_list:
        # Species-level Chinese name — check DB cache first
        if not sp.get('common_name_zh'):
            try:
                cached = db.session.get(SpeciesCache, sp['taxon_id'])
                if cached and cached.common_name_zh:
                    sp['common_name_zh'] = cached.common_name_zh
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
                if sp.get('common_name_zh') and not existing.common_name_zh:
                    existing.common_name_zh = sp['common_name_zh']
            else:
                entry = SpeciesCache(
                    taxon_id=taxon_id,
                    scientific_name=sp.get('scientific_name', ''),
                    common_name_en=sp.get('common_name_en'),
                    common_name_zh=sp.get('common_name_zh'),
                    taxon_rank=sp.get('taxon_rank'),
                    taxon_path=sp.get('taxon_path'),
                    kingdom=sp.get('kingdom'),
                    phylum=sp.get('phylum'),
                    class_=sp.get('class'),
                    order_=sp.get('order'),
                    family=sp.get('family'),
                    genus=sp.get('genus'),
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
# Internal helpers
# ---------------------------------------------------------------------------

def _cache_species(data, common_name_zh=None):
    """Create or update a SpeciesCache entry from GBIF data."""
    usage_key = data.get('key') or data.get('usageKey')
    if not usage_key:
        return None

    taxon_path = _build_taxon_path(data)

    existing = db.session.get(SpeciesCache, usage_key)
    if existing:
        existing.taxon_path = taxon_path
        if common_name_zh and not existing.common_name_zh:
            existing.common_name_zh = common_name_zh
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
    )
    db.session.add(species)
    db.session.commit()
    return species


def _build_taxon_path(data):
    """Build materialized path from GBIF hierarchy: Kingdom|Phylum|Class|..."""
    parts = []
    field_map = {
        'kingdom': 'kingdom',
        'phylum': 'phylum',
        'class': 'class',
        'order': 'order',
        'family': 'family',
        'genus': 'genus',
        'species': 'species',
    }
    for rank in RANK_ORDER:
        gbif_field = field_map[rank]
        value = data.get(gbif_field)
        if value:
            parts.append(value)
    return '|'.join(parts) if parts else None


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
