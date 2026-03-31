"""OAuth account management routes (sync, refresh, update, delete, resubscribe)."""

import logging
import os
from datetime import UTC, datetime

import requests
from flask import Blueprint, Response, g, jsonify, request
from sqlalchemy.exc import IntegrityError

from ..auth import login_required
from ..cache import invalidate_tree_cache
from ..extensions import db
from ..limiter import limiter
from ..models import Blacklist, LiveStream, OAuthAccount, User

logger = logging.getLogger(__name__)

oauth_bp = Blueprint("oauth", __name__)


@oauth_bp.route("/me/oauth-accounts", methods=["GET"])
@login_required
def get_my_oauth_accounts() -> Response:
    """列出目前使用者的 OAuth 帳號。
    ---
    tags:
      - OAuth
    security:
      - BearerAuth: []
    responses:
      200:
        description: OAuth 帳號清單
        schema:
          type: array
          items:
            type: object
    """
    accounts = OAuthAccount.query.filter_by(user_id=g.current_user_id).all()
    return jsonify([a.to_dict() for a in accounts])


@oauth_bp.route("/me/oauth-accounts/sync", methods=["POST"])
@login_required
def sync_oauth_accounts() -> tuple[Response, int] | Response:
    """同步 OAuth 帳號（從 Supabase identities）。
    ---
    tags:
      - OAuth
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        schema:
          type: object
          properties:
            identities:
              type: array
              items:
                type: object
            channel_url:
              type: string
            provider_for_url:
              type: string
            provider_avatar_url:
              type: string
            avatar_for_provider:
              type: string
            channel_display_name:
              type: string
            provider_token:
              type: string
            token_provider:
              type: string
            create_missing:
              type: boolean
    responses:
      200:
        description: 同步後的帳號清單
      403:
        description: 帳號已被停用
    """
    data = request.get_json() or {}
    identities = data.get("identities", [])
    channel_url_input = data.get("channel_url")
    provider_for_url = data.get("provider_for_url")
    avatar_url_input = data.get("provider_avatar_url")
    avatar_for_provider = data.get("avatar_for_provider")
    channel_display_name = data.get("channel_display_name")
    provider_token = data.get("provider_token")
    token_provider = data.get("token_provider")  # 'youtube' or 'twitch'

    create_missing = data.get("create_missing", False)
    provider_map = {"google": "youtube", "twitch": "twitch"}
    synced = []

    for identity in identities:
        supabase_provider = identity.get("provider", "")
        db_provider = provider_map.get(supabase_provider)
        if not db_provider:
            continue

        provider_id = identity.get("id", "")
        identity_data = identity.get("identity_data", {})

        if db_provider == "twitch":
            display_name = identity_data.get("nickname") or identity_data.get("slug") or identity_data.get("name", "")
            twitch_login = identity_data.get("name") or identity_data.get("full_name", "")
        else:
            if channel_display_name:
                display_name = channel_display_name
            else:
                display_name = (
                    identity_data.get("full_name")
                    or identity_data.get("name")
                    or identity_data.get("preferred_username", "")
                )
            twitch_login = None

        google_avatar_fallback = None
        if db_provider == avatar_for_provider and avatar_url_input:
            avatar_url = avatar_url_input
        elif db_provider == "youtube":
            avatar_url = None
            google_avatar_fallback = identity_data.get("picture") or identity_data.get("avatar_url") or None
        else:
            avatar_url = identity_data.get("avatar_url") or identity_data.get("picture", "")

        channel_url = None
        if db_provider == "twitch" and twitch_login:
            channel_url = f"https://twitch.tv/{twitch_login}"
        elif db_provider == "youtube" and provider_for_url == "youtube":
            channel_url = channel_url_input

        account = OAuthAccount.query.filter_by(provider=db_provider, provider_account_id=provider_id).first()

        if account:
            if str(account.user_id) != str(g.current_user_id):
                continue
            if display_name and (db_provider != "youtube" or channel_display_name):
                account.provider_display_name = display_name
            if avatar_url:
                account.provider_avatar_url = avatar_url
            elif google_avatar_fallback and not account.provider_avatar_url:
                account.provider_avatar_url = google_avatar_fallback
            if channel_url:
                account.channel_url = channel_url
            if provider_token and token_provider == db_provider:
                account.access_token = provider_token
        elif create_missing:
            if token_provider and token_provider != db_provider:
                continue

            blocked = Blacklist.query.filter_by(identifier_type=db_provider, identifier_value=provider_id).first()
            if blocked:
                return jsonify({"error": "account_banned", "message": "此帳號已被停用，如有疑問請聯繫管理員"}), 403

            account = OAuthAccount(
                user_id=g.current_user_id,
                provider=db_provider,
                provider_account_id=provider_id,
                provider_display_name=display_name or None,
                provider_avatar_url=avatar_url or google_avatar_fallback or None,
                channel_url=channel_url,
                access_token=(provider_token if provider_token and token_provider == db_provider else None),
            )
            db.session.add(account)
        else:
            continue

        synced.append(account)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        synced = OAuthAccount.query.filter_by(user_id=g.current_user_id).all()

    # Subscribe new Twitch accounts to EventSub (non-blocking)
    for account in synced:
        if (
            account.provider == "twitch"
            and account.provider_account_id
            and account.created_at
            and (datetime.now(UTC) - account.created_at).total_seconds() < 30
        ):
            try:
                from ..services.subscriptions import subscribe_twitch_user

                subscribe_twitch_user(account.provider_account_id, oauth_account=account)
            except requests.RequestException:
                logger.exception("Failed to subscribe Twitch EventSub for %s", account.provider_account_id)

    # Subscribe new YouTube accounts to WebSub (non-blocking)
    for account in synced:
        if (
            account.provider == "youtube"
            and account.channel_url
            and account.created_at
            and (datetime.now(UTC) - account.created_at).total_seconds() < 30
        ):
            try:
                from ..services.subscriptions import subscribe_youtube_user

                subscribe_youtube_user(account.channel_url, oauth_account=account)
            except requests.RequestException:
                logger.exception("Failed to subscribe YouTube WebSub for %s", account.channel_url)

    # Sync avatar_url from primary platform account
    user = db.session.get(User, g.current_user_id)
    if user and user.primary_platform:
        primary_account = OAuthAccount.query.filter_by(
            user_id=g.current_user_id, provider=user.primary_platform
        ).first()
        if primary_account and primary_account.provider_avatar_url:
            if user.avatar_url != primary_account.provider_avatar_url:
                user.avatar_url = primary_account.provider_avatar_url
                db.session.commit()
                invalidate_tree_cache()

    return jsonify([a.to_dict() for a in synced])


