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

    # Upsert: INSERT or UPDATE on conflict
    existing = LiveStream.query.filter_by(
        user_id=account.user_id, provider='twitch'
    ).first()
    if existing:
        existing.stream_id = event.get('id')
        existing.stream_url = stream_url
        existing.started_at = datetime.now(timezone.utc)
    else:
        stream = LiveStream(
            user_id=account.user_id,
            provider='twitch',
            stream_id=event.get('id'),
            stream_url=stream_url,
            started_at=datetime.now(timezone.utc),
        )
        db.session.add(stream)

    db.session.commit()
    invalidate_live_cache()
    log.info('Twitch stream.online: user_id=%s, broadcaster=%s', account.user_id, broadcaster_id)


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
    # TODO: YouTube PubSubHubbub — reference code pending
    challenge = request.args.get('hub.challenge', '')
    if challenge:
        return challenge, 200, {'Content-Type': 'text/plain'}
    return '', 404


@livestream_bp.route('/webhooks/youtube', methods=['POST'])
@limiter.exempt
def youtube_webhook_notify():
    """Receive YouTube PubSubHubbub Atom feed notification."""
    # TODO: YouTube PubSubHubbub — reference code pending
    log.info('YouTube PubSub notification received (handler not yet implemented)')
    return '', 204


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
    """Batch rebuild Twitch EventSub subscriptions for all Twitch users."""
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

    # 1. Delete all existing subscriptions
    try:
        existing = list_eventsub_subscriptions(client_id, client_secret)
        for sub in existing:
            try:
                delete_eventsub_subscription(client_id, client_secret, sub['id'])
            except Exception as e:
                log.warning('Failed to delete subscription %s: %s', sub['id'], e)
    except Exception as e:
        log.error('Failed to list existing subscriptions: %s', e)

    # 2. Get all Twitch accounts
    twitch_accounts = OAuthAccount.query.filter_by(provider='twitch').all()

    created = 0
    errors = 0
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

    return jsonify({
        'created': created,
        'errors': errors,
        'total_accounts': len(twitch_accounts),
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
