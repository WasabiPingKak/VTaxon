"""Twitch EventSub and YouTube PubSubHubbub webhook handlers."""

import logging
import os
from datetime import UTC, datetime

from flask import Blueprint, request

from ..extensions import db
from ..limiter import limiter
from ..models import LiveStream, OAuthAccount, User

logger = logging.getLogger(__name__)

webhooks_bp = Blueprint("webhooks", __name__)


def _invalidate_live_cache():
    """Invalidate the live status cache after DB changes."""
    from .livestream import invalidate_live_cache

    invalidate_live_cache()


# ── Twitch EventSub Webhook ──


@webhooks_bp.route("/webhooks/twitch", methods=["POST"])
@limiter.exempt
def twitch_webhook():
    """Handle Twitch EventSub webhook callbacks."""
    from ..services.twitch import verify_webhook_signature

    webhook_secret = os.environ.get("TWITCH_WEBHOOK_SECRET", "")
    if not webhook_secret:
        logger.error("TWITCH_WEBHOOK_SECRET not configured")
        return "", 500

    body = request.get_data(as_text=True)

    if not verify_webhook_signature(request.headers, body, webhook_secret):
        logger.warning("Twitch webhook signature verification failed")
        return "", 403

    msg_type = request.headers.get("Twitch-Eventsub-Message-Type", "")
    payload = request.get_json(silent=True) or {}

    # Challenge verification
    if msg_type == "webhook_callback_verification":
        challenge = payload.get("challenge", "")
        return challenge, 200, {"Content-Type": "text/plain"}

    # Revocation
    if msg_type == "revocation":
        sub = payload.get("subscription", {})
        logger.warning("Twitch EventSub revocation: type=%s, status=%s", sub.get("type"), sub.get("status"))
        return "", 204

    # Notification
    if msg_type == "notification":
        sub_type = payload.get("subscription", {}).get("type", "")
        event = payload.get("event", {})

        if sub_type == "stream.online":
            _handle_stream_online(event)
        elif sub_type == "stream.offline":
            _handle_stream_offline(event)
        else:
            logger.info("Unhandled Twitch EventSub type: %s", sub_type)

        return "", 204

    return "", 204


def _handle_stream_online(event):
    """Insert live_streams record when a Twitch stream goes online."""
    broadcaster_id = event.get("broadcaster_user_id", "")
    if not broadcaster_id:
        return

    account = OAuthAccount.query.filter_by(provider="twitch", provider_account_id=broadcaster_id).first()
    if not account:
        logger.info("Twitch stream.online for unknown broadcaster %s", broadcaster_id)
        return

    broadcaster_login = event.get("broadcaster_user_login", "")
    stream_url = f"https://twitch.tv/{broadcaster_login}" if broadcaster_login else account.channel_url

    from ..services.twitch import get_stream_title

    client_id = os.environ.get("TWITCH_CLIENT_ID", "")
    client_secret = os.environ.get("TWITCH_CLIENT_SECRET", "")
    stream_title = None
    if client_id and client_secret:
        stream_title = get_stream_title(client_id, client_secret, broadcaster_id)

    existing = LiveStream.query.filter_by(user_id=account.user_id, provider="twitch").first()
    if existing:
        existing.stream_id = event.get("id")
        existing.stream_url = stream_url
        existing.stream_title = stream_title
        existing.started_at = datetime.now(UTC)
    else:
        stream = LiveStream(
            user_id=account.user_id,
            provider="twitch",
            stream_id=event.get("id"),
            stream_url=stream_url,
            stream_title=stream_title,
            started_at=datetime.now(UTC),
        )
        db.session.add(stream)

    user = db.session.get(User, account.user_id)
    if user:
        user.last_live_at = datetime.now(UTC)

    db.session.commit()
    _invalidate_live_cache()
    logger.info(
        "Twitch stream.online: user_id=%s, broadcaster=%s, title=%s", account.user_id, broadcaster_id, stream_title
    )


