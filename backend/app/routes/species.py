from flask import Blueprint, Response, jsonify, request, stream_with_context

from ..auth import admin_required
from ..extensions import db
from ..models import SpeciesCache
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
