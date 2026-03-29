"""Livestream subscription management — cron jobs, admin endpoints, and helpers."""

import logging
import os
from datetime import UTC, datetime

import requests as _requests
from flask import Blueprint, jsonify, request

from ..auth import admin_required
from ..extensions import db
from ..limiter import limiter
from ..models import LiveStream, OAuthAccount, User

logger = logging.getLogger(__name__)

subscriptions_bp = Blueprint("subscriptions", __name__)


def _invalidate_live_cache():
    from .livestream import invalidate_live_cache

    invalidate_live_cache()


def _verify_cron_secret():
    """Verify X-Cron-Secret header matches CRON_SECRET env var."""
    secret = os.environ.get("CRON_SECRET", "")
    if not secret:
        return False
    return request.headers.get("X-Cron-Secret", "") == secret


# ── YouTube cron endpoints ──


@subscriptions_bp.route("/livestream/youtube-check-offline", methods=["POST"])
@limiter.exempt
def youtube_check_offline():
    """Cron: 檢查 YouTube 直播是否已結束。
    ---
    tags:
      - Subscriptions
    parameters:
      - name: X-Cron-Secret
        in: header
        type: string
        required: true
    responses:
      200:
        description: 檢查結果
      403:
        description: 未授權
    """
    if not _verify_cron_secret():
        return jsonify({"error": "Unauthorized"}), 403

    from ..services.youtube_pubsub import check_streams_ended

    api_key = os.environ.get("YOUTUBE_API_KEY", "")
    if not api_key:
        return jsonify({"error": "YOUTUBE_API_KEY not configured"}), 500

    streams = LiveStream.query.filter_by(provider="youtube").all()
    if not streams:
        return jsonify({"checked": 0, "ended": 0})

    video_ids = [s.stream_id for s in streams if s.stream_id]
    ended_ids = check_streams_ended(video_ids, api_key)

    if ended_ids:
        ended_user_ids = [s.user_id for s in streams if s.stream_id in ended_ids]
        if ended_user_ids:
            User.query.filter(User.id.in_(ended_user_ids)).update(
                {"last_live_at": datetime.now(UTC)}, synchronize_session="fetch"
            )

        LiveStream.query.filter(
            LiveStream.provider == "youtube",
            LiveStream.stream_id.in_(ended_ids),
        ).delete(synchronize_session="fetch")
        db.session.commit()
        _invalidate_live_cache()

    logger.info("YouTube check-offline: checked=%d, ended=%d", len(video_ids), len(ended_ids))
    return jsonify({"checked": len(video_ids), "ended": len(ended_ids)})


