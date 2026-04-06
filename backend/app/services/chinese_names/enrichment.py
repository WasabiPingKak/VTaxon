"""Species enrichment — batch Chinese name population and alt-name cleaning."""

import logging
import unicodedata
from typing import Any

from sqlalchemy.exc import SQLAlchemyError

from ...extensions import db
from ...models import SpeciesCache
from ..taxonomy_zh import get_species_name_override, get_species_zh_override, get_taxonomy_zh_for_ranks
from .resolution import _resolve_alternative_names, _resolve_chinese_name, _resolve_genus_zh

logger = logging.getLogger(__name__)


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
    from ..gbif import _has_cjk
    from ..species_cache import _cache_enriched_species

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
    from ..gbif import _has_cjk

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
