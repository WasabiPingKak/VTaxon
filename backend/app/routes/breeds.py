from flask import Blueprint, jsonify, request
from sqlalchemy import func

from ..auth import admin_required
from ..cache import invalidate_tree_cache
from ..extensions import db
from ..models import Breed, SpeciesCache

breeds_bp = Blueprint('breeds', __name__)


@breeds_bp.route('', methods=['GET'])
def list_breeds():
    taxon_id = request.args.get('taxon_id', type=int)
    if not taxon_id:
        return jsonify({'error': 'taxon_id query parameter required'}), 400

    breeds = Breed.query.filter_by(taxon_id=taxon_id).order_by(Breed.name_zh).all()

    # Fallback: GBIF keys can change over time — if no breeds found for this
    # exact taxon_id, look for breeds under other taxon_ids that share the
    # same canonical scientific name (e.g. "Canis lupus familiaris").
    if not breeds:
        sp = SpeciesCache.query.get(taxon_id)
        if sp:
            # Extract canonical name: genus (upper) + lowercase epithets,
            # stop at author (next uppercase word after genus).
            parts = sp.scientific_name.split()
            canon_parts = [parts[0]]  # genus
            for p in parts[1:]:
                if p[0].islower():
                    canon_parts.append(p)
                else:
                    break
            canon = ' '.join(canon_parts)
            alt_ids = (
                db.session.query(SpeciesCache.taxon_id)
                .filter(SpeciesCache.taxon_id != taxon_id)
                .filter(SpeciesCache.scientific_name.like(f'{canon}%'))
                .all()
            )
            for (alt_id,) in alt_ids:
                breeds = Breed.query.filter_by(taxon_id=alt_id) \
                    .order_by(Breed.name_zh).all()
                if breeds:
                    break

    return jsonify({'breeds': [b.to_dict() for b in breeds]})


@breeds_bp.route('/search', methods=['GET'])
def search_breeds():
    """Search breeds by name (Chinese prefix or English case-insensitive prefix)."""
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'error': 'Query parameter q is required'}), 400

    limit = request.args.get('limit', 20, type=int)
    limit = min(limit, 50)

    # Detect CJK
    has_cjk = any(0x4E00 <= ord(ch) <= 0x9FFF or 0x3400 <= ord(ch) <= 0x4DBF
                  for ch in q)

    if has_cjk:
        breeds = (Breed.query
                  .filter(Breed.name_zh.isnot(None))
                  .filter(Breed.name_zh.like(f'{q}%'))
                  .limit(limit)
                  .all())
    else:
        breeds = (Breed.query
                  .filter(func.lower(Breed.name_en).like(f'{q.lower()}%'))
                  .limit(limit)
                  .all())

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