@oauth_bp.route("/me/oauth-accounts/<account_id>/refresh", methods=["POST"])
@login_required
def refresh_oauth_account(account_id: str) -> tuple[Response, int] | Response:
    """從 YouTube/Twitch API 刷新 OAuth 帳號資料。
    ---
    tags:
      - OAuth
    security:
      - BearerAuth: []
    parameters:
      - name: account_id
        in: path
        type: string
        required: true
    responses:
      200:
        description: 更新後的帳號資料
      401:
        description: 授權已過期
      404:
        description: 帳號不存在
      502:
        description: 同步失敗
    """
    account = db.session.get(OAuthAccount, account_id)
    if not account or str(account.user_id) != str(g.current_user_id):
        return jsonify({"error": "Account not found"}), 404

    if not account.access_token:
        return jsonify({"error": "請重新登入以取得授權"}), 401

    try:
        if account.provider == "youtube":
            resp = requests.get(
                "https://www.googleapis.com/youtube/v3/channels",
                params={"part": "snippet", "mine": "true"},
                headers={"Authorization": f"Bearer {account.access_token}"},
                timeout=10,
            )
            if resp.status_code == 401:
                account.access_token = None
                db.session.commit()
                return jsonify({"error": "授權已過期，請重新登入"}), 401
            resp.raise_for_status()
            ch = resp.json().get("items", [None])[0]
            if ch:
                snippet = ch.get("snippet", {})
                account.provider_display_name = snippet.get("title") or account.provider_display_name
                avatar = snippet.get("thumbnails", {}).get("default", {}).get("url")
                if avatar:
                    account.provider_avatar_url = avatar
                account.channel_url = f"https://www.youtube.com/channel/{ch['id']}"

        elif account.provider == "twitch":
            twitch_client_id = os.environ.get("TWITCH_CLIENT_ID")
            if not twitch_client_id:
                return jsonify({"error": "Twitch 同步尚未設定，請聯繫管理員"}), 500
            resp = requests.get(
                "https://api.twitch.tv/helix/users",
                headers={
                    "Authorization": f"Bearer {account.access_token}",
                    "Client-Id": twitch_client_id,
                },
                timeout=10,
            )
            if resp.status_code == 401:
                account.access_token = None
                db.session.commit()
                return jsonify({"error": "授權已過期，請重新登入"}), 401
            resp.raise_for_status()
            users = resp.json().get("data", [])
            if users:
                u = users[0]
                account.provider_display_name = u.get("display_name") or account.provider_display_name
                if u.get("profile_image_url"):
                    account.provider_avatar_url = u["profile_image_url"]
                if u.get("login"):
                    account.channel_url = f"https://twitch.tv/{u['login']}"
        else:
            return jsonify({"error": "Unsupported provider"}), 400

        # Sync user avatar if this is the primary platform
        user = db.session.get(User, g.current_user_id)
        if user and user.primary_platform == account.provider:
            if account.provider_avatar_url:
                user.avatar_url = account.provider_avatar_url

        db.session.commit()
        invalidate_tree_cache()

        # Subscribe live detection if channel_url was set/updated
        if account.channel_url:
            try:
                if account.provider == "youtube":
                    from ..services.subscriptions import subscribe_youtube_user

                    subscribe_youtube_user(account.channel_url, oauth_account=account)
                elif account.provider == "twitch" and account.provider_account_id:
                    from ..services.subscriptions import subscribe_twitch_user

                    subscribe_twitch_user(account.provider_account_id, oauth_account=account)
            except requests.RequestException:
                logger.exception("Failed to subscribe %s after refresh", account.provider)

        return jsonify(account.to_dict())

    except requests.RequestException as e:
        logger.error("OAuth account sync failed: %s", e)
        return jsonify({"error": "同步失敗，請稍後再試"}), 502


