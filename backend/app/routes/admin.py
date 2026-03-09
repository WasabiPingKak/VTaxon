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
            '以下是已受理的虛構物種回報。'
            '請檢查這些物種是否有確切的文化來源或典故，使用者填的物種是否有具體可聯想的外型。'
            '除了評估適合分類在目前系統中的哪個分類以外，也可以獨立為比較特殊的物種建立新的分類。'
            '請跟我討論接下來的處理方式。'
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
            '以下是已受理的品種新增回報。'
            '請根據每筆回報，判斷品種名稱是否正確、是否已存在。'
            '回報為什麼在系統中查不到指定的品種或物種名稱。'
            '然後跟我討論接下來的處理方式。'
        ),
        'requests': result_requests,
    })


@admin_bp.route('/transition-fictional', methods=['POST'])
@admin_required
def transition_fictional():
    """Batch transition all received fictional requests to in_progress."""
    from ..services.notifications import create_notification

    reqs = (
        FictionalSpeciesRequest.query
        .filter_by(status='received')
        .all()
    )
    for r in reqs:
        r.status = 'in_progress'
        create_notification(
            r.user_id, 'fictional_request', r.id, 'in_progress',
            subject_name=r.name_zh,
        )
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'批量轉移失敗：{e}'}), 500
    return jsonify({'updated': len(reqs)})


@admin_bp.route('/transition-breeds', methods=['POST'])
@admin_required
def transition_breeds():
    """Batch transition all received breed requests to in_progress."""
    from ..services.notifications import create_notification

    reqs = (
        BreedRequest.query
        .filter_by(status='received')
        .all()
    )
    for r in reqs:
        r.status = 'in_progress'
        create_notification(
            r.user_id, 'breed_request', r.id, 'in_progress',
            subject_name=r.name_zh or r.name_en,
        )
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'批量轉移失敗：{e}'}), 500
    return jsonify({'updated': len(reqs)})