@subscriptions_bp.route("/livestream/youtube-renew-subs", methods=["POST"])
@limiter.exempt
def youtube_renew_subs():
    """Cron: 批量續訂 YouTube WebSub 訂閱。
    ---
    tags:
      - Subscriptions
    parameters:
      - name: X-Cron-Secret
        in: header
        type: string
        required: true
    responses:
      200:
        description: 續訂結果
      403:
        description: 未授權
    """
    if not _verify_cron_secret():
        return jsonify({"error": "Unauthorized"}), 403

    from ..services.youtube_pubsub import extract_channel_id

    accounts = OAuthAccount.query.filter_by(provider="youtube").all()

    params_list = []
    skipped = 0
    for account in accounts:
        channel_id = extract_channel_id(account.channel_url)
        if not channel_id:
            skipped += 1
            continue
        params_list.append({"channel_id": channel_id})

    if not params_list:
        return jsonify({"total": len(accounts), "skipped": skipped, "dispatched": 0})

    # Try Cloud Tasks dispatch
    cloud_run_url = os.environ.get("CLOUD_RUN_SERVICE_URL", "")
    if cloud_run_url:
        from ..utils.cloud_tasks_client import dispatch_tasks_batch

        result = dispatch_tasks_batch("/api/livestream/youtube-subscribe-one", params_list=params_list)
        logger.info(
            "YouTube renew-subs via Cloud Tasks: total=%d, dispatched=%d, failed=%d, skipped=%d",
            len(accounts),
            result["dispatched"],
            result["failed"],
            skipped,
        )
        return jsonify(
            {
                "mode": "cloud_tasks",
                "total": len(accounts),
                "dispatched": result["dispatched"],
                "failed": result["failed"],
                "skipped": skipped,
            }
        )

    # Fallback: synchronous subscribe
    from ..services.youtube_pubsub import subscribe_channel

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        return jsonify({"error": "WEBHOOK_BASE_URL not configured"}), 500

    callback_url = f"{webhook_base_url}/api/webhooks/youtube"
    hub_secret = os.environ.get("CRON_SECRET", "") or None
    renewed = 0
    errors = 0
    for p in params_list:
        ok = subscribe_channel(p["channel_id"], callback_url, secret=hub_secret)
        account = OAuthAccount.query.filter(
            OAuthAccount.provider == "youtube",
            OAuthAccount.channel_url.ilike(f"%/channel/{p['channel_id']}%"),
        ).first()
        if account:
            account.live_sub_status = "subscribed" if ok else "failed"
            account.live_sub_at = datetime.now(UTC)
        if ok:
            renewed += 1
        else:
            errors += 1
    db.session.commit()

    logger.info(
        "YouTube renew-subs (sync fallback): total=%d, renewed=%d, skipped=%d, errors=%d",
        len(accounts),
        renewed,
        skipped,
        errors,
    )
    return jsonify({"mode": "sync", "total": len(accounts), "renewed": renewed, "skipped": skipped, "errors": errors})


@subscriptions_bp.route("/livestream/youtube-subscribe-one", methods=["POST"])
@limiter.exempt
def youtube_subscribe_one():
    """Cloud Task: 訂閱單一 YouTube 頻道。
    ---
    tags:
      - Subscriptions
    parameters:
      - name: X-Cron-Secret
        in: header
        type: string
        required: true
      - name: channel_id
        in: query
        type: string
        required: true
    responses:
      200:
        description: 訂閱成功
      400:
        description: 缺少 channel_id
      403:
        description: 未授權
      500:
        description: 訂閱失敗
    """
    if not _verify_cron_secret():
        secret = os.environ.get("CRON_SECRET", "")
        provided = request.headers.get("X-Cron-Secret", "")
        if secret and provided and provided != secret:
            return jsonify({"error": "Unauthorized"}), 403

    from ..services.youtube_pubsub import subscribe_channel

    channel_id = request.args.get("channel_id", "")
    if not channel_id:
        return jsonify({"error": "channel_id required"}), 400

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        return jsonify({"error": "WEBHOOK_BASE_URL not configured"}), 500

    callback_url = f"{webhook_base_url}/api/webhooks/youtube"
    hub_secret = os.environ.get("CRON_SECRET", "") or None
    ok = subscribe_channel(channel_id, callback_url, secret=hub_secret)

    account = OAuthAccount.query.filter(
        OAuthAccount.provider == "youtube",
        OAuthAccount.channel_url.ilike(f"%/channel/{channel_id}%"),
    ).first()
    if account:
        account.live_sub_status = "subscribed" if ok else "failed"
        account.live_sub_at = datetime.now(UTC)
        db.session.commit()

    if ok:
        logger.info("YouTube subscribe-one OK: %s", channel_id)
        return jsonify({"channel_id": channel_id, "status": "subscribed"})

    logger.warning("YouTube subscribe-one FAILED: %s", channel_id)
    return jsonify({"channel_id": channel_id, "status": "failed"}), 500


# ── Admin: Twitch subscription management ──


