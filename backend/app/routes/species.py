from flask import Blueprint, Response, g, jsonify, request, stream_with_context

from ..auth import admin_required, login_required
from ..extensions import db
from ..limiter import limiter
from ..models import SpeciesCache, SpeciesNameReport
from ..services.gbif import (
    clear_chinese_name_caches,
    get_species,
    get_subspecies,
    get_subspecies_stream,
    match_species,
    search_species,
    search_species_stream,
)

species_bp = Blueprint('species', __name__)
limiter.limit("30/minute")(species_bp)


@species_bp.route('/search', methods=['GET'])
def search():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'error': 'Query parameter q is required'}), 400

    limit = request.args.get('limit', 10, type=int)
    limit = min(limit, 50)

    try:
        results = search_species(q, limit=limit)
    except Exception as e:
        return jsonify({'error': f'GBIF search failed: {e}'}), 502

    return jsonify({'results': results})


@species_bp.route('/search/stream', methods=['GET'])
def search_stream():
    """Streaming species search — returns NDJSON (one JSON object per line).

    Results are sent incrementally as each species is enriched with Chinese names,
    so the frontend can render them one by one instead of waiting for all results.
    """
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'error': 'Query parameter q is required'}), 400

    limit = request.args.get('limit', 10, type=int)
    limit = min(limit, 50)

    def generate():
        try:
            for line in search_species_stream(q, limit=limit):
                yield line
        except Exception as e:
            import json
            yield json.dumps({'error': str(e)}, ensure_ascii=False) + '\n'

    return Response(
        stream_with_context(generate()),
        mimetype='application/x-ndjson',
        headers={
            'X-Accel-Buffering': 'no',
            'Cache-Control': 'no-cache',
        },
    )


@species_bp.route('/match', methods=['GET'])
def match():
    """Exact match a species name against GBIF Backbone Taxonomy.

    Returns a single best match with confidence score.
    """
    name = request.args.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Query parameter name is required'}), 400

    try:
        result = match_species(name)
    except Exception as e:
        return jsonify({'error': f'GBIF match failed: {e}'}), 502

    if not result:
        return jsonify({'error': 'No match found'}), 404

    return jsonify(result)


@species_bp.route('/<int:taxon_id>', methods=['GET'])
def get_one(taxon_id):
    result = get_species(taxon_id)
    if not result:
        return jsonify({'error': 'Species not found'}), 404
    return jsonify(result)


@species_bp.route('/<int:taxon_id>/children', methods=['GET'])
def get_children(taxon_id):
    """Fetch subspecies/children of a species via GBIF children API."""
    try:
        subspecies = get_subspecies(taxon_id)
    except Exception as e:
        return jsonify({'error': f'Failed to fetch children: {e}'}), 502
    return jsonify({'results': subspecies})


@species_bp.route('/<int:taxon_id>/children/stream', methods=['GET'])
def get_children_stream(taxon_id):
    """Streaming subspecies fetch — returns NDJSON (one JSON object per line)."""
    def generate():
        try:
            for line in get_subspecies_stream(taxon_id):
                yield line
        except Exception as e:
            import json
            yield json.dumps({'error': str(e)}, ensure_ascii=False) + '\n'

    return Response(
        stream_with_context(generate()),
        mimetype='application/x-ndjson',
        headers={
            'X-Accel-Buffering': 'no',
            'Cache-Control': 'no-cache',
        },
    )


@species_bp.route('/cache/clear', methods=['POST'])
@admin_required
def clear_cache():
    """Clear Chinese name caches (admin only).

    Clears both in-memory LRU caches and DB species_cache.common_name_zh.
    Optional JSON body: {"taxon_ids": [12345, 67890]} to target specific taxa.
    """
    # 1. Clear all in-memory LRU caches
    clear_chinese_name_caches()

    # 2. Clear DB cache
    data = request.get_json(silent=True) or {}
    taxon_ids = data.get('taxon_ids')

    if taxon_ids:
        # Clear specific taxa
        result = db.session.execute(
            db.update(SpeciesCache)
            .where(SpeciesCache.taxon_id.in_(taxon_ids))
            .where(SpeciesCache.common_name_zh.isnot(None))
            .values(common_name_zh=None)
        )
    else:
        # Clear all
        result = db.session.execute(
            db.update(SpeciesCache)
            .where(SpeciesCache.common_name_zh.isnot(None))
            .values(common_name_zh=None)
        )

    db.session.commit()
    cleared_count = result.rowcount

    return jsonify({
        'cleared_count': cleared_count,
        'lru_caches_cleared': True,
        'scope': 'specific' if taxon_ids else 'all',
    })


# ── Name Reports ──────────────────────────────────────────────────

@species_bp.route('/name-reports', methods=['POST'])
@login_required
def create_name_report():
    """Submit a species name report (missing or wrong Chinese name)."""
    data = request.get_json() or {}
    taxon_id = data.get('taxon_id')
    report_type = data.get('report_type')
    suggested_name_zh = (data.get('suggested_name_zh') or '').strip()

    if not report_type or not suggested_name_zh:
        return jsonify({'error': 'report_type, suggested_name_zh 為必填'}), 400

    if report_type not in ('missing_zh', 'wrong_zh', 'not_found'):
        return jsonify({'error': 'report_type 必須為 missing_zh、wrong_zh 或 not_found'}), 400

    if report_type != 'not_found' and not taxon_id:
        return jsonify({'error': 'taxon_id 為必填（not_found 類型除外）'}), 400

    if report_type == 'not_found':
        description = (data.get('description') or '').strip()
        if not description:
            return jsonify({'error': 'not_found 類型必須填寫補充說明'}), 400

    # Look up current name from cache
    current_name_zh = None
    if taxon_id:
        species = db.session.get(SpeciesCache, taxon_id)
        current_name_zh = species.common_name_zh if species else None

    report = SpeciesNameReport(
        user_id=g.current_user_id,
        taxon_id=taxon_id,
        report_type=report_type,
        current_name_zh=current_name_zh,
        suggested_name_zh=suggested_name_zh,
        description=(data.get('description') or '').strip() or None,
    )
    db.session.add(report)
    db.session.commit()
    return jsonify(report.to_dict()), 201


@species_bp.route('/name-reports', methods=['GET'])
@admin_required
def list_name_reports():
    """List species name reports (admin only)."""
    status = request.args.get('status', 'pending')
    reports = (SpeciesNameReport.query
               .filter_by(status=status)
               .order_by(SpeciesNameReport.created_at.desc())
               .all())
    return jsonify({'reports': [r.to_dict() for r in reports]})


@species_bp.route('/name-reports/<int:report_id>', methods=['PATCH'])
@admin_required
def update_name_report(report_id):
    """Update a species name report (admin only)."""
    report = db.session.get(SpeciesNameReport, report_id)
    if not report:
        return jsonify({'error': 'Report not found'}), 404

    data = request.get_json() or {}
    old_status = report.status

    if 'status' in data:
        report.status = data['status']
    if 'admin_note' in data:
        report.admin_note = data['admin_note']

    if report.status != old_status:
        from ..services.notifications import create_notification
        create_notification(
            report.user_id, 'species_name_report', report.id,
            report.status,
            admin_note=report.admin_note,
            subject_name=report.suggested_name_zh,
        )

    db.session.commit()
    return jsonify(report.to_dict())
