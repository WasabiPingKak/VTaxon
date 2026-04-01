"""Business logic for livestream subscription management — Twitch EventSub & YouTube WebSub."""

import logging
import os
from datetime import UTC, datetime
from typing import Any

import requests as _requests

from ..extensions import db
from ..models import LiveStream, OAuthAccount, User

logger = logging.getLogger(__name__)


def _invalidate_live_cache() -> None:
    from ..routes.livestream import invalidate_live_cache

    invalidate_live_cache()


# ---------------------------------------------------------------------------
# YouTube cron logic
# ---------------------------------------------------------------------------


def youtube_check_offline(api_key: str) -> dict[str, Any]:
    """Check YouTube streams that have ended. Returns result dict."""
    from .youtube_pubsub import check_streams_ended

    streams = LiveStream.query.filter_by(provider="youtube").all()
    if not streams:
        return {"checked": 0, "ended": 0}

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
    return {"checked": len(video_ids), "ended": len(ended_ids)}


def youtube_renew_subs() -> dict[str, Any] | None:
    """Batch renew YouTube WebSub subscriptions. Returns result dict."""
    from .youtube_pubsub import extract_channel_id

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
        return {"total": len(accounts), "skipped": skipped, "dispatched": 0}

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
        if result["dispatched"] > 0:
            return {
                "mode": "cloud_tasks",
                "total": len(accounts),
                "dispatched": result["dispatched"],
                "failed": result["failed"],
                "skipped": skipped,
            }
        logger.warning(
            "Cloud Tasks dispatch completely failed (dispatched=0, failed=%d), falling back to sync mode",
            result["failed"],
        )

    # Fallback: synchronous subscribe (also used when Cloud Tasks dispatch all fail)
    from .youtube_pubsub import subscribe_channel

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        return None  # signals 500 to caller

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
    return {"mode": "sync", "total": len(accounts), "renewed": renewed, "skipped": skipped, "errors": errors}


def youtube_subscribe_one(channel_id: str) -> tuple[dict[str, Any], int]:
    """Subscribe a single YouTube channel. Returns (result_dict, http_status)."""
    from .youtube_pubsub import subscribe_channel

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        return {"error": "WEBHOOK_BASE_URL not configured"}, 500

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
        return {"channel_id": channel_id, "status": "subscribed"}, 200

    logger.warning("YouTube subscribe-one FAILED: %s", channel_id)
    return {"channel_id": channel_id, "status": "failed"}, 500


# ---------------------------------------------------------------------------
# Twitch admin logic
# ---------------------------------------------------------------------------


