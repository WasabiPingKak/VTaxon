from flask import Blueprint, g, jsonify, request
from sqlalchemy import func

from ..auth import admin_required, login_required
from ..cache import invalidate_tree_cache
from ..extensions import db
from ..models import Breed, BreedRequest, SpeciesCache

breeds_bp = Blueprint('breeds', __name__)


@breeds_bp.route('/categories', methods=['GET'])
def list_breed_categories():
    """Return species that have breeds, with breed count and species info."""
    rows = (
        db.session.query(Breed.taxon_id, func.count(Breed.id).label('breed_count'))
        .group_by(Breed.taxon_id)
        .all()
    )
    categories = []
    for taxon_id, breed_count in rows:
        sp = SpeciesCache.query.get(taxon_id)
        entry = {
            'taxon_id': taxon_id,
            'breed_count': breed_count,
        }
        if sp:
            entry.update(sp.to_dict())
        categories.append(entry)

    # Sort by breed_count descending
    categories.sort(key=lambda c: c['breed_count'], reverse=True)
    return jsonify({'categories': categories})


@breeds_bp.route('', methods=['GET'])
def list_breeds():
    taxon_id = request.args.get('taxon_id', type=int)
    if not taxon_id:
        return jsonify({'error': 'taxon_id query parameter required'}), 400

    breeds = Breed.query.filter_by(taxon_id=taxon_id).order_by(Breed.name_zh).all()
    actual_taxon_id = taxon_id

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
                    actual_taxon_id = alt_id
                    break

    # Include parent species info so frontend can construct full onSelect payload
    sp = SpeciesCache.query.get(actual_taxon_id)
    species_info = sp.to_dict() if sp else None

    return jsonify({'breeds': [b.to_dict() for b in breeds], 'species': species_info})


@breeds_bp.route('/search', methods=['GET'])
def search_breeds():
    """Search breeds by name (Chinese substring or English case-insensitive substring)."""
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
                  .filter(Breed.name_zh.like(f'%{q}%'))
                  .limit(limit)
                  .all())
    else:
        breeds = (Breed.query
                  .filter(func.lower(Breed.name_en).like(f'%{q.lower()}%'))
                  .limit(limit)
                  .all())

    # Enrich each breed with parent species info
    results = []
    for b in breeds:
        d = b.to_dict()
        if b.species:
            d['species_name_zh'] = b.species.common_name_zh
            d['species_scientific_name'] = b.species.scientific_name
        results.append(d)

    return jsonify({'breeds': results})


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


# ── Breed Requests ──────────────────────────────────


@breeds_bp.route('/requests', methods=['POST'])
@login_required
def create_breed_request():
    data = request.get_json() or {}

    name_zh = (data.get('name_zh') or '').strip()
    name_en = (data.get('name_en') or '').strip()
    if not name_zh and not name_en:
        return jsonify({'error': '請至少填寫中文或英文品種名稱'}), 400

    req = BreedRequest(
        user_id=g.current_user_id,
        taxon_id=data.get('taxon_id'),
        name_zh=name_zh or None,
        name_en=name_en or None,
        description=(data.get('description') or '').strip() or None,
    )
    db.session.add(req)
    db.session.commit()

    return jsonify(req.to_dict()), 201


@breeds_bp.route('/requests', methods=['GET'])
@admin_required
def list_breed_requests():
    status = request.args.get('status', 'pending')
    if status not in ('pending', 'approved', 'rejected'):
        return jsonify({'error': 'Invalid status filter'}), 400

    reqs = (BreedRequest.query
            .filter_by(status=status)
            .order_by(BreedRequest.created_at.desc())
            .all())

    return jsonify({'requests': [r.to_dict() for r in reqs]})


@breeds_bp.route('/requests/<int:req_id>', methods=['PATCH'])
@admin_required
def update_breed_request(req_id):
    req = db.session.get(BreedRequest, req_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status not in ('approved', 'rejected'):
        return jsonify({'error': 'status must be approved or rejected'}), 400

    req.status = new_status
    req.admin_note = data.get('admin_note') or req.admin_note

    db.session.commit()

    return jsonify(req.to_dict())
