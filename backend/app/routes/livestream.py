"""Live stream status endpoints + Twitch/YouTube webhook callbacks."""

import logging
import os
import time
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request

from ..auth import admin_required
from ..extensions import db
from ..limiter import limiter
from ..models import LiveStream, OAuthAccount

log = logging.getLogger(__name__)

livestream_bp = Blueprint('livestream', __name__)

# ── In-process cache for /api/live-status (TTL 15s) ──
_live_cache = {'data': None, 'ts': 0, 'ttl': 15}


@livestream_bp.route('/live-status', methods=['GET'])
@limiter.limit("60/minute")
def live_status():
    """Public endpoint: return all currently live users."""
    now = time.time()
    if _live_cache['data'] is not None and (now - _live_cache['ts']) < _live_cache['ttl']:
        return jsonify(_live_cache['data'])

    # Clean up ghost records (started > 24h ago)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    LiveStream.query.filter(LiveStream.started_at < cutoff).delete()
    db.session.commit()

    streams = LiveStream.query.all()
    result = {
        'live': [s.to_dict() for s in streams],
    }

    _live_cache['data'] = result
    _live_cache['ts'] = time.time()

    return jsonify(result)


def invalidate_live_cache():
    """Invalidate the live status cache after DB changes."""
    _live_cache['data'] = None
    _live_cache['ts'] = 0


# ── Twitch EventSub Webhook ──

@livestream_bp.route('/webhooks/twitch', methods=['POST'])
@limiter.exempt
def twitch_webhook():
    """Handle Twitch EventSub webhook callbacks."""
    from ..services.twitch import verify_webhook_signature

    webhook_secret = os.environ.get('TWITCH_WEBHOOK_SECRET', '')
    if not webhook_secret:
        log.error('TWITCH_WEBHOOK_SECRET not configured')
        return '', 500

    body = request.get_data(as_text=True)

    if not verify_webhook_signature(request.headers, body, webhook_secret):
        log.warning('Twitch webhook signature verification failed')
        return '', 403

    msg_type = request.headers.get('Twitch-Eventsub-Message-Type', '')
    payload = request.get_json(silent=True) or {}

    # Challenge verification
    if msg_type == 'webhook_callback_verification':
        challenge = payload.get('challenge', '')
        return challenge, 200, {'Content-Type': 'text/plain'}

    # Revocation
    if msg_type == 'revocation':
        sub = payload.get('subscription', {})
        log.warning('Twitch EventSub revocation: type=%s, status=%s',
                    sub.get('type'), sub.get('status'))
        return '', 204

    # Notification
    if msg_type == 'notification':
        sub_type = payload.get('subscription', {}).get('type', '')
        event = payload.get('event', {})

        if sub_type == 'stream.online':
            _handle_stream_online(event)
        elif sub_type == 'stream.offline':
            _handle_stream_offline(event)
        else:
            log.info('Unhandled Twitch EventSub type: %s', sub_type)

        return '', 204

    return '', 204


def _handle_stream_online(event):
    """Insert live_streams record when a Twitch stream goes online."""
    broadcaster_id = event.get('broadcaster_user_id', '')
    if not broadcaster_id:
        return

    # Look up VTaxon user by Twitch provider_account_id
    account = OAuthAccount.query.filter_by(
        provider='twitch', provider_account_id=broadcaster_id
    ).first()
    if not account:
        log.info('Twitch stream.online for unknown broadcaster %s', broadcaster_id)
        return

    broadcaster_login = event.get('broadcaster_user_login', '')
    stream_url = f'https://twitch.tv/{broadcaster_login}' if broadcaster_login else account.channel_url

    # Fetch stream title from Helix API (best-effort)
    from ..services.twitch import get_stream_title
    client_id = os.environ.get('TWITCH_CLIENT_ID', '')
    client_secret = os.environ.get('TWITCH_CLIENT_SECRET', '')
    stream_title = None
    if client_id and client_secret:
        stream_title = get_stream_title(client_id, client_secret, broadcaster_id)

    # Upsert: INSERT or UPDATE on conflict
    existing = LiveStream.query.filter_by(
        user_id=account.user_id, provider='twitch'
    ).first()
    if existing:
        existing.stream_id = event.get('id')
        existing.stream_url = stream_url
        existing.stream_title = stream_title
        existing.started_at = datetime.now(timezone.utc)
    else:
        stream = LiveStream(
            user_id=account.user_id,
            provider='twitch',
            stream_id=event.get('id'),
            stream_url=stream_url,
            stream_title=stream_title,
            started_at=datetime.now(timezone.utc),
        )
        db.session.add(stream)

    db.session.commit()
    invalidate_live_cache()
    log.info('Twitch stream.online: user_id=%s, broadcaster=%s, title=%s',
             account.user_id, broadcaster_id, stream_title)


