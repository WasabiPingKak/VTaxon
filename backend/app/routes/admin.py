from datetime import datetime, timezone

from flask import Blueprint, jsonify
from sqlalchemy import func

from ..auth import admin_required
from ..extensions import db
from ..models import (Breed, BreedRequest, FictionalSpecies,
                      FictionalSpeciesRequest, SpeciesCache, UserReport)

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/request-counts')
@admin_required
def get_request_counts():
    """Return status counts for all admin request types in one call."""
    # Fictional species requests: group by status
    fictional_rows = (
        db.session.query(FictionalSpeciesRequest.status, func.count())
        .group_by(FictionalSpeciesRequest.status)
        .all()
    )
    fictional = {status: count for status, count in fictional_rows}

    # Breed requests: group by status
    breed_rows = (
        db.session.query(BreedRequest.status, func.count())
        .group_by(BreedRequest.status)
        .all()
    )
    breed = {status: count for status, count in breed_rows}

    # User reports: group by status
    report_rows = (
        db.session.query(UserReport.status, func.count())
        .group_by(UserReport.status)
        .all()
    )
    report = {status: count for status, count in report_rows}

    return jsonify({
        'fictional': fictional,
        'breed': breed,
        'report': report,
    })


@admin_bp.route('/export-fictional')
@admin_required
def export_fictional():
    """Export all received fictional species requests with reference data."""
    requests = (
        FictionalSpeciesRequest.query
        .filter_by(status='received')
        .order_by(FictionalSpeciesRequest.created_at)
        .all()
    )

    # Build classification tree from existing fictional species
    all_fictional = FictionalSpecies.query.all()
    tree = {}
    for fs in all_fictional:
        if fs.origin not in tree:
            tree[fs.origin] = []
        if fs.sub_origin and fs.sub_origin not in tree[fs.origin]:
            tree[fs.origin].append(fs.sub_origin)

    existing = [
        {
            'id': fs.id,
            'name': fs.name,
            'name_zh': fs.name_zh,
            'origin': fs.origin,
            'sub_origin': fs.sub_origin,
        }
        for fs in all_fictional
    ]

    return jsonify({
        'export_metadata': {
            'exported_at': datetime.now(timezone.utc).isoformat(),
            'type': 'fictional_species',
            'total_requests': len(requests),
        },
        'instructions': (
            '以下是已受理的虛構物種新增回報。請根據 reference_data 中的分類體系和'
            '現有物種清單，判斷每筆回報應歸入哪個 origin / sub_origin，'
            '並為每筆建立 fictional_species 記錄。'
            '如果回報的物種已存在於 existing_fictional_species 中，請標註為重複。'
            '完成後將每筆 request 的 status 更新為 completed。'
        ),
        'requests': [
            {
                'request_id': r.id,
                'name_zh': r.name_zh,
                'name_en': r.name_en,
                'suggested_origin': r.suggested_origin,
                'suggested_sub_origin': r.suggested_sub_origin,
                'description': r.description,
                'admin_note': r.admin_note,
                'created_at': r.created_at.isoformat(),
            }
            for r in requests
        ],
        'reference_data': {
            'classification_tree': tree,
            'existing_fictional_species': existing,
        },
    })


@admin_bp.route('/export-breeds')
@admin_required
def export_breeds():
    """Export all received breed requests with species context."""
    requests = (
        BreedRequest.query
        .filter_by(status='received')
        .order_by(BreedRequest.created_at)
        .all()
    )

    result_requests = []
    for r in requests:
        species_ctx = None
        existing_breeds = []
        if r.taxon_id:
            sc = db.session.get(SpeciesCache, r.taxon_id)
            if sc:
                species_ctx = {
                    'taxon_id': sc.taxon_id,
                    'scientific_name': sc.scientific_name,
                    'common_name_zh': sc.common_name_zh,
                    'taxon_rank': sc.taxon_rank,
                }
            breeds = Breed.query.filter_by(taxon_id=r.taxon_id).all()
            existing_breeds = [
                {'name_en': b.name_en, 'name_zh': b.name_zh}
                for b in breeds
            ]

        result_requests.append({
            'request_id': r.id,
            'name_zh': r.name_zh,
            'name_en': r.name_en,
            'taxon_id': r.taxon_id,
            'description': r.description,
            'admin_note': r.admin_note,
            'created_at': r.created_at.isoformat(),
            'species_context': species_ctx,
            'existing_breeds_for_species': existing_breeds,
        })

    return jsonify({
        'export_metadata': {
            'exported_at': datetime.now(timezone.utc).isoformat(),
            'type': 'breed',
            'total_requests': len(requests),
        },
        'instructions': (
            '以下是已受理的品種新增回報。請根據每筆回報的 species_context 和'
            ' existing_breeds_for_species，判斷品種名稱是否正確、是否已存在，'
            '並為每筆建立 breeds 記錄（需指定 taxon_id、name_en、name_zh）。'
            '如果回報的品種已存在於 existing_breeds_for_species 中，請標註為重複。'
            '完成後將每筆 request 的 status 更新為 completed。'
        ),
        'requests': result_requests,
    })


@admin_bp.route('/transition-fictional', methods=['POST'])
@admin_required
def transition_fictional():
    """Batch transition all received fictional requests to in_progress."""
    count = (
        FictionalSpeciesRequest.query
        .filter_by(status='received')
        .update({'status': 'in_progress'})
    )
    db.session.commit()
    return jsonify({'updated': count})


@admin_bp.route('/transition-breeds', methods=['POST'])
@admin_required
def transition_breeds():
    """Batch transition all received breed requests to in_progress."""
    count = (
        BreedRequest.query
        .filter_by(status='received')
        .update({'status': 'in_progress'})
    )
    db.session.commit()
    return jsonify({'updated': count})