def list_twitch_subs() -> tuple[dict[str, Any], int]:
    """List all Twitch EventSub subscriptions. Returns (result_dict, http_status)."""
    from .twitch import list_eventsub_subscriptions

    client_id = os.environ.get("TWITCH_CLIENT_ID", "")
    client_secret = os.environ.get("TWITCH_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        return {"error": "Twitch credentials not configured"}, 500

    try:
        subs = list_eventsub_subscriptions(client_id, client_secret)
        return {"subscriptions": subs, "total": len(subs)}, 200
    except _requests.RequestException:
        logger.exception("Failed to list Twitch EventSub subscriptions")
        return {"error": "Twitch API 暫時無法使用，請稍後再試"}, 502


def rebuild_twitch_subs(*, offset: int, limit: int, clean: bool) -> tuple[dict[str, Any], int]:
    """Batch rebuild Twitch EventSub subscriptions. Returns (result_dict, http_status)."""
    from .twitch import create_eventsub_subscription, delete_eventsub_subscription, list_eventsub_subscriptions

    client_id = os.environ.get("TWITCH_CLIENT_ID", "")
    client_secret = os.environ.get("TWITCH_CLIENT_SECRET", "")
    webhook_secret = os.environ.get("TWITCH_WEBHOOK_SECRET", "")
    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")

    if not all([client_id, client_secret, webhook_secret, webhook_base_url]):
        return {"error": "Missing Twitch/webhook configuration"}, 500

    callback_url = f"{webhook_base_url}/api/webhooks/twitch"

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
    return {
        "created": created,
        "errors": errors,
        "deleted": deleted,
        "batch": f"{offset}-{offset + len(twitch_accounts)}",
        "total_accounts": total_accounts,
        "has_more": next_offset < total_accounts,
        "next_offset": next_offset if next_offset < total_accounts else None,
        "error_details": error_details[:10],
    }, 200


# ---------------------------------------------------------------------------
# YouTube admin logic
# ---------------------------------------------------------------------------


def list_youtube_subs() -> dict[str, Any]:
    """List all YouTube WebSub subscription statuses."""
    from .youtube_pubsub import extract_channel_id

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
    return {"accounts": result, "total": len(result)}


def rebuild_youtube_subs(*, offset: int, limit: int, clean: bool) -> tuple[dict[str, Any], int]:
    """Batch rebuild YouTube WebSub subscriptions. Returns (result_dict, http_status)."""
    from .youtube_pubsub import extract_channel_id, subscribe_channel, unsubscribe_channel

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        return {"error": "WEBHOOK_BASE_URL not configured"}, 500

    callback_url = f"{webhook_base_url}/api/webhooks/youtube"
    hub_secret = os.environ.get("CRON_SECRET", "") or None

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
    return {
        "subscribed": subscribed,
        "skipped": skipped,
        "errors": errors,
        "unsubscribed": unsubscribed,
        "batch": f"{offset}-{offset + len(yt_accounts)}",
        "total_accounts": total_accounts,
        "has_more": next_offset < total_accounts,
        "next_offset": next_offset if next_offset < total_accounts else None,
    }, 200


def backfill_youtube_channels(api_key: str) -> dict[str, Any]:
    """Resolve missing/invalid channel_url for YouTube accounts.

    - @handle URLs → resolve to /channel/UCxxx via YouTube API
    - NULL URLs with access_token → fetch channel via OAuth token
    After resolution, subscribe to WebSub.
    """
    from .youtube_pubsub import (
        extract_channel_id,
        extract_handle,
        fetch_my_channel_id,
        resolve_handle_to_channel_id,
        subscribe_channel,
    )

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    callback_url = f"{webhook_base_url}/api/webhooks/youtube" if webhook_base_url else ""
    hub_secret = os.environ.get("CRON_SECRET", "") or None

    accounts = OAuthAccount.query.filter_by(provider="youtube").all()

    resolved_handle = 0
    resolved_token = 0
    subscribe_ok = 0
    subscribe_fail = 0
    still_missing = 0
    details: list[dict[str, str | None]] = []

    for account in accounts:
        if extract_channel_id(account.channel_url):
            continue  # already valid

        channel_id: str | None = None
        method = ""

        # Try 1: resolve @handle
        handle = extract_handle(account.channel_url)
        if handle:
            channel_id = resolve_handle_to_channel_id(handle, api_key)
            method = "handle"

        # Try 2: use OAuth access_token
        if not channel_id and account.access_token:
            channel_id = fetch_my_channel_id(account.access_token)
            method = "token"

        if not channel_id:
            still_missing += 1
            details.append({"name": account.provider_display_name, "url": account.channel_url, "status": "unresolved"})
            continue

        # Update channel_url
        account.channel_url = f"https://www.youtube.com/channel/{channel_id}"
        if method == "handle":
            resolved_handle += 1
        else:
            resolved_token += 1

        # Subscribe to WebSub
        if callback_url:
            ok = subscribe_channel(channel_id, callback_url, secret=hub_secret)
            account.live_sub_status = "subscribed" if ok else "failed"
            account.live_sub_at = datetime.now(UTC)
            if ok:
                subscribe_ok += 1
            else:
                subscribe_fail += 1

        details.append(
            {"name": account.provider_display_name, "url": account.channel_url, "status": f"resolved:{method}"}
        )

    db.session.commit()

    logger.info(
        "YouTube backfill: handle=%d, token=%d, subscribed=%d, failed=%d, missing=%d",
        resolved_handle,
        resolved_token,
        subscribe_ok,
        subscribe_fail,
        still_missing,
    )
    return {
        "resolved_handle": resolved_handle,
        "resolved_token": resolved_token,
        "subscribe_ok": subscribe_ok,
        "subscribe_fail": subscribe_fail,
        "still_missing": still_missing,
        "details": details,
    }


# ---------------------------------------------------------------------------
# Public helpers (called from oauth.py)
# ---------------------------------------------------------------------------


def subscribe_twitch_user(provider_account_id: str, oauth_account: OAuthAccount | None = None) -> None:
    """Subscribe to stream.online + stream.offline for a Twitch broadcaster."""
    from .twitch import create_eventsub_subscription

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


def unsubscribe_twitch_user(provider_account_id: str) -> None:
    """Remove all EventSub subscriptions for a Twitch broadcaster."""
    from .twitch import delete_eventsub_subscription, list_eventsub_subscriptions

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


def subscribe_youtube_user(channel_url: str, oauth_account: OAuthAccount | None = None) -> None:
    """Subscribe to YouTube WebSub for a channel."""
    from .youtube_pubsub import extract_channel_id, subscribe_channel

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


def unsubscribe_youtube_user(channel_url: str) -> None:
    """Unsubscribe from YouTube WebSub for a channel."""
    from .youtube_pubsub import extract_channel_id, unsubscribe_channel

    webhook_base_url = os.environ.get("WEBHOOK_BASE_URL", "")
    if not webhook_base_url:
        return

    channel_id = extract_channel_id(channel_url)
    if not channel_id:
        return

    callback_url = f"{webhook_base_url}/api/webhooks/youtube"
    hub_secret = os.environ.get("CRON_SECRET", "") or None
    unsubscribe_channel(channel_id, callback_url, secret=hub_secret)
