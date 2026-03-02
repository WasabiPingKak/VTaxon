from flask import Blueprint, g, jsonify, request

from ..auth import admin_required, login_required
from ..extensions import db
from ..models import FictionalSpecies, FictionalSpeciesRequest

fictional_bp = Blueprint('fictional', __name__)


@fictional_bp.route('', methods=['GET'])
def list_fictional_species():
    query = FictionalSpecies.query

    origin = request.args.get('origin')
    if origin:
        query = query.filter_by(origin=origin)

    species = query.order_by(
        FictionalSpecies.origin,
        FictionalSpecies.sub_origin,
        FictionalSpecies.name,
    ).all()

    return jsonify({'species': [s.to_dict() for s in species]})


@fictional_bp.route('/requests', methods=['GET'])
@admin_required
def list_requests():
    status = request.args.get('status', 'pending')
    if status not in ('pending', 'approved', 'rejected'):
        return jsonify({'error': 'Invalid status filter'}), 400

    reqs = (FictionalSpeciesRequest.query
            .filter_by(status=status)
            .order_by(FictionalSpeciesRequest.created_at.desc())
            .all())

    return jsonify({'requests': [r.to_dict() for r in reqs]})


@fictional_bp.route('/requests/<int:req_id>', methods=['PATCH'])
@admin_required
def update_request(req_id):
    req = db.session.get(FictionalSpeciesRequest, req_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status not in ('approved', 'rejected'):
        return jsonify({'error': 'status must be approved or rejected'}), 400

    req.status = new_status
    req.admin_note = data.get('admin_note') or req.admin_note

    # Auto-create fictional_species on approval
    if new_status == 'approved':
        species_data = data.get('species') or {}
        name = species_data.get('name') or req.name_en or req.name_zh
        name_zh = species_data.get('name_zh') or req.name_zh
        origin = species_data.get('origin') or req.suggested_origin
        sub_origin = species_data.get('sub_origin') or req.suggested_sub_origin
        description = species_data.get('description') or req.description

        if not origin:
            return jsonify({'error': 'origin is required for approval'}), 400

        new_species = FictionalSpecies(
            name=name,
            name_zh=name_zh,
            origin=origin,
            sub_origin=sub_origin or None,
            category_path=f"{origin}|{sub_origin}" if sub_origin else origin,
            description=description,
        )
        db.session.add(new_species)

    db.session.commit()

    result = req.to_dict()
    if new_status == 'approved':
        result['created_species'] = new_species.to_dict()

    return jsonify(result)


@fictional_bp.route('/requests', methods=['POST'])
@login_required
def create_request():
    data = request.get_json() or {}

    name_zh = (data.get('name_zh') or '').strip()
    if not name_zh:
        return jsonify({'error': 'name_zh is required'}), 400

    req = FictionalSpeciesRequest(
        user_id=g.current_user_id,
        name_zh=name_zh,
        name_en=(data.get('name_en') or '').strip() or None,
        suggested_origin=(data.get('suggested_origin') or '').strip() or None,
        suggested_sub_origin=(data.get('suggested_sub_origin') or '').strip() or None,
        description=(data.get('description') or '').strip() or None,
    )
    db.session.add(req)
    db.session.commit()

    return jsonify(req.to_dict()), 201
