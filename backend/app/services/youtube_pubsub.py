"""YouTube PubSubHubbub (WebSub) integration.

Handles subscribe/unsubscribe to YouTube channel feeds via the Google
PubSubHubbub hub, parses Atom feed notifications, and checks live status
via the YouTube Data API v3.
"""

import hashlib
import hmac
import logging
import re
import xml.etree.ElementTree as ET

import requests

log = logging.getLogger(__name__)

HUB_URL = 'https://pubsubhubbub.appspot.com/subscribe'
TOPIC_TEMPLATE = 'https://www.youtube.com/xml/feeds/videos.xml?channel_id={}'
YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

# Atom + YouTube XML namespaces
NS = {
    'atom': 'http://www.w3.org/2005/Atom',
    'yt': 'http://www.youtube.com/xml/schemas/2015',
}


def verify_hub_signature(secret, signature_header, body):
    """Verify the X-Hub-Signature HMAC-SHA1 from PubSubHubbub.

    *signature_header* is e.g. ``sha1=abcdef1234...``.
    Returns True if the signature is valid.
    """
    if not signature_header:
        return False
    parts = signature_header.split('=', 1)
    if len(parts) != 2 or parts[0] != 'sha1':
        return False
    expected = hmac.new(
        secret.encode(), body.encode(), hashlib.sha1,
    ).hexdigest()
    return hmac.compare_digest(expected, parts[1])


def extract_channel_id(channel_url):
    """Extract YouTube channel ID (UCxxx) from a channel URL.

    Supports:
      - https://www.youtube.com/channel/UCxxx
      - https://youtube.com/channel/UCxxx
    Returns None if the URL doesn't contain a channel ID.
    """
    if not channel_url:
        return None
    match = re.search(r'youtube\.com/channel/(UC[\w-]+)', channel_url)
    return match.group(1) if match else None


def subscribe_channel(channel_id, callback_url, secret=None):
    """Subscribe to a YouTube channel's feed via PubSubHubbub.

    If *secret* is provided, the hub will sign notifications with HMAC-SHA1.
    Returns True if the hub accepted the request (HTTP 202/204).
    """
    try:
        data = {
            'hub.mode': 'subscribe',
            'hub.topic': TOPIC_TEMPLATE.format(channel_id),
            'hub.callback': callback_url,
            'hub.verify': 'async',
        }
        if secret:
            data['hub.secret'] = secret
        resp = requests.post(HUB_URL, data=data, timeout=15)
        if resp.status_code in (202, 204):
            log.info('YouTube WebSub subscribe OK for %s', channel_id)
            return True
        log.warning('YouTube WebSub subscribe failed for %s: HTTP %s — %s',
                     channel_id, resp.status_code, resp.text[:200])
        return False
    except requests.RequestException as e:
        log.error('YouTube WebSub subscribe error for %s: %s', channel_id, e)
        return False


def unsubscribe_channel(channel_id, callback_url, secret=None):
    """Unsubscribe from a YouTube channel's feed via PubSubHubbub.

    Returns True if the hub accepted the request (HTTP 202/204).
    """
    try:
        data = {
            'hub.mode': 'unsubscribe',
            'hub.topic': TOPIC_TEMPLATE.format(channel_id),
            'hub.callback': callback_url,
            'hub.verify': 'async',
        }
        if secret:
            data['hub.secret'] = secret
        resp = requests.post(HUB_URL, data=data, timeout=15)
        if resp.status_code in (202, 204):
            log.info('YouTube WebSub unsubscribe OK for %s', channel_id)
            return True
        log.warning('YouTube WebSub unsubscribe failed for %s: HTTP %s',
                     channel_id, resp.status_code)
        return False
    except requests.RequestException as e:
        log.error('YouTube WebSub unsubscribe error for %s: %s', channel_id, e)
        return False


def parse_feed(feed_xml):
    """Parse a YouTube PubSubHubbub Atom feed notification.

    Returns a list of dicts: [{'video_id': ..., 'channel_id': ...}, ...]
    """
    entries = []
    try:
        root = ET.fromstring(feed_xml)
        for entry in root.findall('atom:entry', NS):
            video_el = entry.find('yt:videoId', NS)
            channel_el = entry.find('yt:channelId', NS)
            if video_el is not None and channel_el is not None:
                entries.append({
                    'video_id': video_el.text.strip(),
                    'channel_id': channel_el.text.strip(),
                })
    except ET.ParseError as e:
        log.error('Failed to parse YouTube Atom feed: %s', e)
    return entries


def check_video_is_live(video_id, api_key):
    """Check if a YouTube video is currently a live stream.

    Returns {'is_live': True, 'title': str, 'started_at': str} if live,
    or None if not live / not a stream / error.
    """
    try:
        resp = requests.get(f'{YOUTUBE_API_BASE}/videos', params={
            'part': 'snippet,liveStreamingDetails',
            'id': video_id,
            'key': api_key,
        }, timeout=10)
        resp.raise_for_status()
        items = resp.json().get('items', [])
        if not items:
            return None

        item = items[0]
        snippet = item.get('snippet', {})
        live_details = item.get('liveStreamingDetails', {})

        # Must be actively live (not premiere, not upcoming)
        if snippet.get('liveBroadcastContent') != 'live':
            return None

        # Must have started but not ended
        started_at = live_details.get('actualStartTime')
        if not started_at or live_details.get('actualEndTime'):
            return None

        return {
            'is_live': True,
            'title': snippet.get('title', ''),
            'started_at': started_at,
        }
    except requests.RequestException as e:
        log.error('YouTube API check_video_is_live error for %s: %s', video_id, e)
        return None


def check_streams_ended(video_ids, api_key):
    """Batch-check which video IDs have ended streaming.

    Queries up to 50 IDs per API call. Returns a set of video IDs that
    are no longer live (ended, deleted, or made private/unlisted).
    """
    ended = set()
    # Process in batches of 50 (YouTube API limit)
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i + 50]
        try:
            resp = requests.get(f'{YOUTUBE_API_BASE}/videos', params={
                'part': 'liveStreamingDetails,status',
                'id': ','.join(batch),
                'key': api_key,
            }, timeout=10)
            resp.raise_for_status()
            items = resp.json().get('items', [])

            # Build lookup of returned items
            found = {}
            for item in items:
                found[item['id']] = item

            for vid in batch:
                if vid not in found:
                    # Video deleted or not accessible
                    ended.add(vid)
                    continue
                item = found[vid]
                live_details = item.get('liveStreamingDetails', {})
                status = item.get('status', {})

                # Ended if actualEndTime is set
                if live_details.get('actualEndTime'):
                    ended.add(vid)
                    continue
                # Ended if made private or unlisted
                if status.get('privacyStatus') in ('private', 'unlisted'):
                    ended.add(vid)

        except requests.RequestException as e:
            log.error('YouTube API check_streams_ended error: %s', e)
            # Don't mark as ended on API error — will retry next cycle

    return ended
