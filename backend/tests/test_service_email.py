"""Unit tests for email notification service — config, sending, notify helpers."""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

# ---------------------------------------------------------------------------
# _get_config
# ---------------------------------------------------------------------------


class TestGetConfig:
    def test_returns_none_when_no_api_key(self):
        with patch.dict("os.environ", {"RESEND_API_KEY": "", "ADMIN_NOTIFY_EMAILS": "a@b.com"}):
            from app.services.email import _get_config

            assert _get_config() is None

    def test_returns_none_when_no_emails(self):
        with patch.dict("os.environ", {"RESEND_API_KEY": "re_abc123", "ADMIN_NOTIFY_EMAILS": ""}):
            from app.services.email import _get_config

            assert _get_config() is None

    def test_returns_none_when_emails_only_whitespace(self):
        with patch.dict("os.environ", {"RESEND_API_KEY": "re_abc123", "ADMIN_NOTIFY_EMAILS": "  , , "}):
            from app.services.email import _get_config

            assert _get_config() is None

    def test_returns_config_when_both_set(self):
        with patch.dict(
            "os.environ",
            {
                "RESEND_API_KEY": "re_abc123",
                "ADMIN_NOTIFY_EMAILS": "admin1@test.com, admin2@test.com",
                "EMAIL_FROM": "Test <test@vtaxon.com>",
            },
        ):
            from app.services.email import _get_config

            config = _get_config()
            assert config is not None
            assert config["api_key"] == "re_abc123"
            assert config["emails"] == ["admin1@test.com", "admin2@test.com"]
            assert config["from"] == "Test <test@vtaxon.com>"

    def test_uses_default_email_from(self):
        env = {"RESEND_API_KEY": "re_key", "ADMIN_NOTIFY_EMAILS": "a@b.com"}
        with patch.dict("os.environ", env, clear=False):
            # Remove EMAIL_FROM if present
            import os

            old = os.environ.pop("EMAIL_FROM", None)
            try:
                from app.services.email import _get_config

                config = _get_config()
                assert config is not None
                assert "VTaxon" in config["from"]
            finally:
                if old is not None:
                    os.environ["EMAIL_FROM"] = old


# ---------------------------------------------------------------------------
# send_admin_notification
# ---------------------------------------------------------------------------


class TestSendAdminNotification:
    @patch("app.services.email._get_config", return_value=None)
    def test_skips_when_no_config(self, mock_config):
        from app.services.email import send_admin_notification

        # Should not raise
        send_admin_notification("Subject", "<p>Body</p>")

    @patch("app.services.email.threading.Thread")
    @patch("app.services.email._get_config")
    def test_starts_background_thread(self, mock_config, mock_thread_cls):
        mock_config.return_value = {
            "api_key": "re_key",
            "emails": ["a@b.com"],
            "from": "VTaxon <noreply@vtaxon.com>",
        }
        mock_thread = MagicMock()
        mock_thread_cls.return_value = mock_thread

        from app.services.email import send_admin_notification

        send_admin_notification("Test Subject", "<p>Hello</p>")

        mock_thread_cls.assert_called_once()
        mock_thread.start.assert_called_once()


# ---------------------------------------------------------------------------
# notify_new_fictional_request
# ---------------------------------------------------------------------------


class TestNotifyNewFictionalRequest:
    @patch("app.services.email.send_admin_notification")
    def test_sends_notification(self, mock_send):
        from app.services.email import notify_new_fictional_request

        req = SimpleNamespace(
            name_zh="鳳凰",
            name_en="Phoenix",
            suggested_origin="東方神話",
            suggested_sub_origin="中國神話",
            description="浴火重生的神鳥",
            user=SimpleNamespace(id="user-1", display_name="TestUser"),
        )
        notify_new_fictional_request(req)
        mock_send.assert_called_once()
        subject = mock_send.call_args[0][0]
        assert "鳳凰" in subject
        html = mock_send.call_args[0][1]
        assert "Phoenix" in html

    @patch("app.services.email.send_admin_notification")
    def test_handles_no_user(self, mock_send):
        from app.services.email import notify_new_fictional_request

        req = SimpleNamespace(
            name_zh=None,
            name_en="Dragon",
            suggested_origin=None,
            suggested_sub_origin=None,
            description=None,
            user=None,
        )
        notify_new_fictional_request(req)
        mock_send.assert_called_once()
        html = mock_send.call_args[0][1]
        assert "匿名" in html


# ---------------------------------------------------------------------------
# notify_new_breed_request
# ---------------------------------------------------------------------------


class TestNotifyNewBreedRequest:
    @patch("app.services.email.send_admin_notification")
    def test_sends_notification(self, mock_send):
        from app.services.email import notify_new_breed_request

        req = SimpleNamespace(
            name_zh="金吉拉",
            name_en="Chinchilla Persian",
            taxon_id=9685,
            description="波斯貓品種",
            user=SimpleNamespace(id="user-1", display_name="CatLover"),
            species=SimpleNamespace(common_name_zh="貓", scientific_name="Felis catus"),
        )
        notify_new_breed_request(req)
        mock_send.assert_called_once()
        subject = mock_send.call_args[0][0]
        assert "金吉拉" in subject


# ---------------------------------------------------------------------------
# notify_new_report
# ---------------------------------------------------------------------------


class TestNotifyNewReport:
    @patch("app.services.email.send_admin_notification")
    def test_sends_report_notification(self, mock_send):
        from app.services.email import notify_new_report

        report = SimpleNamespace(
            report_type="not_vtuber",
            reason="This person streams as a real person",
            evidence_url="https://example.com/proof",
            reported_user_id="user-reported",
            reported_user=SimpleNamespace(display_name="FakeVtuber"),
            reporter=SimpleNamespace(id="user-reporter", display_name="Reporter"),
            reporter_id="user-reporter",
        )
        notify_new_report(report)
        mock_send.assert_called_once()
        subject = mock_send.call_args[0][0]
        assert "FakeVtuber" in subject
        html = mock_send.call_args[0][1]
        assert "非 VTuber" in html

    @patch("app.services.email.send_admin_notification")
    def test_impersonation_type_label(self, mock_send):
        from app.services.email import notify_new_report

        report = SimpleNamespace(
            report_type="impersonation",
            reason="冒充其他 VTuber",
            evidence_url=None,
            reported_user_id="user-reported",
            reported_user=SimpleNamespace(display_name="Impostor"),
            reporter=SimpleNamespace(id="user-reporter", display_name="Reporter"),
            reporter_id="user-reporter",
        )
        notify_new_report(report)
        mock_send.assert_called_once()
        subject = mock_send.call_args[0][0]
        assert "冒充" in subject
