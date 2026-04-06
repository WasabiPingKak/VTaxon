"""Twitch EventSub subscription management — admin and per-user helpers."""

import logging
import os
from datetime import UTC, datetime
from typing import Any

import requests as _requests

from ...extensions import db
from ...models import OAuthAccount

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Twitch admin logic
# ---------------------------------------------------------------------------


def list_twitch_subs() -> tuple[dict[str, Any], int]:
    """List all Twitch EventSub subscriptions. Returns (result_dict, http_status)."""
    from ..twitch import list_eventsub_subscriptions

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
    from ..twitch import create_eventsub_subscription, delete_eventsub_subscription, list_eventsub_subscriptions

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
# Per-user helpers (called from oauth.py)
# ---------------------------------------------------------------------------


def subscribe_twitch_user(provider_account_id: str, oauth_account: OAuthAccount | None = None) -> None:
    """Subscribe to stream.online + stream.offline for a Twitch broadcaster."""
    from ..twitch import create_eventsub_subscription

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
    from ..twitch import delete_eventsub_subscription, list_eventsub_subscriptions

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
