import logging
import time
from collections.abc import Callable
from functools import wraps
from typing import Any

import jwt
import requests
from flask import Response, current_app, g, jsonify, request

from .models import AuthIdAlias, User

logger = logging.getLogger(__name__)

# Module-level cache for JWKS with TTL (1 hour)
_JWKS_TTL = 3600
_jwks_cache: dict[str, Any] = {"keys": None, "fetched_at": 0}


def _get_jwks(force_refresh: bool = False) -> list[dict[str, Any]] | None:
    """Fetch and cache JWKS from Supabase with 1-hour TTL."""
    now = time.monotonic()
    if not force_refresh and _jwks_cache["keys"] is not None and (now - _jwks_cache["fetched_at"]) < _JWKS_TTL:
        return _jwks_cache["keys"]

    supabase_url = current_app.config.get("SUPABASE_URL", "")
    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    try:
        resp = requests.get(jwks_url, timeout=5)
        resp.raise_for_status()
        jwks_data = resp.json()
        _jwks_cache["keys"] = jwks_data["keys"]
        _jwks_cache["fetched_at"] = now
        return _jwks_cache["keys"]
    except (requests.RequestException, ValueError, KeyError) as e:
        logger.error("Failed to fetch JWKS from %s: %s", jwks_url, e)
        # Return stale cache if available
        return _jwks_cache["keys"]


def _get_signing_key(token: str) -> Any:
    """Get the correct public key from JWKS to verify the token."""
    keys = _get_jwks()
    if not keys:
        return None

    # Get the kid from the token header
    try:
        header = jwt.get_unverified_header(token)
    except jwt.DecodeError:
        return None

    kid = header.get("kid")

    for key_data in keys:
        if kid and key_data.get("kid") != kid:
            continue
        # Build a public key from JWK
        try:
            public_key = jwt.algorithms.ECAlgorithm.from_jwk(key_data)
            return public_key
        except (jwt.PyJWTError, ValueError):
            continue

    return None


def get_current_user() -> str | None:
    """Extract and verify JWT from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header[7:]

    # Try JWKS-based verification (Supabase ES256 signing keys)
    # On failure, refresh JWKS once and retry (handles key rotation)
    public_key = _get_signing_key(token)
    if public_key:
        try:
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["ES256"],
                audience="authenticated",
            )
            user_id = payload.get("sub")
            if user_id:
                return user_id
        except jwt.InvalidTokenError as e:
            logger.warning("JWKS verification failed, retrying with refreshed keys: %s", e)
            _get_jwks(force_refresh=True)
            public_key = _get_signing_key(token)
            if public_key:
                try:
                    payload = jwt.decode(
                        token,
                        public_key,
                        algorithms=["ES256"],
                        audience="authenticated",
                    )
                    user_id = payload.get("sub")
                    if user_id:
                        return user_id
                except jwt.InvalidTokenError:
                    pass

    logger.warning("JWT verification failed")
    return None


def login_required(f: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator that requires a valid JWT."""

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> tuple[Response, int] | Any:
        from .extensions import db

        user_id = get_current_user()
        if not user_id:
            return jsonify({"error": "Authentication required"}), 401
        # Keep the raw JWT sub for alias creation in auth_callback
        g.raw_auth_id = user_id
        # Resolve alias: if this auth ID maps to a different VTaxon user
        alias = db.session.get(AuthIdAlias, user_id)
        if alias:
            user_id = alias.user_id
        g.current_user_id = str(user_id)
        return f(*args, **kwargs)

    return decorated


def admin_required(f: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator that requires the authenticated user to have admin role."""

    @wraps(f)
    @login_required
    def decorated(*args: Any, **kwargs: Any) -> tuple[Response, int] | Any:
        from .extensions import db

        user = db.session.get(User, g.current_user_id)
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        g.current_user = user
        return f(*args, **kwargs)

    return decorated
