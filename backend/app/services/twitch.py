"""Twitch EventSub integration — App Access Token + subscription management."""

import hashlib
import hmac
import logging
import time
from typing import Any

import requests

from .circuit_breaker import CircuitOpenError, twitch_cb

logger = logging.getLogger(__name__)

# Module-level App Access Token cache (Client Credentials flow)
_token_cache: dict[str, Any] = {"access_token": None, "expires_at": 0}


def get_app_access_token(client_id: str, client_secret: str) -> str:
    """Get a Twitch App Access Token via Client Credentials, cached until expiry."""
    now = time.time()
    if _token_cache["access_token"] and now < float(_token_cache["expires_at"]) - 60:
        return str(_token_cache["access_token"])

    twitch_cb.guard()
    try:
        resp = requests.post(
            "https://id.twitch.tv/oauth2/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "grant_type": "client_credentials",
            },
            timeout=10,
        )
        resp.raise_for_status()
        twitch_cb.record_success()
    except requests.RequestException as exc:
        twitch_cb.record_failure(exc)
        raise
    data = resp.json()

    _token_cache["access_token"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 3600)
    logger.info("Twitch App Access Token refreshed, expires in %ds", data.get("expires_in", 0))
    return str(_token_cache["access_token"])


def create_eventsub_subscription(
    client_id: str,
    client_secret: str,
    broadcaster_user_id: str,
    event_type: str,
    callback_url: str,
    webhook_secret: str,
) -> dict[str, Any]:
    """Create a Twitch EventSub subscription for stream.online / stream.offline."""
    twitch_cb.guard()
    token = get_app_access_token(client_id, client_secret)
    try:
        resp = requests.post(
            "https://api.twitch.tv/helix/eventsub/subscriptions",
            json={
                "type": event_type,
                "version": "1",
                "condition": {"broadcaster_user_id": broadcaster_user_id},
                "transport": {
                    "method": "webhook",
                    "callback": callback_url,
                    "secret": webhook_secret,
                },
            },
            headers={
                "Authorization": f"Bearer {token}",
                "Client-Id": client_id,
                "Content-Type": "application/json",
            },
            timeout=10,
        )
        # 409 = subscription already exists — treat as success
        if resp.status_code == 409:
            twitch_cb.record_success()
            logger.info("Twitch EventSub %s already exists for %s, skipping", event_type, broadcaster_user_id)
            return {"status": "already_exists"}
        resp.raise_for_status()
        twitch_cb.record_success()
        result: dict[str, Any] = resp.json()
        return result
    except requests.RequestException as exc:
        twitch_cb.record_failure(exc)
        raise


def delete_eventsub_subscription(client_id: str, client_secret: str, subscription_id: str) -> None:
    """Delete a Twitch EventSub subscription."""
    twitch_cb.guard()
    token = get_app_access_token(client_id, client_secret)
    try:
        resp = requests.delete(
            f"https://api.twitch.tv/helix/eventsub/subscriptions?id={subscription_id}",
            headers={
                "Authorization": f"Bearer {token}",
                "Client-Id": client_id,
            },
            timeout=10,
        )
        resp.raise_for_status()
        twitch_cb.record_success()
    except requests.RequestException as exc:
        twitch_cb.record_failure(exc)
        raise


def list_eventsub_subscriptions(client_id: str, client_secret: str) -> list[dict[str, Any]]:
    """List all EventSub subscriptions for this app."""
    twitch_cb.guard()
    token = get_app_access_token(client_id, client_secret)
    subs: list[dict[str, Any]] = []
    cursor: str | None = None
    while True:
        params: dict[str, str] = {}
        if cursor:
            params["after"] = cursor
        try:
            resp = requests.get(
                "https://api.twitch.tv/helix/eventsub/subscriptions",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Client-Id": client_id,
                },
                params=params,
                timeout=10,
            )
            resp.raise_for_status()
            twitch_cb.record_success()
        except requests.RequestException as exc:
            twitch_cb.record_failure(exc)
            raise
        data = resp.json()
        subs.extend(data.get("data", []))
        cursor = data.get("pagination", {}).get("cursor")
        if not cursor:
            break
    return subs


def get_stream_title(client_id: str, client_secret: str, broadcaster_id: str) -> str | None:
    """Fetch current stream title via Helix GET /streams.

    Returns title string or None. Rate limit: 800 req/min — only called on
    stream.online events so well within budget.
    """
    try:
        twitch_cb.guard()
        token = get_app_access_token(client_id, client_secret)
        resp = requests.get(
            "https://api.twitch.tv/helix/streams",
            params={"user_id": broadcaster_id},
            headers={
                "Authorization": f"Bearer {token}",
                "Client-Id": client_id,
            },
            timeout=10,
        )
        resp.raise_for_status()
        twitch_cb.record_success()
        data = resp.json().get("data", [])
        if data:
            title: str | None = data[0].get("title")
            return title
    except CircuitOpenError:
        pass
    except requests.RequestException as e:
        twitch_cb.record_failure(e)
        logger.warning("Failed to fetch Twitch stream title for %s: %s", broadcaster_id, e)
    return None


def verify_webhook_signature(headers: Any, body: str, secret: str) -> bool:
    """Verify Twitch EventSub webhook HMAC-SHA256 signature.

    Returns True if valid, False otherwise.
    """
    msg_id = headers.get("Twitch-Eventsub-Message-Id", "")
    msg_timestamp = headers.get("Twitch-Eventsub-Message-Timestamp", "")
    msg_signature = headers.get("Twitch-Eventsub-Message-Signature", "")

    if not msg_id or not msg_timestamp or not msg_signature:
        return False

    hmac_message = msg_id + msg_timestamp + body
    expected = (
        "sha256="
        + hmac.new(
            secret.encode("utf-8"),
            hmac_message.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
    )

    return hmac.compare_digest(expected, msg_signature)
