import requests

from ..extensions import db
from ..models import SpeciesCache

GBIF_BASE = 'https://api.gbif.org/v1'

RANK_ORDER = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species']

CHINESE_LANG_CODES = {'zho', 'zh', 'cmn', 'chi'}


def _has_cjk(text):
    """Check if text contains CJK (Chinese/Japanese/Korean) characters."""
    for ch in text:
        cp = ord(ch)
        if (0x4E00 <= cp <= 0x9FFF or 0x3400 <= cp <= 0x4DBF
                or 0xF900 <= cp <= 0xFAFF):
            return True
    return False


def _get_chinese_name(usage_key):
    """Fetch Chinese vernacular name from GBIF vernacularNames endpoint."""
    try:
        resp = requests.get(
            f'{GBIF_BASE}/species/{usage_key}/vernacularNames',
            timeout=5,
        )
        if resp.status_code != 200:
            return None
        results = resp.json().get('results', [])
        for r in results:
            lang = (r.get('language') or '').lower()
            if lang in CHINESE_LANG_CODES:
                return r.get('vernacularName')
        return None
    except Exception:
        return None


def search_species(query, limit=20):
    """Search GBIF for species matching query string."""
    resp = requests.get(f'{GBIF_BASE}/species/search', params={
        'q': query,
        'limit': limit,
        'rank': 'SPECIES',
        'status': 'ACCEPTED',
    }, timeout=10)
    resp.raise_for_status()
    results = resp.json().get('results', [])

    species_list = []
    for r in results:
        usage_key = r.get('key') or r.get('usageKey')
        if not usage_key:
            continue
        species_list.append(_gbif_result_to_dict(r, usage_key))

    # When query contains CJK characters, fetch Chinese names for top results
    if _has_cjk(query):
        for sp in species_list[:10]:
            zh_name = _get_chinese_name(sp['taxon_id'])
            if zh_name:
                sp['common_name_zh'] = zh_name

    return species_list


def get_species(taxon_id):
    """Get a single species by GBIF taxon_id. Check cache first."""
    cached = db.session.get(SpeciesCache, taxon_id)
    if cached:
        return cached.to_dict()

    resp = requests.get(f'{GBIF_BASE}/species/{taxon_id}', timeout=10)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    data = resp.json()

    cached = _cache_species(data)
    return cached.to_dict() if cached else None


def cache_from_search_result(gbif_data):
    """Cache a species from a GBIF search result dict."""
    usage_key = gbif_data.get('key') or gbif_data.get('usageKey')
    if not usage_key:
        return None

    existing = db.session.get(SpeciesCache, usage_key)
    if existing:
        return existing

    return _cache_species(gbif_data)


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
        'common_name_en': r.get('vernacularName'),
        'common_name_zh': None,
        'taxon_rank': r.get('rank'),
        'kingdom': r.get('kingdom'),
        'phylum': r.get('phylum'),
        'class': r.get('class'),
        'order': r.get('order'),
        'family': r.get('family'),
        'genus': r.get('genus'),
        'taxon_path': _build_taxon_path(r),
    }
