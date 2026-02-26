from flask import Blueprint, jsonify, request

from ..services.kinship import find_kinship

kinship_bp = Blueprint('kinship', __name__)


@kinship_bp.route('/<user_id>', methods=['GET'])
def get_kinship(user_id):
    include_human = request.args.get('include_human', 'false').lower() == 'true'
    limit = request.args.get('limit', 10, type=int)
    limit = min(limit, 50)

    results = find_kinship(user_id, include_human=include_human, limit=limit)
    return jsonify(results)