@oauth_bp.route("/me/oauth-accounts/<account_id>", methods=["PATCH"])
@login_required
def update_oauth_account(account_id: str) -> tuple[Response, int] | Response:
    """更新 OAuth 帳號設定。
    ---
    tags:
      - OAuth
    security:
      - BearerAuth: []
    parameters:
      - name: account_id
        in: path
        type: string
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            show_on_profile:
              type: boolean
            channel_url:
              type: string
    responses:
      200:
        description: 更新後的帳號資料
      404:
        description: 帳號不存在
    """
    account = db.session.get(OAuthAccount, account_id)
    if not account or str(account.user_id) != str(g.current_user_id):
        return jsonify({"error": "Account not found"}), 404

    data = request.get_json() or {}
    if "show_on_profile" in data:
        account.show_on_profile = bool(data["show_on_profile"])
    old_channel_url = account.channel_url
    if "channel_url" in data:
        account.channel_url = data["channel_url"] or None

    db.session.commit()

    # Re-subscribe live detection only when channel_url actually changed
    if "channel_url" in data and account.channel_url and account.channel_url != old_channel_url:
        try:
            if account.provider == "youtube":
                from ..services.subscriptions import subscribe_youtube_user

                subscribe_youtube_user(account.channel_url, oauth_account=account)
            elif account.provider == "twitch" and account.provider_account_id:
                from ..services.subscriptions import subscribe_twitch_user

                subscribe_twitch_user(account.provider_account_id, oauth_account=account)
        except requests.RequestException:
            logger.exception("Failed to re-subscribe %s for %s", account.provider, account.channel_url)

    return jsonify(account.to_dict())


