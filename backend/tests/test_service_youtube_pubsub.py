"""Unit tests for youtube_pubsub service — signature, channel extraction, sub/unsub, feed parsing, live checks."""

import hashlib
import hmac
from unittest.mock import MagicMock, patch

import requests

from app.services.youtube_pubsub import (
    check_streams_ended,
    check_video_is_live,
    extract_channel_id,
    parse_feed,
    subscribe_channel,
    unsubscribe_channel,
    verify_hub_signature,
)

SAMPLE_FEED_XML = """\
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"
      xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <yt:videoId>dQw4w9WgXcQ</yt:videoId>
    <yt:channelId>UCuAXFkgsw1L7xaCfnd5JJOw</yt:channelId>
  </entry>
  <entry>
    <yt:videoId>abc123def45</yt:videoId>
    <yt:channelId>UCuAXFkgsw1L7xaCfnd5JJOw</yt:channelId>
  </entry>
</feed>
"""


# ---------------------------------------------------------------------------
# verify_hub_signature — HMAC-SHA1
# ---------------------------------------------------------------------------


class TestVerifyHubSignature:
    def _make_sig(self, secret, body):
        digest = hmac.new(secret.encode(), body.encode(), hashlib.sha1).hexdigest()
        return f"sha1={digest}"

    def test_valid_signature(self):
        secret = "hub_secret"
        body = "<feed>data</feed>"
        sig = self._make_sig(secret, body)

        assert verify_hub_signature(secret, sig, body) is True

    def test_invalid_signature(self):
        assert verify_hub_signature("secret", "sha1=wrong", "body") is False

    def test_empty_signature_header(self):
        assert verify_hub_signature("secret", "", "body") is False

    def test_none_signature_header(self):
        assert verify_hub_signature("secret", None, "body") is False

    def test_malformed_no_equals(self):
        assert verify_hub_signature("secret", "sha1", "body") is False

    def test_wrong_algorithm_prefix(self):
        assert verify_hub_signature("secret", "sha256=abcdef", "body") is False


# ---------------------------------------------------------------------------
# extract_channel_id
# ---------------------------------------------------------------------------


class TestExtractChannelId:
    def test_standard_url(self):
        url = "https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw"
        assert extract_channel_id(url) == "UCuAXFkgsw1L7xaCfnd5JJOw"

    def test_without_www(self):
        url = "https://youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw"
        assert extract_channel_id(url) == "UCuAXFkgsw1L7xaCfnd5JJOw"

    def test_non_channel_url(self):
        assert extract_channel_id("https://www.youtube.com/@SomeUser") is None

    def test_empty_string(self):
        assert extract_channel_id("") is None

    def test_none_input(self):
        assert extract_channel_id(None) is None

    def test_unrelated_url(self):
        assert extract_channel_id("https://twitch.tv/someone") is None


# ---------------------------------------------------------------------------
# subscribe_channel / unsubscribe_channel
# ---------------------------------------------------------------------------


