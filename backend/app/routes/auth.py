import base64
import hashlib
import hmac
import json
import os
import time
import uuid

from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from ..auth import login_required
from ..cache import invalidate_tree_cache
from ..extensions import db
from ..limiter import limiter
from ..models import AuthIdAlias, Blacklist, User

auth_bp = Blueprint("auth", __name__)
limiter.limit("10/minute")(auth_bp)

_LINK_TOKEN_TTL = 600  # 10 minutes


def _get_link_secret():
    return os.environ.get("SUPABASE_JWT_SECRET", "").encode()


def _sign_link_token(user_id):
    payload = json.dumps(
        {
            "user_id": str(user_id),
            "exp": int(time.time()) + _LINK_TOKEN_TTL,
            "nonce": uuid.uuid4().hex,
        },
        separators=(",", ":"),
    )
    payload_b64 = base64.urlsafe_b64encode(payload.encode()).decode()
    sig = hmac.new(_get_link_secret(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"


def _verify_link_token(token):
    """Verify a link token and return the user_id, or None if invalid."""
    try:
        payload_b64, sig = token.rsplit(".", 1)
    except (ValueError, AttributeError):
        return None
    expected_sig = hmac.new(_get_link_secret(), payload_b64.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected_sig):
        return None
    try:
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
    except (ValueError, KeyError):
        return None
    if payload.get("exp", 0) < time.time():
        return None
    return payload.get("user_id")


@auth_bp.route("/link-token", methods=["POST"])
@login_required
def create_link_token():
    """Issue a signed link token for the current user.

    Used before OAuth redirect so the callback can securely bind a new
    auth identity to this user without exposing the raw user_id.
    """
    from flask import g

    user_id = g.current_user_id
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "user_not_found"}), 404
    token = _sign_link_token(user_id)
    return jsonify({"link_token": token}), 200


@auth_bp.route("/callback", methods=["POST"])
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

    # Secure cross-email OAuth linking via signed token
    link_token = data.get("link_token")
    link_to_user_id = None
    if link_token:
        link_to_user_id = _verify_link_token(link_token)
        if link_to_user_id is None:
            return jsonify({"error": "invalid_or_expired_link_token"}), 400

    user = db.session.get(User, user_id)

    if user is None and link_to_user_id:
        # Cross-email OAuth linking: Supabase created a new auth user,
        # but the signed token proves ownership of the target VTaxon user.
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
        # Check blacklist before creating a new user — prevents banned users
        # from re-registering with the same Supabase account.
        blocked = Blacklist.query.filter_by(
            identifier_type="supabase_uid",
            identifier_value=str(user_id),
        ).first()
        if not blocked and raw_auth_id != user_id:
            blocked = Blacklist.query.filter_by(
                identifier_type="supabase_uid",
                identifier_value=str(raw_auth_id),
            ).first()
        if blocked:
            return jsonify(
                {
                    "error": "account_banned",
                    "message": "此帳號已被停用，如有疑問請聯繫管理員",
                }
            ), 403

        # Derive primary_platform from login provider
        login_provider = data.get("login_provider", "")
        platform_map = {"google": "youtube", "twitch": "twitch"}
        primary_platform = platform_map.get(login_provider)

        # Race condition guard: onAuthStateChange can fire multiple times
        # concurrently, all seeing user=None and attempting INSERT.
        try:
            user = User(
                id=user_id,
                display_name=data.get("display_name", "Unnamed Vtuber"),
                avatar_url=data.get("avatar_url"),
                primary_platform=primary_platform,
            )
            db.session.add(user)
            db.session.commit()
            invalidate_tree_cache()
        except IntegrityError:
            db.session.rollback()
            user = db.session.get(User, user_id)
    else:
        # Existing user: update avatar_url if frontend provides a fresh
        # YouTube channel avatar (indicated by yt_avatar flag).
        # This ensures YT avatar replaces stale Google avatar on re-login.
        # Also backfill when avatar_url is currently null (e.g. YouTube API
        # failed on first registration and Google meta had no picture).
        if data.get("yt_avatar") and data.get("avatar_url"):
            user.avatar_url = data["avatar_url"]
            db.session.commit()
            invalidate_tree_cache()
        elif not user.avatar_url and data.get("avatar_url"):
            user.avatar_url = data["avatar_url"]
            db.session.commit()
            invalidate_tree_cache()
        else:
            db.session.commit()

    return jsonify(user.to_dict()), 200
