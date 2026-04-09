"""Chinese name resolution and TaiCOL integration.

Fallback chain for species-level Chinese names:
  0. Static override table (corrects known Wikidata errors)
  1. TaiCOL (by scientific name) - authoritative for zh-tw
  2. Wikidata (by GBIF taxon ID) - broader coverage, less reliable
  3. GBIF synonyms → TaiCOL (handles GBIF/TaiCOL taxonomy discrepancies)
  4. Static taxonomy_zh table (higher ranks only)
"""

from .enrichment import _enrich_chinese_names, clean_alt_names
from .resolution import (
    _resolve_alternative_names,
    _resolve_chinese_name,
    _resolve_rank_zh,
    clear_chinese_name_caches,
    resolve_missing_chinese_name,
)
from .taicol_search import (
    _build_from_taicol,
    _fallback_taicol_by_name,
    _search_via_taicol,
    _search_via_taicol_stream,
)

__all__ = [
    "_build_from_taicol",
    "_enrich_chinese_names",
    "_fallback_taicol_by_name",
    "_resolve_alternative_names",
    "_resolve_chinese_name",
    "_resolve_rank_zh",
    "_search_via_taicol",
    "_search_via_taicol_stream",
    "clean_alt_names",
    "clear_chinese_name_caches",
    "resolve_missing_chinese_name",
]