def _handle_stream_offline(event):
    """Delete live_streams record when a Twitch stream goes offline."""
    broadcaster_id = event.get('broadcaster_user_id', '')
    if not broadcaster_id:
        return

    account = OAuthAccount.query.filter_by(
        provider='twitch', provider_account_id=broadcaster_id
    ).first()
    if not account:
        return

    LiveStream.query.filter_by(
        user_id=account.user_id, provider='twitch'
    ).delete()
    db.session.commit()
    invalidate_live_cache()
    log.info('Twitch stream.offline: user_id=%s, broadcaster=%s', account.user_id, broadcaster_id)


# ── YouTube PubSubHubbub Webhook (placeholder) ──

@livestream_bp.route('/webhooks/youtube', methods=['GET'])
@limiter.exempt
def youtube_webhook_verify():
    """PubSubHubbub subscription verification — return hub.challenge."""
    challenge = request.args.get('hub.challenge', '')
    if challenge:
        return challenge, 200, {'Content-Type': 'text/plain'}
    return '', 404


@livestream_bp.route('/webhooks/youtube', methods=['POST'])
@limiter.exempt
def youtube_webhook_notify():
    """Receive YouTube PubSubHubbub Atom feed notification."""
    from ..services.youtube_pubsub import (check_video_is_live,
                                            extract_channel_id, parse_feed)

    api_key = os.environ.get('YOUTUBE_API_KEY', '')
    feed_xml = request.get_data(as_text=True)
    entries = parse_feed(feed_xml)

    for entry in entries:
        video_id = entry['video_id']
        channel_id = entry['channel_id']

        # Find the VTaxon user by matching channel_id in channel_url
        account = OAuthAccount.query.filter(
            OAuthAccount.provider == 'youtube',
            OAuthAccount.channel_url.ilike(f'%/channel/{channel_id}%'),
        ).first()
        if not account:
            log.debug('YouTube WebSub notification for unknown channel %s', channel_id)
            continue

        if not api_key:
            log.warning('YOUTUBE_API_KEY not configured, cannot verify live status')
            continue

        live_info = check_video_is_live(video_id, api_key)
        if not live_info:
            log.debug('YouTube video %s is not a live stream, skipping', video_id)
            continue

        _handle_youtube_live(
            user_id=account.user_id,
            video_id=video_id,
            title=live_info['title'],
            channel_url=account.channel_url,
            started_at=live_info['started_at'],
        )

    return '', 204


def _handle_youtube_live(user_id, video_id, title, channel_url, started_at):
    """Insert/update live_streams record for a YouTube live stream."""
    stream_url = f'https://www.youtube.com/watch?v={video_id}'

    try:
        started_dt = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
    except (ValueError, TypeError, AttributeError):
        started_dt = datetime.now(timezone.utc)

    existing = LiveStream.query.filter_by(
        user_id=user_id, provider='youtube'
    ).first()
    if existing:
        existing.stream_id = video_id
        existing.stream_url = stream_url
        existing.stream_title = title
        existing.started_at = started_dt
    else:
        stream = LiveStream(
            user_id=user_id,
            provider='youtube',
            stream_id=video_id,
            stream_url=stream_url,
            stream_title=title,
            started_at=started_dt,
        )
        db.session.add(stream)

    db.session.commit()
    invalidate_live_cache()
    log.info('YouTube live: user_id=%s, video=%s, title=%s', user_id, video_id, title)


# ── YouTube cron endpoints (authenticated by X-Cron-Secret) ──

def _verify_cron_secret():
    """Verify X-Cron-Secret header matches CRON_SECRET env var."""
    secret = os.environ.get('CRON_SECRET', '')
    if not secret:
        return False
    return request.headers.get('X-Cron-Secret', '') == secret


