import logging

from flask import Blueprint, jsonify

from ..cache import get_tree_cache, set_tree_cache
from ..extensions import db
from ..models import User, VtuberTrait, SpeciesCache
from ..services.gbif import _build_path_zh

log = logging.getLogger(__name__)

taxonomy_bp = Blueprint('taxonomy', __name__)


def _rebuild_path_zh(species):
    """Rebuild path_zh using full fallback chain (static table + Wikidata).

    Uses _build_path_zh which has @lru_cache on Wikidata calls,
    so external API hits only happen once per unique rank name.
    """
    data = {
        'kingdom': species.kingdom,
        'phylum': species.phylum,
        'class': species.class_,
        'order': species.order_,
        'family': species.family,
        'genus': species.genus,
    }
    result = _build_path_zh(data)
    if result:
        species.path_zh = result
    return result


@taxonomy_bp.route('/tree', methods=['GET'])
def get_taxonomy_tree():
    """Return all vtuber traits with real species, joined with user and species data.

    Frontend builds the tree structure from the flat list using taxon_path.
    Uses in-process cache (TTL 5 min) to avoid repeated DB queries.
    """
    cached = get_tree_cache()
    if cached:
        return jsonify(cached)

    rows = (
        db.session.query(VtuberTrait, SpeciesCache, User)
        .join(SpeciesCache, VtuberTrait.taxon_id == SpeciesCache.taxon_id)
        .join(User, VtuberTrait.user_id == User.id)
        .filter(VtuberTrait.taxon_id.isnot(None))
        .all()
    )

    needs_commit = False
    entries = []
    for trait, species, user in rows:
        # Read pre-computed path_zh from DB (written at cache-time by _cache_species)
        path_zh = species.path_zh or {}

        # Auto-rebuild path_zh from static table if empty
        if not path_zh or path_zh == {}:
            path_zh = _rebuild_path_zh(species)
            if path_zh:
                needs_commit = True

        # Breed info: prefer breed object, fallback to legacy free-text
        breed_id = trait.breed_id
        breed_name_zh = None
        breed_name_en = None
        breed_name = trait.breed_name  # legacy fallback
        if trait.breed:
            breed_name_zh = trait.breed.name_zh
            breed_name_en = trait.breed.name_en
            breed_name = breed_name_zh or breed_name_en

        entries.append({
            'user_id': user.id,
            'display_name': user.display_name,
            'avatar_url': user.avatar_url,
            'country_flags': user.country_flags or [],
            'taxon_id': species.taxon_id,
            'taxon_rank': species.taxon_rank,
            'taxon_path': species.taxon_path,
            'scientific_name': species.scientific_name,
            'common_name_zh': species.common_name_zh,
            'breed_name': breed_name,
            'breed_id': breed_id,
            'breed_name_zh': breed_name_zh,
            'breed_name_en': breed_name_en,
            'path_zh': path_zh,
        })

    # Persist rebuilt path_zh to DB so future reads are instant
    if needs_commit:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

    result = {'entries': entries}
    set_tree_cache(result)
    return jsonify(result)
