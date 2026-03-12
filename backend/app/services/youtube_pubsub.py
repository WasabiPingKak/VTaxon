"""YouTube PubSubHubbub (WebSub) integration — placeholder.

# TODO: YouTube PubSubHubbub — reference code pending
# The user will provide reference implementation for:
#   - subscribe_channel(channel_id)
#   - unsubscribe_channel(channel_id)
#   - handle_notification(feed_xml)
#
# YouTube uses Atom feed notifications via PubSubHubbub hub at:
#   https://pubsubhubbub.appspot.com/
# Topic URL format:
#   https://www.youtube.com/xml/feeds/videos.xml?channel_id=CHANNEL_ID
"""

import logging

log = logging.getLogger(__name__)


def subscribe_channel(channel_id, callback_url):
    """Subscribe to YouTube channel push notifications via PubSubHubbub.

    TODO: Implement when reference code is provided.
    """
    log.warning('YouTube PubSub subscribe not yet implemented for channel %s', channel_id)


def unsubscribe_channel(channel_id, callback_url):
    """Unsubscribe from YouTube channel push notifications.

    TODO: Implement when reference code is provided.
    """
    log.warning('YouTube PubSub unsubscribe not yet implemented for channel %s', channel_id)


def handle_notification(feed_xml):
    """Parse YouTube PubSubHubbub Atom feed notification and extract video/stream info.

    TODO: Implement when reference code is provided.
    Returns None until implemented.
    """
    log.warning('YouTube PubSub notification handler not yet implemented')
    return None