@livestream_bp.route('/livestream/youtube-check-offline', methods=['POST'])
@limiter.exempt
def youtube_check_offline():
    """Cron endpoint: check if YouTube live streams have ended."""
    if not _verify_cron_secret():
        return jsonify({'error': 'Unauthorized'}), 403

    from ..services.youtube_pubsub import check_streams_ended

    api_key = os.environ.get('YOUTUBE_API_KEY', '')
    if not api_key:
        return jsonify({'error': 'YOUTUBE_API_KEY not configured'}), 500

    streams = LiveStream.query.filter_by(provider='youtube').all()
    if not streams:
        return jsonify({'checked': 0, 'ended': 0})

    video_ids = [s.stream_id for s in streams if s.stream_id]
    ended_ids = check_streams_ended(video_ids, api_key)

    if ended_ids:
        LiveStream.query.filter(
            LiveStream.provider == 'youtube',
            LiveStream.stream_id.in_(ended_ids),
        ).delete(synchronize_session='fetch')
        db.session.commit()
        invalidate_live_cache()

    log.info('YouTube check-offline: checked=%d, ended=%d', len(video_ids), len(ended_ids))
    return jsonify({'checked': len(video_ids), 'ended': len(ended_ids)})


@livestream_bp.route('/livestream/youtube-renew-subs', methods=['POST'])
@limiter.exempt
def youtube_renew_subs():
    """Cron endpoint: renew all YouTube WebSub subscriptions."""
    if not _verify_cron_secret():
        return jsonify({'error': 'Unauthorized'}), 403

    from ..services.youtube_pubsub import extract_channel_id, subscribe_channel

    webhook_base_url = os.environ.get('WEBHOOK_BASE_URL', '')
    if not webhook_base_url:
        return jsonify({'error': 'WEBHOOK_BASE_URL not configured'}), 500

    callback_url = f'{webhook_base_url}/api/webhooks/youtube'

    accounts = OAuthAccount.query.filter_by(provider='youtube').all()
    renewed = 0
    skipped = 0
    errors = 0

    for account in accounts:
        channel_id = extract_channel_id(account.channel_url)
        if not channel_id:
            skipped += 1
            continue
        ok = subscribe_channel(channel_id, callback_url)
        if ok:
            renewed += 1
        else:
            errors += 1

    log.info('YouTube renew-subs: total=%d, renewed=%d, skipped=%d, errors=%d',
             len(accounts), renewed, skipped, errors)
    return jsonify({
        'total': len(accounts),
        'renewed': renewed,
        'skipped': skipped,
        'errors': errors,
    })


# ── Admin endpoints for Twitch subscription management ──

@livestream_bp.route('/livestream/twitch-subs', methods=['GET'])
@admin_required
def list_twitch_subs():
    """List all Twitch EventSub subscriptions."""
    from ..services.twitch import list_eventsub_subscriptions

    client_id = os.environ.get('TWITCH_CLIENT_ID', '')
    client_secret = os.environ.get('TWITCH_CLIENT_SECRET', '')
    if not client_id or not client_secret:
        return jsonify({'error': 'Twitch credentials not configured'}), 500

    try:
        subs = list_eventsub_subscriptions(client_id, client_secret)
        return jsonify({'subscriptions': subs, 'total': len(subs)})
    except Exception as e:
        log.error('Failed to list Twitch EventSub subscriptions: %s', e)
        return jsonify({'error': str(e)}), 502