def _handle_stream_offline(event):
    """Delete live_streams record when a Twitch stream goes offline."""
    broadcaster_id = event.get("broadcaster_user_id", "")
    if not broadcaster_id:
        return

    account = OAuthAccount.query.filter_by(provider="twitch", provider_account_id=broadcaster_id).first()
    if not account:
        return

    user = db.session.get(User, account.user_id)
    if user:
        user.last_live_at = datetime.now(UTC)

    LiveStream.query.filter_by(user_id=account.user_id, provider="twitch").delete()
    db.session.commit()
    _invalidate_live_cache()
    logger.info("Twitch stream.offline: user_id=%s, broadcaster=%s", account.user_id, broadcaster_id)


# ── YouTube PubSubHubbub Webhook ──


@webhooks_bp.route("/webhooks/youtube", methods=["GET"])
@limiter.exempt
def youtube_webhook_verify():
    """PubSubHubbub subscription verification — return hub.challenge."""
    challenge = request.args.get("hub.challenge", "")
    if challenge:
        return challenge, 200, {"Content-Type": "text/plain"}
    return "", 404


@webhooks_bp.route("/webhooks/youtube", methods=["POST"])
@limiter.exempt
def youtube_webhook_notify():
    """Receive YouTube PubSubHubbub Atom feed notification."""
    from ..services.youtube_pubsub import check_video_is_live, parse_feed, verify_hub_signature

    hub_secret = os.environ.get("CRON_SECRET", "")
    feed_xml = request.get_data(as_text=True)
    if hub_secret:
        sig = request.headers.get("X-Hub-Signature", "")
        if not verify_hub_signature(hub_secret, sig, feed_xml):
            logger.warning("YouTube WebSub signature verification failed")
            return "", 403

    api_key = os.environ.get("YOUTUBE_API_KEY", "")
    entries = parse_feed(feed_xml)

    for entry in entries:
        video_id = entry["video_id"]
        channel_id = entry["channel_id"]

        account = OAuthAccount.query.filter(
            OAuthAccount.provider == "youtube",
            OAuthAccount.channel_url.ilike(f"%/channel/{channel_id}%"),
        ).first()
        if not account:
            logger.debug("YouTube WebSub notification for unknown channel %s", channel_id)
            continue

        if not api_key:
            logger.warning("YOUTUBE_API_KEY not configured, cannot verify live status")
            continue

        live_info = check_video_is_live(video_id, api_key)
        if not live_info:
            logger.debug("YouTube video %s is not a live stream, skipping", video_id)
            continue

        _handle_youtube_live(
            user_id=account.user_id,
            video_id=video_id,
            title=live_info["title"],
            channel_url=account.channel_url,
            started_at=live_info["started_at"],
        )

    return "", 204


def _handle_youtube_live(user_id, video_id, title, channel_url, started_at):
    """Insert/update live_streams record for a YouTube live stream."""
    stream_url = f"https://www.youtube.com/watch?v={video_id}"

    try:
        started_dt = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
    except (ValueError, TypeError, AttributeError):
        started_dt = datetime.now(UTC)

    existing = LiveStream.query.filter_by(user_id=user_id, provider="youtube").first()
    if existing:
        existing.stream_id = video_id
        existing.stream_url = stream_url
        existing.stream_title = title
        existing.started_at = started_dt
    else:
        stream = LiveStream(
            user_id=user_id,
            provider="youtube",
            stream_id=video_id,
            stream_url=stream_url,
            stream_title=title,
            started_at=started_dt,
        )
        db.session.add(stream)

    user = db.session.get(User, user_id)
    if user:
        user.last_live_at = datetime.now(UTC)

    db.session.commit()
    _invalidate_live_cache()
    logger.info("YouTube live: user_id=%s, video=%s, title=%s", user_id, video_id, title)
