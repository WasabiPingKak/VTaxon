"""Wikidata API client for fetching Traditional Chinese (zh-tw) taxonomy names.

Uses GBIF taxon ID (Wikidata property P846) to find matching entities,
then retrieves zh-tw / zh-hant / zh labels with automatic fallback.

All returned Chinese names are guaranteed to be in Traditional Chinese
(Taiwan standard) via OpenCC s2twp conversion.
"""

from functools import lru_cache

import requests
from opencc import OpenCC

# Simplified → Traditional (Taiwan phrases) converter
_s2twp = OpenCC('s2twp')

WIKIDATA_API = 'https://www.wikidata.org/w/api.php'
USER_AGENT = 'VTaxon/1.0 (https://github.com/VTaxon)'

# Fallback chain: Taiwan Traditional Chinese → Generic Traditional → Generic Chinese
ZH_LANGS = ('zh-tw', 'zh-hant', 'zh')


def _wikidata_get(params):
    """Make a request to the Wikidata API with proper User-Agent."""
    params.setdefault('format', 'json')
    resp = requests.get(WIKIDATA_API, params=params,
                        headers={'User-Agent': USER_AGENT}, timeout=10)
    resp.raise_for_status()
    return resp.json()


def get_chinese_name_by_gbif_id(gbif_taxon_id):
    """Fetch zh-tw label from Wikidata using a GBIF taxon ID (P846).

    Returns (chinese_name, english_name) tuple, either may be None.
    """
    # Step 1: Find Wikidata entity via haswbstatement search
    qid = _find_entity_by_gbif_id(gbif_taxon_id)
    if not qid:
        return None, None

    # Step 2: Fetch labels
    return _get_labels(qid)


def get_chinese_names_batch(gbif_taxon_ids):
    """Batch fetch zh-tw labels for multiple GBIF taxon IDs.

    Uses wbgetentities API (max 50 per request).
    Returns dict: {gbif_taxon_id: (chinese_name, english_name)}
    """
    if not gbif_taxon_ids:
        return {}

    # Step 1: Find all entity QIDs
    qid_map = {}  # qid -> gbif_taxon_id
    for tid in gbif_taxon_ids:
        qid = _find_entity_by_gbif_id(tid)
        if qid:
            qid_map[qid] = tid

    if not qid_map:
        return {}

    # Step 2: Batch fetch labels (50 per request)
    results = {}
    qids = list(qid_map.keys())
    for i in range(0, len(qids), 50):
        batch = qids[i:i + 50]
        data = _wikidata_get({
            'action': 'wbgetentities',
            'ids': '|'.join(batch),
            'languages': 'zh-tw|zh-hant|zh|en',
            'props': 'labels',
        })
        for qid, entity in data.get('entities', {}).items():
            gbif_id = qid_map.get(qid)
            if gbif_id is None:
                continue
            labels = entity.get('labels', {})
            zh_name = _pick_zh_label(labels)
            en_name = labels.get('en', {}).get('value')
            results[gbif_id] = (zh_name, en_name)

    return results


@lru_cache(maxsize=500)
def _find_entity_by_gbif_id(gbif_taxon_id):
    """Find Wikidata entity QID by GBIF taxon ID (P846)."""
    try:
        data = _wikidata_get({
            'action': 'query',
            'list': 'search',
            'srsearch': f'haswbstatement:P846={gbif_taxon_id}',
            'srlimit': 1,
        })
        results = data.get('query', {}).get('search', [])
        if results:
            return results[0]['title']  # e.g. "Q42627"
    except Exception:
        pass
    return None


def _get_labels(qid):
    """Fetch zh-tw and en labels for a single Wikidata entity."""
    try:
        data = _wikidata_get({
            'action': 'wbgetentities',
            'ids': qid,
            'languages': 'zh-tw|zh-hant|zh|en',
            'props': 'labels',
            'languagefallback': '1',
        })
        entity = data.get('entities', {}).get(qid, {})
        labels = entity.get('labels', {})
        zh_name = _pick_zh_label(labels)
        en_name = labels.get('en', {}).get('value')
        return zh_name, en_name
    except Exception:
        return None, None


def clear_cache():
    """Clear in-memory LRU caches for Wikidata lookups."""
    _find_entity_by_gbif_id.cache_clear()


def _pick_zh_label(labels):
    """Pick the best Chinese label from zh-tw → zh-hant → zh fallback chain.

    All values are passed through OpenCC s2twp to ensure Traditional Chinese
    (Taiwan standard), since Wikidata zh-tw labels are sometimes mislabeled
    simplified Chinese (e.g. 家养豚鼠 instead of 家養豚鼠).
    """
    for lang in ZH_LANGS:
        label = labels.get(lang, {})
        value = label.get('value')
        if value:
            return _s2twp.convert(value)
    return None