@livestream_bp.route('/livestream/rebuild-twitch-subs', methods=['POST'])
@admin_required
def rebuild_twitch_subs():
    """Batch rebuild Twitch EventSub subscriptions for all Twitch users.

    Query params:
      ?offset=N  — skip first N accounts (default 0)
      ?limit=N   — process N accounts per call (default 20)
      ?clean=1   — delete all existing subscriptions first (only on first call)
    """
    from ..services.twitch import (create_eventsub_subscription,
                                    delete_eventsub_subscription,
                                    list_eventsub_subscriptions)

    client_id = os.environ.get('TWITCH_CLIENT_ID', '')
    client_secret = os.environ.get('TWITCH_CLIENT_SECRET', '')
    webhook_secret = os.environ.get('TWITCH_WEBHOOK_SECRET', '')
    webhook_base_url = os.environ.get('WEBHOOK_BASE_URL', '')

    if not all([client_id, client_secret, webhook_secret, webhook_base_url]):
        return jsonify({'error': 'Missing Twitch/webhook configuration'}), 500

    callback_url = f'{webhook_base_url}/api/webhooks/twitch'

    offset = request.args.get('offset', 0, type=int)
    limit = request.args.get('limit', 20, type=int)
    clean = request.args.get('clean', '', type=str) == '1'

    # Optionally delete all existing subscriptions (first batch only)
    deleted = 0
    if clean:
        try:
            existing = list_eventsub_subscriptions(client_id, client_secret)
            for sub in existing:
                try:
                    delete_eventsub_subscription(client_id, client_secret, sub['id'])
                    deleted += 1
                except Exception as e:
                    log.warning('Failed to delete subscription %s: %s', sub['id'], e)
        except Exception as e:
            log.error('Failed to list existing subscriptions: %s', e)

    # Get paginated Twitch accounts
    total_accounts = OAuthAccount.query.filter_by(provider='twitch').count()
    twitch_accounts = OAuthAccount.query.filter_by(provider='twitch') \
        .order_by(OAuthAccount.created_at) \
        .offset(offset).limit(limit).all()

    created = 0
    errors = 0
    error_details = []
    for account in twitch_accounts:
        broadcaster_id = account.provider_account_id
        for event_type in ('stream.online', 'stream.offline'):
            try:
                create_eventsub_subscription(
                    client_id, client_secret, broadcaster_id,
                    event_type, callback_url, webhook_secret,
                )
                created += 1
            except Exception as e:
                log.error('Failed to create %s sub for %s: %s',
                          event_type, broadcaster_id, e)
                errors += 1
                error_details.append(f'{broadcaster_id}:{event_type}:{e}')

    next_offset = offset + limit
    return jsonify({
        'created': created,
        'errors': errors,
        'deleted': deleted,
        'batch': f'{offset}-{offset + len(twitch_accounts)}',
        'total_accounts': total_accounts,
        'has_more': next_offset < total_accounts,
        'next_offset': next_offset if next_offset < total_accounts else None,
        'error_details': error_details[:10],
    })


def subscribe_twitch_user(provider_account_id):
    """Subscribe to stream.online + stream.offline for a Twitch broadcaster.

    Called from OAuth sync when a new Twitch account is linked.
    """
    from ..services.twitch import create_eventsub_subscription

    client_id = os.environ.get('TWITCH_CLIENT_ID', '')
    client_secret = os.environ.get('TWITCH_CLIENT_SECRET', '')
    webhook_secret = os.environ.get('TWITCH_WEBHOOK_SECRET', '')
    webhook_base_url = os.environ.get('WEBHOOK_BASE_URL', '')

    if not all([client_id, client_secret, webhook_secret, webhook_base_url]):
        log.warning('Twitch EventSub not configured, skipping subscription for %s',
                    provider_account_id)
        return

    callback_url = f'{webhook_base_url}/api/webhooks/twitch'

    for event_type in ('stream.online', 'stream.offline'):
        try:
            create_eventsub_subscription(
                client_id, client_secret, provider_account_id,
                event_type, callback_url, webhook_secret,
            )
            log.info('Created Twitch EventSub %s for %s', event_type, provider_account_id)
        except Exception as e:
            log.error('Failed to create Twitch EventSub %s for %s: %s',
                      event_type, provider_account_id, e)


def unsubscribe_twitch_user(provider_account_id):
    """Remove all EventSub subscriptions for a Twitch broadcaster.

    Called when a Twitch account is unlinked.
    """
    from ..services.twitch import (list_eventsub_subscriptions,
                                    delete_eventsub_subscription)

    client_id = os.environ.get('TWITCH_CLIENT_ID', '')
    client_secret = os.environ.get('TWITCH_CLIENT_SECRET', '')

    if not client_id or not client_secret:
        return

    try:
        subs = list_eventsub_subscriptions(client_id, client_secret)
        for sub in subs:
            condition = sub.get('condition', {})
            if condition.get('broadcaster_user_id') == provider_account_id:
                try:
                    delete_eventsub_subscription(client_id, client_secret, sub['id'])
                    log.info('Deleted Twitch EventSub %s for %s', sub['id'], provider_account_id)
                except Exception as e:
                    log.warning('Failed to delete sub %s: %s', sub['id'], e)
    except Exception as e:
        log.error('Failed to clean up Twitch EventSub for %s: %s', provider_account_id, e)


