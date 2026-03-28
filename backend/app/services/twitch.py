"""Twitch EventSub integration — App Access Token + subscription management."""

import hashlib
import hmac
import logging
import time

import requests

logger = logging.getLogger(__name__)

# Module-level App Access Token cache (Client Credentials flow)
_token_cache = {'access_token': None, 'expires_at': 0}


def get_app_access_token(client_id, client_secret):
    """Get a Twitch App Access Token via Client Credentials, cached until expiry."""
    now = time.time()
    if _token_cache['access_token'] and now < _token_cache['expires_at'] - 60:
        return _token_cache['access_token']

    resp = requests.post('https://id.twitch.tv/oauth2/token', data={
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'client_credentials',
    }, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    _token_cache['access_token'] = data['access_token']
    _token_cache['expires_at'] = now + data.get('expires_in', 3600)
    logger.info('Twitch App Access Token refreshed, expires in %ds', data.get('expires_in', 0))
    return _token_cache['access_token']


def create_eventsub_subscription(client_id, client_secret, broadcaster_user_id,
                                 event_type, callback_url, webhook_secret):
    """Create a Twitch EventSub subscription for stream.online / stream.offline."""
    token = get_app_access_token(client_id, client_secret)
    resp = requests.post('https://api.twitch.tv/helix/eventsub/subscriptions', json={
        'type': event_type,
        'version': '1',
        'condition': {'broadcaster_user_id': broadcaster_user_id},
        'transport': {
            'method': 'webhook',
            'callback': callback_url,
            'secret': webhook_secret,
        },
    }, headers={
        'Authorization': f'Bearer {token}',
        'Client-Id': client_id,
        'Content-Type': 'application/json',
    }, timeout=10)
    # 409 = subscription already exists — treat as success
    if resp.status_code == 409:
        logger.info('Twitch EventSub %s already exists for %s, skipping',
                 event_type, broadcaster_user_id)
        return {'status': 'already_exists'}
    resp.raise_for_status()
    return resp.json()


def delete_eventsub_subscription(client_id, client_secret, subscription_id):
    """Delete a Twitch EventSub subscription."""
    token = get_app_access_token(client_id, client_secret)
    resp = requests.delete(
        f'https://api.twitch.tv/helix/eventsub/subscriptions?id={subscription_id}',
        headers={
            'Authorization': f'Bearer {token}',
            'Client-Id': client_id,
        },
        timeout=10,
    )
    resp.raise_for_status()


def list_eventsub_subscriptions(client_id, client_secret):
    """List all EventSub subscriptions for this app."""
    token = get_app_access_token(client_id, client_secret)
    subs = []
    cursor = None
    while True:
        params = {}
        if cursor:
            params['after'] = cursor
        resp = requests.get('https://api.twitch.tv/helix/eventsub/subscriptions',
                            headers={
                                'Authorization': f'Bearer {token}',
                                'Client-Id': client_id,
                            }, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        subs.extend(data.get('data', []))
        cursor = data.get('pagination', {}).get('cursor')
        if not cursor:
            break
    return subs


def get_stream_title(client_id, client_secret, broadcaster_id):
    """Fetch current stream title via Helix GET /streams.

    Returns title string or None. Rate limit: 800 req/min — only called on
    stream.online events so well within budget.
    """
    try:
        token = get_app_access_token(client_id, client_secret)
        resp = requests.get('https://api.twitch.tv/helix/streams',
                            params={'user_id': broadcaster_id},
                            headers={
                                'Authorization': f'Bearer {token}',
                                'Client-Id': client_id,
                            }, timeout=10)
        resp.raise_for_status()
        data = resp.json().get('data', [])
        if data:
            return data[0].get('title')
    except requests.RequestException as e:
        logger.warning('Failed to fetch Twitch stream title for %s: %s', broadcaster_id, e)
    return None


def verify_webhook_signature(headers, body, secret):
    """Verify Twitch EventSub webhook HMAC-SHA256 signature.

    Returns True if valid, False otherwise.
    """
    msg_id = headers.get('Twitch-Eventsub-Message-Id', '')
    msg_timestamp = headers.get('Twitch-Eventsub-Message-Timestamp', '')
    msg_signature = headers.get('Twitch-Eventsub-Message-Signature', '')

    if not msg_id or not msg_timestamp or not msg_signature:
        return False

    hmac_message = msg_id + msg_timestamp + body
    expected = 'sha256=' + hmac.new(
        secret.encode('utf-8'),
        hmac_message.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, msg_signature)
