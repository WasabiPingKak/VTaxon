from flask import Blueprint, jsonify

from ..extensions import db
from ..models import User, VtuberTrait, SpeciesCache

taxonomy_bp = Blueprint('taxonomy', __name__)


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
            'path_zh': {
                'kingdom': sp_dict.get('kingdom_zh'),
                'phylum': sp_dict.get('phylum_zh'),
                'class': sp_dict.get('class_zh'),
                'order': sp_dict.get('order_zh'),
                'family': sp_dict.get('family_zh'),
                'genus': sp_dict.get('genus_zh'),
            },
        })

    return jsonify({'entries': entries})
