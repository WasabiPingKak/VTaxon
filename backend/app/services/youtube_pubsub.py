"""YouTube PubSubHubbub (WebSub) integration.

Handles subscribe/unsubscribe to YouTube channel feeds via the Google
PubSubHubbub hub, parses Atom feed notifications, and checks live status
via the YouTube Data API v3.
"""

import hashlib
import hmac
import logging
import os
import re
import xml.etree.ElementTree as ET
from typing import Any
from urllib.parse import unquote

import requests

logger = logging.getLogger(__name__)

HUB_URL = "https://pubsubhubbub.appspot.com/subscribe"
TOPIC_TEMPLATE = "https://www.youtube.com/xml/feeds/videos.xml?channel_id={}"
YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

# Atom + YouTube XML namespaces
NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "yt": "http://www.youtube.com/xml/schemas/2015",
}


def verify_hub_signature(secret: str, signature_header: str | None, body: str) -> bool:
    """Verify the X-Hub-Signature HMAC-SHA1 from PubSubHubbub.

    *signature_header* is e.g. ``sha1=abcdef1234...``.
    Returns True if the signature is valid.
    """
    if not signature_header:
        return False
    parts = signature_header.split("=", 1)
    if len(parts) != 2 or parts[0] != "sha1":
        return False
    expected = hmac.new(
        secret.encode(),
        body.encode(),
        hashlib.sha1,
    ).hexdigest()
    return hmac.compare_digest(expected, parts[1])


def extract_channel_id(channel_url: str | None) -> str | None:
    """Extract YouTube channel ID (UCxxx) from a channel URL.

    Supports:
      - https://www.youtube.com/channel/UCxxx
      - https://youtube.com/channel/UCxxx
    Returns None if the URL doesn't contain a channel ID.
    """
    if not channel_url:
        return None
    match = re.search(r"youtube\.com/channel/(UC[\w-]+)", channel_url)
    return match.group(1) if match else None


def extract_handle(channel_url: str | None) -> str | None:
    """Extract YouTube handle from a channel URL.

    Supports ``https://www.youtube.com/@handle``, with optional trailing
    path/query.  Handles both raw Unicode (``@天璇``) and percent-encoded
    (``@%E5%A4%A9%E7%92%87``) forms.

    Returns the handle **without** the ``@`` prefix, or None.
    """
    if not channel_url:
        return None
    # URL-decode first so percent-encoded Unicode becomes raw characters
    decoded = unquote(channel_url)
    # Match @ followed by any non-slash, non-query, non-fragment characters
    match = re.search(r"youtube\.com/@([^/?#]+)", decoded)
    if not match:
        return None
    return match.group(1).rstrip("-")


def normalize_youtube_channel_url(channel_url: str | None) -> str | None:
    """Normalize a YouTube channel URL to ``/channel/UCxxx`` format.

    If the URL already contains a channel ID, returns it as-is.
    If it contains an ``@handle``, resolves the handle via the YouTube
    Data API v3 and returns the canonical ``/channel/`` URL.
    Returns None if the URL cannot be resolved (API key missing, handle
    not found, etc.) — callers should keep the original URL in that case.
    """
    if not channel_url:
        return None
    # Already in canonical format
    if extract_channel_id(channel_url):
        return channel_url
    # Try to resolve @handle
    handle = extract_handle(channel_url)
    if not handle:
        return None
    api_key = os.environ.get("YOUTUBE_API_KEY", "")
    if not api_key:
        return None
    resolved = resolve_handle_to_channel_id(handle, api_key)
    if resolved:
        return f"https://www.youtube.com/channel/{resolved}"
    return None


def resolve_handle_to_channel_id(handle: str, api_key: str) -> str | None:
    """Resolve a YouTube @handle to a channel ID (UCxxx) via the Data API v3."""
    try:
        resp = requests.get(
            f"{YOUTUBE_API_BASE}/channels",
            params={"forHandle": f"@{handle}", "part": "id", "key": api_key},
            timeout=10,
        )
        resp.raise_for_status()
        items: list[dict[str, Any]] = resp.json().get("items", [])
        if items:
            return str(items[0]["id"])
        return None
    except requests.RequestException as e:
        logger.error("YouTube API resolve_handle error for @%s: %s", handle, e)
        return None


