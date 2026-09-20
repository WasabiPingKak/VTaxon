"""Unit tests for app.services.subscriptions — public helpers."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import requests

from app.models import OAuthAccount, User

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ENV_TWITCH = {
    "TWITCH_CLIENT_ID": "cid",
    "TWITCH_CLIENT_SECRET": "csec",
    "TWITCH_WEBHOOK_SECRET": "wsec",
    "WEBHOOK_BASE_URL": "https://api.test",
}

ENV_YOUTUBE = {
    "WEBHOOK_BASE_URL": "https://api.test",
    "CRON_SECRET": "secret",
}


def _make_user(db_session, provider="twitch", channel_url=None, provider_account_id=None):
    uid = f"user-{uuid.uuid4().hex[:8]}"
    u = User(id=uid, display_name="Sub Test", role="user")
    db_session.add(u)
    db_session.flush()
    pid = provider_account_id or f"pid-{uuid.uuid4().hex[:6]}"
    acct = OAuthAccount(
        user_id=uid,
        provider=provider,
        provider_account_id=pid,
        channel_url=channel_url
        or (f"https://twitch.tv/{pid}" if provider == "twitch" else f"https://www.youtube.com/channel/UC{pid}"),
    )
    db_session.add(acct)
    db_session.flush()
    return u, acct


# ---------------------------------------------------------------------------
# subscribe_twitch_user
# ---------------------------------------------------------------------------


class TestSubscribeTwitchUser:
    @patch("app.services.twitch.create_eventsub_subscription")
    def test_creates_two_subs(self, mock_create, app, db_session):
        _, acct = _make_user(db_session, provider="twitch", provider_account_id="twitch-001")
        with patch.dict("os.environ", ENV_TWITCH):
            from app.services.subscriptions import subscribe_twitch_user

            subscribe_twitch_user("twitch-001", oauth_account=acct)
        assert mock_create.call_count == 2
        event_types = {call.args[3] for call in mock_create.call_args_list}
        assert event_types == {"stream.online", "stream.offline"}
        db_session.refresh(acct)
        assert acct.live_sub_status == "subscribed"

    @patch("app.services.twitch.create_eventsub_subscription", side_effect=requests.RequestException("API error"))
    def test_partial_failure(self, mock_create, app, db_session):
        _, acct = _make_user(db_session, provider="twitch", provider_account_id="twitch-002")
        with patch.dict("os.environ", ENV_TWITCH):
            from app.services.subscriptions import subscribe_twitch_user

            subscribe_twitch_user("twitch-002", oauth_account=acct)
        db_session.refresh(acct)
        assert acct.live_sub_status == "failed"

    def test_no_config_marks_failed(self, app, db_session):
        _, acct = _make_user(db_session, provider="twitch", provider_account_id="twitch-003")
        with patch.dict("os.environ", {"TWITCH_CLIENT_ID": "", "TWITCH_CLIENT_SECRET": ""}):
            from app.services.subscriptions import subscribe_twitch_user

            subscribe_twitch_user("twitch-003", oauth_account=acct)
        db_session.refresh(acct)
        assert acct.live_sub_status == "failed"


# ---------------------------------------------------------------------------
# unsubscribe_twitch_user
# ---------------------------------------------------------------------------


class TestUnsubscribeTwitchUser:
    @patch("app.services.twitch.delete_eventsub_subscription")
    @patch(
        "app.services.twitch.list_eventsub_subscriptions",
        return_value=[
            {"id": "sub-1", "condition": {"broadcaster_user_id": "twitch-010"}},
            {"id": "sub-2", "condition": {"broadcaster_user_id": "twitch-010"}},
            {"id": "sub-3", "condition": {"broadcaster_user_id": "other"}},
        ],
    )
    def test_deletes_matching_subs(self, mock_list, mock_delete, app, db_session):
        with patch.dict("os.environ", {"TWITCH_CLIENT_ID": "cid", "TWITCH_CLIENT_SECRET": "csec"}):
            from app.services.subscriptions import unsubscribe_twitch_user

            unsubscribe_twitch_user("twitch-010")
        assert mock_delete.call_count == 2
        deleted_ids = {call.args[2] for call in mock_delete.call_args_list}
        assert deleted_ids == {"sub-1", "sub-2"}

    def test_no_config_returns_silently(self, app):
        with patch.dict("os.environ", {"TWITCH_CLIENT_ID": "", "TWITCH_CLIENT_SECRET": ""}):
            from app.services.subscriptions import unsubscribe_twitch_user

            unsubscribe_twitch_user("twitch-020")  # should not raise


# ---------------------------------------------------------------------------
# subscribe_youtube_user
# ---------------------------------------------------------------------------


class TestSubscribeYoutubeUser:
    @patch("app.services.youtube_pubsub.subscribe_channel", return_value="subscribed")
    def test_subscribes_successfully(self, mock_sub, app, db_session):
        _, acct = _make_user(
            db_session,
            provider="youtube",
            channel_url="https://www.youtube.com/channel/UCtest123",
        )
        with patch.dict("os.environ", ENV_YOUTUBE):
            from app.services.subscriptions import subscribe_youtube_user

            subscribe_youtube_user("https://www.youtube.com/channel/UCtest123", oauth_account=acct)
        mock_sub.assert_called_once()
        db_session.refresh(acct)
        assert acct.live_sub_status == "subscribed"

    @patch("app.services.youtube_pubsub.subscribe_channel", return_value="failed")
    def test_subscribe_failure(self, mock_sub, app, db_session):
        _, acct = _make_user(
            db_session,
            provider="youtube",
            channel_url="https://www.youtube.com/channel/UCfail",
        )
        with patch.dict("os.environ", ENV_YOUTUBE):
            from app.services.subscriptions import subscribe_youtube_user

            subscribe_youtube_user("https://www.youtube.com/channel/UCfail", oauth_account=acct)
        db_session.refresh(acct)
        assert acct.live_sub_status == "failed"

    def test_no_webhook_url_marks_failed(self, app, db_session):
        _, acct = _make_user(
            db_session,
            provider="youtube",
            channel_url="https://www.youtube.com/channel/UCtest",
        )
        with patch.dict("os.environ", {"WEBHOOK_BASE_URL": ""}):
            from app.services.subscriptions import subscribe_youtube_user

            subscribe_youtube_user("https://www.youtube.com/channel/UCtest", oauth_account=acct)
        db_session.refresh(acct)
        assert acct.live_sub_status == "failed"

    def test_no_channel_id_marks_failed(self, app, db_session):
        _, acct = _make_user(
            db_session,
            provider="youtube",
            channel_url="https://www.youtube.com/@handle",  # no /channel/UC...
        )
        with patch.dict("os.environ", ENV_YOUTUBE):
            from app.services.subscriptions import subscribe_youtube_user

            subscribe_youtube_user("https://www.youtube.com/@handle", oauth_account=acct)
        db_session.refresh(acct)
        assert acct.live_sub_status == "failed"

    @patch("app.services.youtube_pubsub.subscribe_channel", return_value="pending")
    def test_read_timeout_marks_pending(self, mock_sub, app, db_session):
        _, acct = _make_user(
            db_session,
            provider="youtube",
            channel_url="https://www.youtube.com/channel/UCslow",
        )
        with patch.dict("os.environ", ENV_YOUTUBE):
            from app.services.subscriptions import subscribe_youtube_user

            subscribe_youtube_user("https://www.youtube.com/channel/UCslow", oauth_account=acct)
        db_session.refresh(acct)
        assert acct.live_sub_status == "pending"
        assert acct.live_sub_at is not None


# ---------------------------------------------------------------------------
# youtube_subscribe_one
# ---------------------------------------------------------------------------


class TestYoutubeSubscribeOne:
    def _run(self, channel_id):
        with patch.dict("os.environ", ENV_YOUTUBE):
            from app.services.subscriptions import youtube_subscribe_one

            return youtube_subscribe_one(channel_id)

    @patch("app.services.youtube_pubsub.subscribe_channel", return_value="subscribed")
    def test_subscribed_returns_200(self, mock_sub, app, db_session):
        _, acct = _make_user(db_session, provider="youtube", channel_url="https://www.youtube.com/channel/UCone")
        result, status = self._run("UCone")
        assert status == 200
        assert result == {"channel_id": "UCone", "status": "subscribed"}
        db_session.refresh(acct)
        assert acct.live_sub_status == "subscribed"

    @patch("app.services.youtube_pubsub.subscribe_channel", return_value="failed")
    def test_failed_returns_500_for_retry(self, mock_sub, app, db_session):
        _, acct = _make_user(db_session, provider="youtube", channel_url="https://www.youtube.com/channel/UCone")
        result, status = self._run("UCone")
        assert status == 500
        assert result["status"] == "failed"
        db_session.refresh(acct)
        assert acct.live_sub_status == "failed"

    @patch("app.services.youtube_pubsub.subscribe_channel", return_value="pending")
    def test_pending_returns_200_so_cloud_tasks_does_not_retry(self, mock_sub, app, db_session):
        _, acct = _make_user(db_session, provider="youtube", channel_url="https://www.youtube.com/channel/UCone")
        result, status = self._run("UCone")
        assert status == 200
        assert result["status"] == "pending"
        db_session.refresh(acct)
        assert acct.live_sub_status == "pending"

    def test_pending_does_not_overwrite_verification_that_arrived_meanwhile(self, app, db_session):
        """hub 很慢時，驗證請求可能在訂閱請求逾時之前就到了，不能再被 pending 蓋掉。"""
        from app.services.subscriptions import confirm_youtube_subscription

        _, acct = _make_user(db_session, provider="youtube", channel_url="https://www.youtube.com/channel/UCrace")
        acct.live_sub_status = "failed"
        db_session.commit()

        def _slow_hub(channel_id, callback_url, secret=None):
            confirm_youtube_subscription(channel_id)
            return "pending"

        with patch("app.services.youtube_pubsub.subscribe_channel", side_effect=_slow_hub):
            result, status = self._run("UCrace")
        assert status == 200
        db_session.refresh(acct)
        assert acct.live_sub_status == "subscribed"

    def test_pending_overwrites_confirmation_from_earlier_round(self, app, db_session):
        """上一輪的 subscribed 不算數：這一輪沒得到確認就是 pending。"""
        _, acct = _make_user(db_session, provider="youtube", channel_url="https://www.youtube.com/channel/UCold")
        acct.live_sub_status = "subscribed"
        acct.live_sub_at = datetime.now(UTC) - timedelta(days=1)
        db_session.commit()

        with patch("app.services.youtube_pubsub.subscribe_channel", return_value="pending"):
            self._run("UCold")
        db_session.refresh(acct)
        assert acct.live_sub_status == "pending"


# ---------------------------------------------------------------------------
# confirm_youtube_subscription
# ---------------------------------------------------------------------------


class TestConfirmYoutubeSubscription:
    def test_flips_pending_to_subscribed(self, app, db_session):
        from app.services.subscriptions import confirm_youtube_subscription

        _, acct = _make_user(db_session, provider="youtube", channel_url="https://www.youtube.com/channel/UCconfirm")
        acct.live_sub_status = "pending"
        db_session.commit()

        assert confirm_youtube_subscription("UCconfirm") is True
        db_session.refresh(acct)
        assert acct.live_sub_status == "subscribed"
        assert acct.live_sub_at is not None

    def test_unknown_channel_returns_false(self, app, db_session):
        from app.services.subscriptions import confirm_youtube_subscription

        assert confirm_youtube_subscription("UCnobody") is False

    def test_does_not_decrypt_tokens(self, app, db_session):
        """hub 在等 challenge，確認訂閱不能為了改狀態去打 KMS 解密 token。"""
        from app.services.subscriptions import confirm_youtube_subscription

        _, acct = _make_user(db_session, provider="youtube", channel_url="https://www.youtube.com/channel/UCnokms")
        acct.access_token = "token"
        acct.refresh_token = "refresh"
        db_session.commit()

        with patch("app.utils.encrypted_type.kms_decrypt") as mock_decrypt:
            assert confirm_youtube_subscription("UCnokms") is True
        mock_decrypt.assert_not_called()


# ---------------------------------------------------------------------------
# youtube_check_sub_health
# ---------------------------------------------------------------------------


class TestYoutubeCheckSubHealth:
    def _accounts(self, db_session, count, status, age):
        for _ in range(count):
            _, acct = _make_user(db_session, provider="youtube")
            acct.live_sub_status = status
            acct.live_sub_at = datetime.now(UTC) - age if age is not None else None
        db_session.commit()

    def _alerts(self):
        from app.models import AdminAlertEvent

        return AdminAlertEvent.query.filter_by(alert_type="websub_renew_fail").all()

    def test_all_healthy_no_alert(self, app, db_session):
        from app.services.subscriptions import youtube_check_sub_health

        self._accounts(db_session, 10, "subscribed", timedelta(hours=5))
        result = youtube_check_sub_health()
        assert result["total"] == 10
        assert result["unhealthy"] == 0
        assert self._alerts() == []

    def test_mass_failure_logs_critical(self, app, db_session):
        from app.services.subscriptions import youtube_check_sub_health

        self._accounts(db_session, 4, "subscribed", timedelta(hours=5))
        self._accounts(db_session, 6, "failed", timedelta(hours=1))
        result = youtube_check_sub_health()
        assert result["failed"] == 6
        assert result["unhealthy"] == 6
        alerts = self._alerts()
        assert len(alerts) == 1
        assert alerts[0].severity == "critical"
        assert alerts[0].context["mode"] == "health_check"

    def test_partial_failure_logs_warning(self, app, db_session):
        from app.services.subscriptions import youtube_check_sub_health

        self._accounts(db_session, 15, "subscribed", timedelta(hours=5))
        self._accounts(db_session, 5, "failed", timedelta(hours=1))
        youtube_check_sub_health()
        alerts = self._alerts()
        assert len(alerts) == 1
        assert alerts[0].severity == "warning"

    def test_recent_pending_is_within_grace(self, app, db_session):
        """剛送出、還在等 hub 驗證的 pending 不算異常。"""
        from app.services.subscriptions import youtube_check_sub_health

        self._accounts(db_session, 10, "pending", timedelta(hours=1))
        result = youtube_check_sub_health()
        assert result["unhealthy"] == 0
        assert self._alerts() == []

    def test_long_pending_counts_as_unconfirmed(self, app, db_session):
        from app.services.subscriptions import youtube_check_sub_health

        self._accounts(db_session, 10, "pending", timedelta(hours=7))
        result = youtube_check_sub_health()
        assert result["unconfirmed"] == 10
        assert len(self._alerts()) == 1

    def test_never_or_long_ago_attempted_counts_as_stale(self, app, db_session):
        """subscribed 但太久沒有任何訂閱嘗試，代表續訂根本沒跑到。"""
        from app.services.subscriptions import youtube_check_sub_health

        self._accounts(db_session, 3, "subscribed", timedelta(days=4))
        self._accounts(db_session, 3, None, None)
        result = youtube_check_sub_health()
        assert result["stale"] == 6
        assert len(self._alerts()) == 1

    def test_few_failures_below_minimum_no_alert(self, app, db_session):
        """零星幾個頻道失敗不發告警，避免小樣本下比例失真。"""
        from app.services.subscriptions import youtube_check_sub_health

        self._accounts(db_session, 2, "subscribed", timedelta(hours=5))
        self._accounts(db_session, 4, "failed", timedelta(hours=1))
        result = youtube_check_sub_health()
        assert result["unhealthy"] == 4
        assert self._alerts() == []

    def test_does_not_decrypt_tokens(self, app, db_session):
        """每小時跑一次，不能每個帳號都打 KMS 解密 token。"""
        from app.services.subscriptions import youtube_check_sub_health

        for _ in range(3):
            _, acct = _make_user(db_session, provider="youtube")
            acct.access_token = "token"
            acct.refresh_token = "refresh"
        db_session.commit()

        with patch("app.utils.encrypted_type.kms_decrypt") as mock_decrypt:
            result = youtube_check_sub_health()
        assert result["total"] == 3
        mock_decrypt.assert_not_called()

    def test_accounts_without_channel_id_are_ignored(self, app, db_session):
        from app.services.subscriptions import youtube_check_sub_health

        for i in range(6):
            _make_user(db_session, provider="youtube", channel_url=f"https://www.youtube.com/@handle{i}")
        db_session.commit()
        result = youtube_check_sub_health()
        assert result["total"] == 0
        assert self._alerts() == []


# ---------------------------------------------------------------------------
# unsubscribe_youtube_user
# ---------------------------------------------------------------------------


class TestUnsubscribeYoutubeUser:
    @patch("app.services.youtube_pubsub.unsubscribe_channel")
    def test_unsubscribes(self, mock_unsub, app):
        with patch.dict("os.environ", ENV_YOUTUBE):
            from app.services.subscriptions import unsubscribe_youtube_user

            unsubscribe_youtube_user("https://www.youtube.com/channel/UCtest123")
        mock_unsub.assert_called_once()
        assert "UCtest123" in mock_unsub.call_args.args[0]

    def test_no_webhook_url_returns_silently(self, app):
        with patch.dict("os.environ", {"WEBHOOK_BASE_URL": ""}):
            from app.services.subscriptions import unsubscribe_youtube_user

            unsubscribe_youtube_user("https://www.youtube.com/channel/UCtest")

    def test_no_channel_id_returns_silently(self, app):
        with patch.dict("os.environ", ENV_YOUTUBE):
            from app.services.subscriptions import unsubscribe_youtube_user

            unsubscribe_youtube_user("https://www.youtube.com/@handle")
