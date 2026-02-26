from flask import Blueprint, jsonify, request

from ..auth import login_required
from ..extensions import db
from ..models import User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/callback', methods=['POST'])
@login_required
def auth_callback():
    """After Supabase OAuth completes, create or update the user record.

    The frontend calls this with the JWT from Supabase Auth.
    The JWT's `sub` claim is the Supabase auth user ID, which we use as
    our users.id.
    """
    from flask import g
    user_id = g.current_user_id
    data = request.get_json() or {}

    user = db.session.get(User, user_id)
    if user is None:
        user = User(
            id=user_id,
            display_name=data.get('display_name', 'Unnamed Vtuber'),
            avatar_url=data.get('avatar_url'),
        )
        db.session.add(user)
    else:
        if 'display_name' in data:
            user.display_name = data['display_name']
        if 'avatar_url' in data:
            user.avatar_url = data['avatar_url']

    db.session.commit()
    return jsonify(user.to_dict()), 200