def fetch_my_channel_id(access_token: str) -> str | None:
    """Fetch the authenticated user's YouTube channel ID using their OAuth token."""
    try:
        resp = requests.get(
            f"{YOUTUBE_API_BASE}/channels",
            params={"mine": "true", "part": "id"},
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        resp.raise_for_status()
        items: list[dict[str, Any]] = resp.json().get("items", [])
        if items:
            return str(items[0]["id"])
        return None
    except requests.RequestException as e:
        logger.error("YouTube API fetch_my_channel_id error: %s", e)
        return None


def subscribe_channel(channel_id: str, callback_url: str, secret: str | None = None) -> bool:
    """Subscribe to a YouTube channel's feed via PubSubHubbub.

    If *secret* is provided, the hub will sign notifications with HMAC-SHA1.
    Returns True if the hub accepted the request (HTTP 202/204).
    """
    try:
        data = {
            "hub.mode": "subscribe",
            "hub.topic": TOPIC_TEMPLATE.format(channel_id),
            "hub.callback": callback_url,
            "hub.verify": "async",
        }
        if secret:
            data["hub.secret"] = secret
        resp = requests.post(HUB_URL, data=data, timeout=15)
        if resp.status_code in (202, 204):
            logger.info("YouTube WebSub subscribe OK for %s", channel_id)
            return True
        logger.warning(
            "YouTube WebSub subscribe failed for %s: HTTP %s — %s", channel_id, resp.status_code, resp.text[:200]
        )
        return False
    except requests.RequestException as e:
        logger.error("YouTube WebSub subscribe error for %s: %s", channel_id, e)
        return False


def unsubscribe_channel(channel_id: str, callback_url: str, secret: str | None = None) -> bool:
    """Unsubscribe from a YouTube channel's feed via PubSubHubbub.

    Returns True if the hub accepted the request (HTTP 202/204).
    """
    try:
        data = {
            "hub.mode": "unsubscribe",
            "hub.topic": TOPIC_TEMPLATE.format(channel_id),
            "hub.callback": callback_url,
            "hub.verify": "async",
        }
        if secret:
            data["hub.secret"] = secret
        resp = requests.post(HUB_URL, data=data, timeout=15)
        if resp.status_code in (202, 204):
            logger.info("YouTube WebSub unsubscribe OK for %s", channel_id)
            return True
        logger.warning("YouTube WebSub unsubscribe failed for %s: HTTP %s", channel_id, resp.status_code)
        return False
    except requests.RequestException as e:
        logger.error("YouTube WebSub unsubscribe error for %s: %s", channel_id, e)
        return False


def parse_feed(feed_xml: str) -> list[dict[str, str]]:
    """Parse a YouTube PubSubHubbub Atom feed notification.

    Returns a list of dicts: [{'video_id': ..., 'channel_id': ...}, ...]
    """
    entries = []
    try:
        root = ET.fromstring(feed_xml)
        for entry in root.findall("atom:entry", NS):
            video_el = entry.find("yt:videoId", NS)
            channel_el = entry.find("yt:channelId", NS)
            if video_el is not None and channel_el is not None:
                video_text = video_el.text
                channel_text = channel_el.text
                if video_text and channel_text:
                    entries.append(
                        {
                            "video_id": video_text.strip(),
                            "channel_id": channel_text.strip(),
                        }
                    )
    except ET.ParseError as e:
        logger.error("Failed to parse YouTube Atom feed: %s", e)
    return entries


def check_video_is_live(video_id: str, api_key: str) -> dict[str, Any] | None:
    """Check if a YouTube video is currently a live stream.

    Returns {'is_live': True, 'title': str, 'started_at': str} if live,
    or None if not live / not a stream / error.
    """
    try:
        resp = requests.get(
            f"{YOUTUBE_API_BASE}/videos",
            params={
                "part": "snippet,liveStreamingDetails",
                "id": video_id,
                "key": api_key,
            },
            timeout=10,
        )
        resp.raise_for_status()
        items = resp.json().get("items", [])
        if not items:
            return None

        item = items[0]
        snippet = item.get("snippet", {})
        live_details = item.get("liveStreamingDetails", {})

        # Must be actively live (not premiere, not upcoming)
        if snippet.get("liveBroadcastContent") != "live":
            return None

        # Must have started but not ended
        started_at = live_details.get("actualStartTime")
        if not started_at or live_details.get("actualEndTime"):
            return None

        return {
            "is_live": True,
            "title": snippet.get("title", ""),
            "started_at": started_at,
        }
    except requests.HTTPError as e:
        status_code = e.response.status_code if e.response is not None else None
        logger.error("YouTube API check_video_is_live HTTP %s for %s: %s", status_code, video_id, e)
        from ..constants import AlertSeverity, AlertType
        from .alerts import log_alert

        log_alert(
            alert_type=AlertType.YT_API_QUOTA,
            severity=AlertSeverity.CRITICAL if status_code == 403 else AlertSeverity.WARNING,
            title=f"YouTube API error (check_video_is_live): HTTP {status_code}",
            context={"video_id": video_id, "status_code": status_code, "error": str(e)[:200]},
        )
        return None
    except requests.RequestException as e:
        logger.error("YouTube API check_video_is_live error for %s: %s", video_id, e)
        from ..constants import AlertSeverity, AlertType
        from .alerts import log_alert

        log_alert(
            alert_type=AlertType.YT_API_QUOTA,
            severity=AlertSeverity.WARNING,
            title="YouTube API connection error (check_video_is_live)",
            context={"video_id": video_id, "error": str(e)[:200]},
        )
        return None


def check_streams_ended(video_ids: list[str], api_key: str) -> set[str]:
    """Batch-check which video IDs have ended streaming.

    Queries up to 50 IDs per API call. Returns a set of video IDs that
    are no longer live (ended, deleted, or made private/unlisted).
    """
    ended = set()
    # Process in batches of 50 (YouTube API limit)
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        try:
            resp = requests.get(
                f"{YOUTUBE_API_BASE}/videos",
                params={
                    "part": "liveStreamingDetails,status",
                    "id": ",".join(batch),
                    "key": api_key,
                },
                timeout=10,
            )
            resp.raise_for_status()
            items = resp.json().get("items", [])

            # Build lookup of returned items
            found = {}
            for item in items:
                found[item["id"]] = item

            for vid in batch:
                if vid not in found:
                    # Video deleted or not accessible
                    ended.add(vid)
                    continue
                item = found[vid]
                live_details = item.get("liveStreamingDetails", {})
                status = item.get("status", {})

                # Ended if actualEndTime is set
                if live_details.get("actualEndTime"):
                    ended.add(vid)
                    continue
                # Ended if made private or unlisted
                if status.get("privacyStatus") in ("private", "unlisted"):
                    ended.add(vid)

        except requests.HTTPError as e:
            status_code = e.response.status_code if e.response is not None else None
            logger.error("YouTube API check_streams_ended HTTP %s: %s", status_code, e)
            from ..constants import AlertSeverity, AlertType
            from .alerts import log_alert

            log_alert(
                alert_type=AlertType.YT_API_QUOTA,
                severity=AlertSeverity.CRITICAL if status_code == 403 else AlertSeverity.WARNING,
                title=f"YouTube API error (check_streams_ended): HTTP {status_code}",
                context={"batch_size": len(batch), "status_code": status_code, "error": str(e)[:200]},
            )
        except requests.RequestException as e:
            logger.error("YouTube API check_streams_ended error: %s", e)
            from ..constants import AlertSeverity, AlertType
            from .alerts import log_alert

            log_alert(
                alert_type=AlertType.YT_API_QUOTA,
                severity=AlertSeverity.WARNING,
                title="YouTube API connection error (check_streams_ended)",
                context={"batch_size": len(batch), "error": str(e)[:200]},
            )

    return ended
