from functools import wraps

import jwt
from flask import current_app, g, jsonify, request

from .models import User


def get_current_user():
    """Extract and verify JWT from Authorization header, set g.current_user."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header[7:]
    secret = current_app.config['SUPABASE_JWT_SECRET']
    if not secret:
        return None

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=['HS256'],
            audience='authenticated',
        )
    except jwt.InvalidTokenError:
        return None

    user_id = payload.get('sub')
    if not user_id:
        return None

    return user_id


def login_required(f):
    """Decorator that requires a valid JWT. Sets g.current_user_id and
    g.current_user (lazy-loaded)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_current_user()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        g.current_user_id = user_id
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator that requires the authenticated user to have admin role."""
    @wraps(f)
    @login_required
    def decorated(*args, **kwargs):
        from .extensions import db
        user = db.session.get(User, g.current_user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        g.current_user = user
        return f(*args, **kwargs)
    return decorated
