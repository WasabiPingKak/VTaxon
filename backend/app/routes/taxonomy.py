from flask import Blueprint, jsonify

from ..extensions import db
from ..models import User, VtuberTrait, SpeciesCache
from ..services.gbif import _resolve_rank_zh

taxonomy_bp = Blueprint('taxonomy', __name__)

RANK_FIELDS = [
    ('kingdom', 'KINGDOM'),
    ('phylum', 'PHYLUM'),
    ('class', 'CLASS'),
    ('order', 'ORDER'),
    ('family', 'FAMILY'),
    ('genus', 'GENUS'),
]


@taxonomy_bp.route('/tree', methods=['GET'])
def get_taxonomy_tree():
    """Return all vtuber traits with real species, joined with user and species data.

    Frontend builds the tree structure from the flat list using taxon_path.
    """
    rows = (
        db.session.query(VtuberTrait, SpeciesCache, User)
        .join(SpeciesCache, VtuberTrait.taxon_id == SpeciesCache.taxon_id)
        .join(User, VtuberTrait.user_id == User.id)
        .filter(VtuberTrait.taxon_id.isnot(None))
        .all()
    )

    entries = []
    for trait, species, user in rows:
        sp_dict = species.to_dict()

        # Build path_zh with Wikidata fallback for missing Chinese names
        path_zh = {}
        for field, rank_enum in RANK_FIELDS:
            zh_key = f'{field}_zh'
            zh = sp_dict.get(zh_key)
            if not zh:
                latin = getattr(species, field if field != 'class' else 'class_', None)
                if latin:
                    zh = _resolve_rank_zh(latin, rank=rank_enum)
            path_zh[field] = zh

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
            'breed_name': trait.breed_name,
            'path_zh': path_zh,
        })

    return jsonify({'entries': entries})
