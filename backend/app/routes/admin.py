import logging
from datetime import UTC, datetime

from flask import Blueprint, g, jsonify, request
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

from ..auth import admin_required
from ..cache import invalidate_fictional_tree_cache, invalidate_tree_cache
from ..extensions import db
from ..models import Breed, BreedRequest, FictionalSpeciesRequest, SpeciesCache, SpeciesNameReport, User, UserReport

logger = logging.getLogger(__name__)

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

    # Species name reports: group by status
    name_report_rows = (
        db.session.query(SpeciesNameReport.status, func.count())
        .group_by(SpeciesNameReport.status)
        .all()
    )
    name_report = {status: count for status, count in name_report_rows}

    # User reports: group by status
    report_rows = (
        db.session.query(UserReport.status, func.count())
        .group_by(UserReport.status)
        .all()
    )
    report = {status: count for status, count in report_rows}

    # Visibility pending reviews count
    pending_review_count = User.query.filter_by(visibility='pending_review').count()

    return jsonify({
        'fictional': fictional,
        'breed': breed,
        'name_report': name_report,
        'report': report,
        'visibility': {'pending_review': pending_review_count},
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

    return jsonify({
        'export_metadata': {
            'exported_at': datetime.now(UTC).isoformat(),
            'type': 'fictional_species',
            'total_requests': len(requests),
        },
        'instructions': (
            '以下是已排入待辦的虛構物種回報。'
            '請檢查這些物種是否有確切的文化來源或典故，使用者填的物種是否有具體可聯想的外型。'
            '除了評估適合分類在目前系統中的哪個分類以外，也可以獨立為比較特殊的物種建立新的分類。'
            '請跟我討論接下來的處理方式。'
            '【重要】禁止自行呼叫 API 變更回報狀態或寫入管理員備註，所有狀態變更必須由管理員手動操作。'
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
            'exported_at': datetime.now(UTC).isoformat(),
            'type': 'breed',
            'total_requests': len(requests),
        },
        'instructions': (
            '以下是已排入待辦的品種新增回報。'
            '請根據每筆回報，判斷品種名稱是否正確、是否已存在。'
            '回報為什麼在系統中查不到指定的品種或物種名稱。'
            '然後跟我討論接下來的處理方式。'
            '【重要】禁止自行呼叫 API 變更回報狀態或寫入管理員備註，所有狀態變更必須由管理員手動操作。'
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
    except SQLAlchemyError:
        db.session.rollback()
        logger.exception('批量轉移虛構物種回報失敗')
        return jsonify({'error': '批量轉移失敗，請稍後再試'}), 500
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
    except SQLAlchemyError:
        db.session.rollback()
        logger.exception('批量轉移品種回報失敗')
        return jsonify({'error': '批量轉移失敗，請稍後再試'}), 500
    return jsonify({'updated': len(reqs)})


@admin_bp.route('/users/<user_id>/visibility', methods=['PATCH'])
@admin_required
def set_user_visibility(user_id):
    """Set a user's visibility (visible/hidden). Admin only."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    new_visibility = data.get('visibility')
    if new_visibility not in ('visible', 'hidden'):
        return jsonify({'error': 'visibility must be visible or hidden'}), 400

    reason = (data.get('reason') or '').strip() or None

    user.visibility = new_visibility
    user.visibility_reason = reason
    user.visibility_changed_at = datetime.now(UTC)
    user.visibility_changed_by = g.current_user_id
    # Only clear appeal_note when restoring visibility;
    # keep it when rejecting so frontend can detect "appeal rejected"
    if new_visibility == 'visible':
        user.appeal_note = None

    db.session.commit()
    invalidate_tree_cache()
    invalidate_fictional_tree_cache()

    return jsonify({
        'ok': True,
        'user_id': user.id,
        'visibility': user.visibility,
    })


@admin_bp.route('/users/pending-reviews', methods=['GET'])
@admin_required
def pending_reviews():
    """List users with pending_review visibility (appealed). Admin only."""
    users = (
        User.query
        .filter_by(visibility='pending_review')
        .order_by(User.updated_at.desc())
        .all()
    )
    return jsonify({
        'users': [
            {
                **u.to_dict(),
                'appeal_note': u.appeal_note,
            }
            for u in users
        ],
    })
