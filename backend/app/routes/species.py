from flask import Blueprint, jsonify, request

from ..services.gbif import get_species, search_species

species_bp = Blueprint('species', __name__)


@species_bp.route('/search', methods=['GET'])
def search():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'error': 'Query parameter q is required'}), 400

    limit = request.args.get('limit', 20, type=int)
    limit = min(limit, 50)

    try:
        results = search_species(q, limit=limit)
    except Exception as e:
        return jsonify({'error': f'GBIF search failed: {e}'}), 502

    return jsonify({'results': results})


@species_bp.route('/<int:taxon_id>', methods=['GET'])
def get_one(taxon_id):
    result = get_species(taxon_id)
    if not result:
        return jsonify({'error': 'Species not found'}), 404
    return jsonify(result)