@subscriptions_bp.route("/livestream/twitch-subs", methods=["GET"])
@admin_required
def list_twitch_subs():
    """列出所有 Twitch EventSub 訂閱。管理員。
    ---
    tags:
      - Subscriptions
    security:
      - BearerAuth: []
    responses:
      200:
        description: 訂閱清單
      502:
        description: Twitch API 無法使用
    """
    from ..services.twitch import list_eventsub_subscriptions

    client_id = os.environ.get("TWITCH_CLIENT_ID", "")
    client_secret = os.environ.get("TWITCH_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        return jsonify({"error": "Twitch credentials not configured"}), 500

    try:
        subs = list_eventsub_subscriptions(client_id, client_secret)
        return jsonify({"subscriptions": subs, "total": len(subs)})
    except _requests.RequestException:
        logger.exception("Failed to list Twitch EventSub subscriptions")
        return jsonify({"error": "Twitch API 暫時無法使用，請稍後再試"}), 502


@subscriptions_bp.route("/livestream/rebuild-twitch-subs", methods=["POST"])
@admin_required
def rebuild_twitch_subs():
    """批量重建 Twitch EventSub 訂閱。管理員。
    ---
    tags:
      - Subscriptions
    security:
      - BearerAuth: []
    parameters:
      - name: offset
        in: query
        type: integer
        default: 0
      - name: limit
        in: query
        type: integer
        default: 20
      - name: clean
        in: query
        type: string
        description: 設為 1 先刪除現有訂閱
    responses:
      200:
        description: 重建結果
      500:
        description: 設定缺失
    """
    from ..services.twitch import (
        create_eventsub_subscription,
        delete_eventsub_subscription,
        list_eventsub_subscriptions,
    )

    client_id = os.environ.get("TWITCH_CLIENT_ID", "")
    client_secret = os.environ.get("TWITCH_CLIENT_SECRET", "")
    webhook_secret = os.environ.get("TWITCH_WEBHOOK_SECRET", "")
    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")

    if not all([client_id, client_secret, webhook_secret, webhook_base_url]):
        return jsonify({"error": "Missing Twitch/webhook configuration"}), 500

    callback_url = f"{webhook_base_url}/api/webhooks/twitch"
    offset = request.args.get("offset", 0, type=int)
    limit = request.args.get("limit", 20, type=int)
    clean = request.args.get("clean", "", type=str) == "1"

    deleted = 0
    if clean:
        try:
            existing = list_eventsub_subscriptions(client_id, client_secret)
            for sub in existing:
                try:
                    delete_eventsub_subscription(client_id, client_secret, sub["id"])
                    deleted += 1
                except _requests.RequestException:
                    logger.exception("Failed to delete subscription %s", sub["id"])
        except _requests.RequestException:
            logger.exception("Failed to list existing subscriptions")

    total_accounts = OAuthAccount.query.filter_by(provider="twitch").count()
    twitch_accounts = (
        OAuthAccount.query.filter_by(provider="twitch")
        .order_by(OAuthAccount.created_at)
        .offset(offset)
        .limit(limit)
        .all()
    )

    created = 0
    errors = 0
    error_details = []
    for account in twitch_accounts:
        broadcaster_id = account.provider_account_id
        account_success = 0
        for event_type in ("stream.online", "stream.offline"):
            try:
                create_eventsub_subscription(
                    client_id, client_secret, broadcaster_id, event_type, callback_url, webhook_secret
                )
                created += 1
                account_success += 1
            except _requests.RequestException:
                logger.exception("Failed to create %s sub for %s", event_type, broadcaster_id)
                errors += 1
                error_details.append(f"{broadcaster_id}:{event_type}:request_failed")
        account.live_sub_status = "subscribed" if account_success == 2 else "failed"
        account.live_sub_at = datetime.now(UTC)

    db.session.commit()

    next_offset = offset + limit
    return jsonify(
        {
            "created": created,
            "errors": errors,
            "deleted": deleted,
            "batch": f"{offset}-{offset + len(twitch_accounts)}",
            "total_accounts": total_accounts,
            "has_more": next_offset < total_accounts,
            "next_offset": next_offset if next_offset < total_accounts else None,
            "error_details": error_details[:10],
        }
    )


# ── Admin: YouTube subscription management ──


@subscriptions_bp.route("/livestream/youtube-subs", methods=["GET"])
@admin_required
def list_youtube_subs():
    """列出所有 YouTube WebSub 訂閱狀態。管理員。
    ---
    tags:
      - Subscriptions
    security:
      - BearerAuth: []
    responses:
      200:
        description: YouTube 帳號與訂閱狀態
    """
    from ..services.youtube_pubsub import extract_channel_id

    accounts = OAuthAccount.query.filter_by(provider="youtube").all()
    result = []
    for a in accounts:
        channel_id = extract_channel_id(a.channel_url)
        result.append(
            {
                "user_id": str(a.user_id),
                "provider_account_id": a.provider_account_id,
                "provider_display_name": a.provider_display_name,
                "channel_url": a.channel_url,
                "channel_id": channel_id,
                "has_channel_id": channel_id is not None,
            }
        )
    return jsonify({"accounts": result, "total": len(result)})


@subscriptions_bp.route("/livestream/rebuild-youtube-subs", methods=["POST"])
@admin_required
def rebuild_youtube_subs():
    """批量重建 YouTube WebSub 訂閱。管理員。
    ---
    tags:
      - Subscriptions
    security:
      - BearerAuth: []
    parameters:
      - name: offset
        in: query
        type: integer
        default: 0
      - name: limit
        in: query
        type: integer
        default: 20
      - name: clean
        in: query
        type: string
        description: 設為 1 先取消現有訂閱
    responses:
      200:
        description: 重建結果
      500:
        description: WEBHOOK_BASE_URL 未設定
    """
    from ..services.youtube_pubsub import extract_channel_id, subscribe_channel, unsubscribe_channel

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        return jsonify({"error": "WEBHOOK_BASE_URL not configured"}), 500

    callback_url = f"{webhook_base_url}/api/webhooks/youtube"
    hub_secret = os.environ.get("CRON_SECRET", "") or None
    offset = request.args.get("offset", 0, type=int)
    limit = request.args.get("limit", 20, type=int)
    clean = request.args.get("clean", "", type=str) == "1"

    total_accounts = OAuthAccount.query.filter_by(provider="youtube").count()
    yt_accounts = (
        OAuthAccount.query.filter_by(provider="youtube")
        .order_by(OAuthAccount.created_at)
        .offset(offset)
        .limit(limit)
        .all()
    )

    unsubscribed = 0
    if clean:
        for account in yt_accounts:
            channel_id = extract_channel_id(account.channel_url)
            if channel_id:
                unsubscribe_channel(channel_id, callback_url, secret=hub_secret)
                unsubscribed += 1

    subscribed = 0
    skipped = 0
    errors = 0
    for account in yt_accounts:
        channel_id = extract_channel_id(account.channel_url)
        if not channel_id:
            skipped += 1
            continue
        ok = subscribe_channel(channel_id, callback_url, secret=hub_secret)
        if ok:
            subscribed += 1
            account.live_sub_status = "subscribed"
        else:
            errors += 1
            account.live_sub_status = "failed"
        account.live_sub_at = datetime.now(UTC)

    db.session.commit()

    next_offset = offset + limit
    return jsonify(
        {
            "subscribed": subscribed,
            "skipped": skipped,
            "errors": errors,
            "unsubscribed": unsubscribed,
            "batch": f"{offset}-{offset + len(yt_accounts)}",
            "total_accounts": total_accounts,
            "has_more": next_offset < total_accounts,
            "next_offset": next_offset if next_offset < total_accounts else None,
        }
    )


# ── Public helpers (called from oauth.py) ──


def subscribe_twitch_user(provider_account_id, oauth_account=None):
    """Subscribe to stream.online + stream.offline for a Twitch broadcaster."""
    from ..services.twitch import create_eventsub_subscription

    client_id = os.environ.get("TWITCH_CLIENT_ID", "")
    client_secret = os.environ.get("TWITCH_CLIENT_SECRET", "")
    webhook_secret = os.environ.get("TWITCH_WEBHOOK_SECRET", "")
    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")

    if not all([client_id, client_secret, webhook_secret, webhook_base_url]):
        logger.warning("Twitch EventSub not configured, skipping subscription for %s", provider_account_id)
        if oauth_account:
            oauth_account.live_sub_status = "failed"
            oauth_account.live_sub_at = datetime.now(UTC)
            db.session.commit()
        return

    callback_url = f"{webhook_base_url}/api/webhooks/twitch"
    success_count = 0

    for event_type in ("stream.online", "stream.offline"):
        try:
            create_eventsub_subscription(
                client_id, client_secret, provider_account_id, event_type, callback_url, webhook_secret
            )
            logger.info("Created Twitch EventSub %s for %s", event_type, provider_account_id)
            success_count += 1
        except _requests.RequestException:
            logger.exception("Failed to create Twitch EventSub %s for %s", event_type, provider_account_id)

    if oauth_account:
        oauth_account.live_sub_status = "subscribed" if success_count == 2 else "failed"
        oauth_account.live_sub_at = datetime.now(UTC)
        db.session.commit()


def unsubscribe_twitch_user(provider_account_id):
    """Remove all EventSub subscriptions for a Twitch broadcaster."""
    from ..services.twitch import delete_eventsub_subscription, list_eventsub_subscriptions

    client_id = os.environ.get("TWITCH_CLIENT_ID", "")
    client_secret = os.environ.get("TWITCH_CLIENT_SECRET", "")

    if not client_id or not client_secret:
        return

    try:
        subs = list_eventsub_subscriptions(client_id, client_secret)
        for sub in subs:
            condition = sub.get("condition", {})
            if condition.get("broadcaster_user_id") == provider_account_id:
                try:
                    delete_eventsub_subscription(client_id, client_secret, sub["id"])
                    logger.info("Deleted Twitch EventSub %s for %s", sub["id"], provider_account_id)
                except _requests.RequestException:
                    logger.exception("Failed to delete sub %s", sub["id"])
    except _requests.RequestException:
        logger.exception("Failed to clean up Twitch EventSub for %s", provider_account_id)


def subscribe_youtube_user(channel_url, oauth_account=None):
    """Subscribe to YouTube WebSub for a channel."""
    from ..services.youtube_pubsub import extract_channel_id, subscribe_channel

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        logger.warning("WEBHOOK_BASE_URL not configured, skipping YouTube WebSub for %s", channel_url)
        if oauth_account:
            oauth_account.live_sub_status = "failed"
            oauth_account.live_sub_at = datetime.now(UTC)
            db.session.commit()
        return

    channel_id = extract_channel_id(channel_url)
    if not channel_id:
        logger.warning("Could not extract channel ID from %s", channel_url)
        if oauth_account:
            oauth_account.live_sub_status = "failed"
            oauth_account.live_sub_at = datetime.now(UTC)
            db.session.commit()
        return

    callback_url = f"{webhook_base_url}/api/webhooks/youtube"
    hub_secret = os.environ.get("CRON_SECRET", "") or None
    ok = subscribe_channel(channel_id, callback_url, secret=hub_secret)

    if oauth_account:
        oauth_account.live_sub_status = "subscribed" if ok else "failed"
        oauth_account.live_sub_at = datetime.now(UTC)
        db.session.commit()


def unsubscribe_youtube_user(channel_url):
    """Unsubscribe from YouTube WebSub for a channel."""
    from ..services.youtube_pubsub import extract_channel_id, unsubscribe_channel

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        return

    channel_id = extract_channel_id(channel_url)
    if not channel_id:
        return

    callback_url = f"{webhook_base_url}/api/webhooks/youtube"
    hub_secret = os.environ.get("CRON_SECRET", "") or None
    unsubscribe_channel(channel_id, callback_url, secret=hub_secret)
