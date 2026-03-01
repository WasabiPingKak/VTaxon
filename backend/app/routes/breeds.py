from flask import Blueprint, jsonify, request

from ..auth import admin_required
from ..cache import invalidate_tree_cache
from ..extensions import db
from ..models import Breed

breeds_bp = Blueprint('breeds', __name__)


@breeds_bp.route('', methods=['GET'])
def list_breeds():
    taxon_id = request.args.get('taxon_id', type=int)
    if not taxon_id:
        return jsonify({'error': 'taxon_id query parameter required'}), 400

    breeds = Breed.query.filter_by(taxon_id=taxon_id).order_by(Breed.name_zh).all()
    return jsonify({'breeds': [b.to_dict() for b in breeds]})


@breeds_bp.route('', methods=['POST'])
@admin_required
def create_breed():
    data = request.get_json() or {}

    taxon_id = data.get('taxon_id')
    name_en = (data.get('name_en') or '').strip()
    if not taxon_id or not name_en:
        return jsonify({'error': 'taxon_id and name_en required'}), 400

    breed = Breed(
        taxon_id=taxon_id,
        name_en=name_en,
        name_zh=(data.get('name_zh') or '').strip() or None,
        breed_group=(data.get('breed_group') or '').strip() or None,
    )
    db.session.add(breed)
    try:
        db.session.commit()
        invalidate_tree_cache()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Breed already exists for this species'}), 409

    return jsonify(breed.to_dict()), 201