# ── Admin endpoints for YouTube WebSub management ──

@livestream_bp.route('/livestream/youtube-subs', methods=['GET'])
@admin_required
def list_youtube_subs():
    """List all YouTube OAuthAccounts and their WebSub subscription status."""
    from ..services.youtube_pubsub import extract_channel_id

    accounts = OAuthAccount.query.filter_by(provider='youtube').all()
    result = []
    for a in accounts:
        channel_id = extract_channel_id(a.channel_url)
        result.append({
            'user_id': str(a.user_id),
            'provider_account_id': a.provider_account_id,
            'provider_display_name': a.provider_display_name,
            'channel_url': a.channel_url,
            'channel_id': channel_id,
            'has_channel_id': channel_id is not None,
        })
    return jsonify({'accounts': result, 'total': len(result)})


@livestream_bp.route('/livestream/rebuild-youtube-subs', methods=['POST'])
@admin_required
def rebuild_youtube_subs():
    """Batch rebuild YouTube WebSub subscriptions for all YouTube users.

    Query params:
      ?offset=N  — skip first N accounts (default 0)
      ?limit=N   — process N accounts per call (default 20)
      ?clean=1   — unsubscribe all first (only on first call)
    """
    from ..services.youtube_pubsub import (extract_channel_id,
                                            subscribe_channel,
                                            unsubscribe_channel)

    webhook_base_url = os.environ.get('WEBHOOK_BASE_URL', '')
    if not webhook_base_url:
        return jsonify({'error': 'WEBHOOK_BASE_URL not configured'}), 500

    callback_url = f'{webhook_base_url}/api/webhooks/youtube'

    offset = request.args.get('offset', 0, type=int)
    limit = request.args.get('limit', 20, type=int)
    clean = request.args.get('clean', '', type=str) == '1'

    total_accounts = OAuthAccount.query.filter_by(provider='youtube').count()
    yt_accounts = OAuthAccount.query.filter_by(provider='youtube') \
        .order_by(OAuthAccount.created_at) \
        .offset(offset).limit(limit).all()

    unsubscribed = 0
    if clean:
        for account in yt_accounts:
            channel_id = extract_channel_id(account.channel_url)
            if channel_id:
                unsubscribe_channel(channel_id, callback_url)
                unsubscribed += 1

    subscribed = 0
    skipped = 0
    errors = 0
    for account in yt_accounts:
        channel_id = extract_channel_id(account.channel_url)
        if not channel_id:
            skipped += 1
            continue
        ok = subscribe_channel(channel_id, callback_url)
        if ok:
            subscribed += 1
        else:
            errors += 1

    next_offset = offset + limit
    return jsonify({
        'subscribed': subscribed,
        'skipped': skipped,
        'errors': errors,
        'unsubscribed': unsubscribed,
        'batch': f'{offset}-{offset + len(yt_accounts)}',
        'total_accounts': total_accounts,
        'has_more': next_offset < total_accounts,
        'next_offset': next_offset if next_offset < total_accounts else None,
    })


# ── YouTube WebSub helpers (called from OAuth sync) ──

def subscribe_youtube_user(channel_url):
    """Subscribe to YouTube WebSub for a channel. Called from OAuth sync."""
    from ..services.youtube_pubsub import extract_channel_id, subscribe_channel

    webhook_base_url = os.environ.get('WEBHOOK_BASE_URL', '')
    if not webhook_base_url:
        log.warning('WEBHOOK_BASE_URL not configured, skipping YouTube WebSub for %s',
                    channel_url)
        return

    channel_id = extract_channel_id(channel_url)
    if not channel_id:
        log.warning('Could not extract channel ID from %s', channel_url)
        return

    callback_url = f'{webhook_base_url}/api/webhooks/youtube'
    subscribe_channel(channel_id, callback_url)


def unsubscribe_youtube_user(channel_url):
    """Unsubscribe from YouTube WebSub for a channel. Called when account is unlinked."""
    from ..services.youtube_pubsub import extract_channel_id, unsubscribe_channel

    webhook_base_url = os.environ.get('WEBHOOK_BASE_URL', '')
    if not webhook_base_url:
        return

    channel_id = extract_channel_id(channel_url)
    if not channel_id:
        return

    callback_url = f'{webhook_base_url}/api/webhooks/youtube'
    unsubscribe_channel(channel_id, callback_url)
