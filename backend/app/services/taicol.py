"""TaiCOL (臺灣物種名錄) API client for fetching Traditional Chinese taxonomy names.

Used as fallback when Wikidata doesn't have a Chinese name.
Also used as primary search engine for Chinese-language queries.
API docs: https://api.taicol.tw/swagger/
"""

from functools import lru_cache

import requests

TAICOL_BASE = 'https://api.taicol.tw/v2'


def search_by_chinese(query, limit=10):
    """Search TaiCOL by Chinese name using taxon_group parameter.

    Returns list of dicts with scientific_name, common_name_c, rank, etc.
    """
    try:
        resp = requests.get(f'{TAICOL_BASE}/taxon', params={
            'taxon_group': query,
            'limit': limit,
        }, timeout=10)
        if resp.status_code != 200:
            return []

        data = resp.json().get('data', [])
        results = []
        for entry in data:
            rank = (entry.get('rank') or '').lower()
            if rank not in ('species', 'subspecies'):
                continue
            results.append({
                'scientific_name': entry.get('simple_name'),
                'common_name_zh': entry.get('common_name_c'),
                'alternative_name_zh': entry.get('alternative_name_c'),
                'rank': entry.get('rank'),
            })
        return results
    except Exception:
        return []


@lru_cache(maxsize=500)
def get_chinese_name(scientific_name):
    """Fetch Traditional Chinese name from TaiCOL by scientific name.

    Returns (chinese_name, alternative_names) tuple.
    chinese_name may be None if not found.
    alternative_names is a string of comma-separated alternatives, or None.
    """
    try:
        resp = requests.get(f'{TAICOL_BASE}/taxon', params={
            'scientific_name': scientific_name,
            'limit': 1,
        }, timeout=10)
        if resp.status_code != 200:
            return None, None

        data = resp.json().get('data', [])
        if not data:
            return None, None

        entry = data[0]
        return entry.get('common_name_c'), entry.get('alternative_name_c')
    except Exception:
        return None, None


def clear_cache():
    """Clear in-memory LRU caches for TaiCOL lookups."""
    get_chinese_name.cache_clear()


def get_higher_taxa_zh(taicol_taxon_id):
    """Fetch full taxonomy hierarchy with Chinese names from TaiCOL.

    Returns list of dicts: [{'rank': 'Kingdom', 'name': 'Animalia', 'name_zh': '動物界'}, ...]
    """
    try:
        resp = requests.get(f'{TAICOL_BASE}/higherTaxa', params={
            'taxon_id': taicol_taxon_id,
        }, timeout=10)
        if resp.status_code != 200:
            return []

        data = resp.json().get('data', [])
        return [
            {
                'rank': item.get('rank'),
                'name': item.get('simple_name'),
                'name_zh': item.get('common_name_c'),
            }
            for item in data
        ]
    except Exception:
        return []
