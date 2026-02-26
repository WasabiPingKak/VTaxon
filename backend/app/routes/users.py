from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..extensions import db
from ..models import User

users_bp = Blueprint('users', __name__)


@users_bp.route('/me', methods=['GET'])
@login_required
def get_me():
    user = db.session.get(User, g.current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())


@users_bp.route('/me', methods=['PATCH'])
@login_required
def update_me():
    user = db.session.get(User, g.current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    allowed = {'display_name', 'avatar_url', 'organization', 'country_flags'}

    if 'country_flags' in data:
        flags = data['country_flags']
        if not isinstance(flags, list):
            return jsonify({'error': 'country_flags must be a list'}), 400
        cleaned = []
        for f in flags:
            if not isinstance(f, str) or len(f) != 2:
                return jsonify({'error': 'Each flag must be a 2-character country code'}), 400
            cleaned.append(f.upper())
        data['country_flags'] = cleaned

    for key in allowed:
        if key in data:
            setattr(user, key, data[key])

    db.session.commit()
    return jsonify(user.to_dict())


@users_bp.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())
