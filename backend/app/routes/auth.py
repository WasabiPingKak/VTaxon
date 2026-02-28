from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from ..auth import login_required
from ..extensions import db
from ..models import AuthIdAlias, User

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
    raw_auth_id = g.raw_auth_id
    data = request.get_json() or {}
    link_to_user_id = data.get('link_to_user_id')

    user = db.session.get(User, user_id)

    if user is None and link_to_user_id:
        # Cross-email OAuth linking: Supabase created a new auth user,
        # but the frontend tells us to link it to an existing VTaxon user.
        target = db.session.get(User, link_to_user_id)
        if target:
            # Create alias: map the new JWT sub to the original VTaxon user
            existing_alias = db.session.get(AuthIdAlias, raw_auth_id)
            if not existing_alias:
                try:
                    alias = AuthIdAlias(auth_id=raw_auth_id, user_id=link_to_user_id)
                    db.session.add(alias)
                    db.session.commit()
                except IntegrityError:
                    db.session.rollback()
            return jsonify(target.to_dict()), 200

    if user is None:
        # Derive primary_platform from login provider
        login_provider = data.get('login_provider', '')
        platform_map = {'google': 'youtube', 'twitch': 'twitch'}
        primary_platform = platform_map.get(login_provider)

        # Race condition guard: onAuthStateChange can fire multiple times
        # concurrently, all seeing user=None and attempting INSERT.
        try:
            user = User(
                id=user_id,
                display_name=data.get('display_name', 'Unnamed Vtuber'),
                avatar_url=data.get('avatar_url'),
                primary_platform=primary_platform,
            )
            db.session.add(user)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            user = db.session.get(User, user_id)
    else:
        # Existing user: don't overwrite display_name / avatar_url
        # to preserve user-customized name and primary_platform avatar
        db.session.commit()

    return jsonify(user.to_dict()), 200