@oauth_bp.route("/me/oauth-accounts/<account_id>", methods=["DELETE"])
@login_required
def delete_oauth_account(account_id: str) -> tuple[Response, int] | Response:
    """刪除 OAuth 帳號綁定（至少保留一個）。
    ---
    tags:
      - OAuth
    security:
      - BearerAuth: []
    parameters:
      - name: account_id
        in: path
        type: string
        required: true
    responses:
      200:
        description: 刪除成功
      400:
        description: 無法解除最後一個帳號
      404:
        description: 帳號不存在
    """
    account = db.session.get(OAuthAccount, account_id)
    if not account or str(account.user_id) != str(g.current_user_id):
        return jsonify({"error": "Account not found"}), 404

    count = OAuthAccount.query.filter_by(user_id=g.current_user_id).count()
    if count <= 1:
        return jsonify({"error": "無法解除最後一個綁定帳號"}), 400

    deleted_provider = account.provider
    deleted_provider_id = account.provider_account_id

    # Clean up EventSub + live_streams for Twitch accounts
    if deleted_provider == "twitch" and deleted_provider_id:
        try:
            from ..services.subscriptions import unsubscribe_twitch_user

            unsubscribe_twitch_user(deleted_provider_id)
        except requests.RequestException:
            logger.exception("Failed to unsubscribe Twitch EventSub for %s", deleted_provider_id)

    # Clean up WebSub for YouTube accounts
    if deleted_provider == "youtube" and account.channel_url:
        try:
            from ..services.subscriptions import unsubscribe_youtube_user

            unsubscribe_youtube_user(account.channel_url)
        except requests.RequestException:
            logger.exception("Failed to unsubscribe YouTube WebSub for %s", account.channel_url)

    LiveStream.query.filter_by(user_id=g.current_user_id, provider=deleted_provider).delete()

    db.session.delete(account)

    # If deleting the primary platform account, switch to remaining account
    user = db.session.get(User, g.current_user_id)
    if user and user.primary_platform == deleted_provider:
        remaining = (
            OAuthAccount.query.filter_by(user_id=g.current_user_id).filter(OAuthAccount.id != account_id).first()
        )
        if remaining:
            user.primary_platform = remaining.provider
            if remaining.provider_avatar_url:
                user.avatar_url = remaining.provider_avatar_url
        else:
            user.primary_platform = None

    db.session.commit()
    return jsonify({"ok": True, "user": user.to_dict() if user else None})


@oauth_bp.route("/me/resubscribe", methods=["POST"])
@login_required
@limiter.limit("3/minute")
def resubscribe_live() -> tuple[Response, int] | Response:
    """重新訂閱直播通知（限速 3 次/分鐘）。
    ---
    tags:
      - OAuth
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - account_id
          properties:
            account_id:
              type: string
    responses:
      200:
        description: 重新訂閱成功
      400:
        description: 缺少 account_id 或頻道資訊
      404:
        description: 帳號不存在
    """
    data = request.get_json() or {}
    account_id = data.get("account_id")
    if not account_id:
        return jsonify({"error": "account_id is required"}), 400

    account = db.session.get(OAuthAccount, account_id)
    if not account or str(account.user_id) != str(g.current_user_id):
        return jsonify({"error": "Account not found"}), 404

    if account.provider == "youtube":
        if not account.channel_url:
            return jsonify({"error": "尚未取得 YouTube 頻道資訊，請先重新登入授權"}), 400
        from ..services.subscriptions import subscribe_youtube_user

        subscribe_youtube_user(account.channel_url, oauth_account=account)
    elif account.provider == "twitch":
        from ..services.subscriptions import subscribe_twitch_user

        subscribe_twitch_user(account.provider_account_id, oauth_account=account)
    else:
        return jsonify({"error": "Unsupported provider"}), 400

    return jsonify(account.to_dict())