class TestSubscribeChannel:
    @patch("app.services.youtube_pubsub.requests.post")
    def test_success_202(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 202
        mock_post.return_value = mock_resp

        assert subscribe_channel("UC123", "https://example.com/cb") is True

    @patch("app.services.youtube_pubsub.requests.post")
    def test_success_204(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 204
        mock_post.return_value = mock_resp

        assert subscribe_channel("UC123", "https://example.com/cb", secret="s") is True

    @patch("app.services.youtube_pubsub.requests.post")
    def test_failure_400(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 400
        mock_resp.text = "Bad Request"
        mock_post.return_value = mock_resp

        assert subscribe_channel("UC123", "https://example.com/cb") is False

    @patch("app.services.youtube_pubsub.requests.post")
    def test_request_exception(self, mock_post):
        mock_post.side_effect = requests.RequestException("Network error")

        assert subscribe_channel("UC123", "https://example.com/cb") is False


class TestUnsubscribeChannel:
    @patch("app.services.youtube_pubsub.requests.post")
    def test_success_202(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 202
        mock_post.return_value = mock_resp

        assert unsubscribe_channel("UC123", "https://example.com/cb") is True

    @patch("app.services.youtube_pubsub.requests.post")
    def test_failure_500(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_post.return_value = mock_resp

        assert unsubscribe_channel("UC123", "https://example.com/cb") is False

    @patch("app.services.youtube_pubsub.requests.post")
    def test_request_exception(self, mock_post):
        mock_post.side_effect = requests.RequestException("timeout")

        assert unsubscribe_channel("UC123", "https://example.com/cb") is False


# ---------------------------------------------------------------------------
# parse_feed — Atom XML parsing
# ---------------------------------------------------------------------------


class TestParseFeed:
    def test_parses_entries(self):
        result = parse_feed(SAMPLE_FEED_XML)

        assert len(result) == 2
        assert result[0]["video_id"] == "dQw4w9WgXcQ"
        assert result[0]["channel_id"] == "UCuAXFkgsw1L7xaCfnd5JJOw"
        assert result[1]["video_id"] == "abc123def45"

    def test_empty_feed(self):
        xml = '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>'
        assert parse_feed(xml) == []

    def test_invalid_xml(self):
        assert parse_feed("not xml at all") == []

    def test_missing_video_id(self):
        xml = """\
<?xml version="1.0"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"
      xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <yt:channelId>UCxxx</yt:channelId>
  </entry>
</feed>
"""
        assert parse_feed(xml) == []


# ---------------------------------------------------------------------------
# check_video_is_live — YouTube Data API
# ---------------------------------------------------------------------------


class TestCheckVideoIsLive:
    @patch("app.services.youtube_pubsub.requests.get")
    def test_live_video(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "items": [
                {
                    "snippet": {
                        "liveBroadcastContent": "live",
                        "title": "Live Stream!",
                    },
                    "liveStreamingDetails": {
                        "actualStartTime": "2026-01-01T00:00:00Z",
                    },
                }
            ]
        }
        mock_get.return_value = mock_resp

        result = check_video_is_live("vid1", "api_key")

        assert result["is_live"] is True
        assert result["title"] == "Live Stream!"
        assert result["started_at"] == "2026-01-01T00:00:00Z"

    @patch("app.services.youtube_pubsub.requests.get")
    def test_not_live(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "items": [
                {
                    "snippet": {"liveBroadcastContent": "none"},
                    "liveStreamingDetails": {},
                }
            ]
        }
        mock_get.return_value = mock_resp

        assert check_video_is_live("vid1", "api_key") is None

    @patch("app.services.youtube_pubsub.requests.get")
    def test_ended_stream(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "items": [
                {
                    "snippet": {"liveBroadcastContent": "live"},
                    "liveStreamingDetails": {
                        "actualStartTime": "2026-01-01T00:00:00Z",
                        "actualEndTime": "2026-01-01T02:00:00Z",
                    },
                }
            ]
        }
        mock_get.return_value = mock_resp

        assert check_video_is_live("vid1", "api_key") is None

    @patch("app.services.youtube_pubsub.requests.get")
    def test_no_items(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"items": []}
        mock_get.return_value = mock_resp

        assert check_video_is_live("vid1", "api_key") is None

    @patch("app.services.youtube_pubsub.requests.get")
    def test_api_error(self, mock_get):
        mock_get.side_effect = requests.RequestException("quota exceeded")

        assert check_video_is_live("vid1", "api_key") is None

    @patch("app.services.youtube_pubsub.requests.get")
    def test_no_start_time(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "items": [
                {
                    "snippet": {"liveBroadcastContent": "live"},
                    "liveStreamingDetails": {},
                }
            ]
        }
        mock_get.return_value = mock_resp

        assert check_video_is_live("vid1", "api_key") is None


# ---------------------------------------------------------------------------
# check_streams_ended — batch check
# ---------------------------------------------------------------------------


class TestCheckStreamsEnded:
    @patch("app.services.youtube_pubsub.requests.get")
    def test_ended_by_end_time(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "items": [
                {
                    "id": "vid1",
                    "liveStreamingDetails": {"actualEndTime": "2026-01-01T02:00:00Z"},
                    "status": {"privacyStatus": "public"},
                }
            ]
        }
        mock_get.return_value = mock_resp

        result = check_streams_ended(["vid1"], "api_key")

        assert "vid1" in result

    @patch("app.services.youtube_pubsub.requests.get")
    def test_not_found_marks_ended(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"items": []}
        mock_get.return_value = mock_resp

        result = check_streams_ended(["vid_missing"], "api_key")

        assert "vid_missing" in result

    @patch("app.services.youtube_pubsub.requests.get")
    def test_private_marks_ended(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "items": [
                {
                    "id": "vid1",
                    "liveStreamingDetails": {},
                    "status": {"privacyStatus": "private"},
                }
            ]
        }
        mock_get.return_value = mock_resp

        result = check_streams_ended(["vid1"], "api_key")

        assert "vid1" in result

    @patch("app.services.youtube_pubsub.requests.get")
    def test_still_live_not_ended(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "items": [
                {
                    "id": "vid1",
                    "liveStreamingDetails": {"actualStartTime": "2026-01-01T00:00:00Z"},
                    "status": {"privacyStatus": "public"},
                }
            ]
        }
        mock_get.return_value = mock_resp

        result = check_streams_ended(["vid1"], "api_key")

        assert "vid1" not in result

    @patch("app.services.youtube_pubsub.requests.get")
    def test_api_error_does_not_mark_ended(self, mock_get):
        mock_get.side_effect = requests.RequestException("API down")

        result = check_streams_ended(["vid1", "vid2"], "api_key")

        assert result == set()

    @patch("app.services.youtube_pubsub.requests.get")
    def test_unlisted_marks_ended(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "items": [
                {
                    "id": "vid1",
                    "liveStreamingDetails": {},
                    "status": {"privacyStatus": "unlisted"},
                }
            ]
        }
        mock_get.return_value = mock_resp

        result = check_streams_ended(["vid1"], "api_key")

        assert "vid1" in result

    @patch("app.services.youtube_pubsub.requests.get")
    def test_empty_input(self, mock_get):
        result = check_streams_ended([], "api_key")

        assert result == set()
        mock_get.assert_not_called()
