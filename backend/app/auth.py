import logging
from functools import wraps

import jwt
import requests
from flask import current_app, g, jsonify, request

from .models import User

logger = logging.getLogger(__name__)

# Module-level cache for JWKS
_jwks_cache = {'keys': None}


def _get_jwks():
    """Fetch and cache JWKS from Supabase."""
    if _jwks_cache['keys'] is not None:
        return _jwks_cache['keys']

    supabase_url = current_app.config.get('SUPABASE_URL', '')
    jwks_url = f'{supabase_url}/auth/v1/.well-known/jwks.json'
    try:
        resp = requests.get(jwks_url, timeout=5)
        resp.raise_for_status()
        jwks_data = resp.json()
        _jwks_cache['keys'] = jwks_data['keys']
        return _jwks_cache['keys']
    except Exception as e:
        logger.error('Failed to fetch JWKS from %s: %s', jwks_url, e)
        return None


def _get_signing_key(token):
    """Get the correct public key from JWKS to verify the token."""
    keys = _get_jwks()
    if not keys:
        return None, None

    # Get the kid from the token header
    try:
        header = jwt.get_unverified_header(token)
    except jwt.DecodeError:
        return None, None

    kid = header.get('kid')
    alg = header.get('alg', 'ES256')

    for key_data in keys:
        if kid and key_data.get('kid') != kid:
            continue
        # Build a public key from JWK
        try:
            public_key = jwt.algorithms.ECAlgorithm.from_jwk(key_data)
            return public_key, alg
        except Exception:
            try:
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
                return public_key, alg
            except Exception:
                continue

    return None, None


def get_current_user():
    """Extract and verify JWT from Authorization header."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header[7:]

    # Try JWKS-based verification (new Supabase signing keys)
    public_key, alg = _get_signing_key(token)
    if public_key:
        try:
            payload = jwt.decode(
                token,
                public_key,
                algorithms=[alg],
                audience='authenticated',
            )
            user_id = payload.get('sub')
            if user_id:
                return user_id
        except jwt.InvalidTokenError as e:
            logger.warning('JWKS verification failed: %s', e)

    # Fallback: try legacy HS256 secret
    secret = current_app.config.get('SUPABASE_JWT_SECRET')
    if secret:
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=['HS256'],
                audience='authenticated',
            )
            user_id = payload.get('sub')
            if user_id:
                return user_id
        except jwt.InvalidTokenError:
            pass

    logger.warning('JWT verification failed with all methods')
    return None


def login_required(f):
    """Decorator that requires a valid JWT."""
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
