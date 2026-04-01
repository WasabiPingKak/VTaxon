"""Unit tests for the admin alert digest service."""

from datetime import UTC, datetime, timedelta
from unittest.mock import patch

from app.constants import AlertSeverity, AlertType
from app.models import AdminAlertEvent
from app.services.alerts import log_alert, send_alert_digest


class TestLogAlert:
    def test_inserts_event(self, db_session):
        log_alert(
            alert_type=AlertType.WEBSUB_RENEW_FAIL,
            severity=AlertSeverity.CRITICAL,
            title="test alert",
            context={"key": "value"},
        )
        events = AdminAlertEvent.query.all()
        assert len(events) == 1
        assert events[0].alert_type == AlertType.WEBSUB_RENEW_FAIL
        assert events[0].severity == AlertSeverity.CRITICAL
        assert events[0].title == "test alert"
        assert events[0].context == {"key": "value"}
        assert events[0].notified_at is None

    def test_does_not_raise_on_failure(self, db_session):
        with patch("app.services.alerts.db.session.begin_nested", side_effect=Exception("boom")):
            log_alert(
                alert_type=AlertType.YT_SIG_FAIL,
                severity=AlertSeverity.WARNING,
                title="should not crash",
            )
        # No exception raised, 0 events inserted
        assert AdminAlertEvent.query.count() == 0


class TestSendAlertDigest:
    def test_no_events(self, db_session):
        result = send_alert_digest()
        assert result["status"] == "no_events"

    @patch("app.services.email.send_admin_notification")
    def test_sends_digest_and_marks_notified(self, mock_send, db_session):
        log_alert(alert_type=AlertType.WEBSUB_RENEW_FAIL, severity=AlertSeverity.CRITICAL, title="fail 1")
        log_alert(alert_type=AlertType.YT_SIG_FAIL, severity=AlertSeverity.WARNING, title="sig fail")

        result = send_alert_digest()
        assert result["status"] == "sent"
        assert result["total"] == 2
        mock_send.assert_called_once()

        subject = mock_send.call_args[0][0]
        assert "1 critical" in subject
        assert "1 warning" in subject

        # All events should be marked as notified
        unnotified = AdminAlertEvent.query.filter(AdminAlertEvent.notified_at.is_(None)).count()
        assert unnotified == 0

    @patch("app.services.email.send_admin_notification")
    def test_cooldown_skips_recently_notified(self, mock_send, db_session):
        # Insert an already-notified event (recent)
        old_event = AdminAlertEvent(
            alert_type=AlertType.WEBSUB_RENEW_FAIL,
            severity=AlertSeverity.CRITICAL,
            title="old",
            notified_at=datetime.now(UTC) - timedelta(hours=1),
        )
        db_session.add(old_event)
        db_session.flush()

        # Insert a new unnotified event of the same type
        log_alert(alert_type=AlertType.WEBSUB_RENEW_FAIL, severity=AlertSeverity.CRITICAL, title="new")

        result = send_alert_digest()
        assert result["status"] == "all_cooldown"
        assert result["skipped"] == 1
        mock_send.assert_not_called()

    @patch("app.services.email.send_admin_notification")
    def test_cooldown_expired_sends(self, mock_send, db_session):
        # Insert an already-notified event (old enough)
        old_event = AdminAlertEvent(
            alert_type=AlertType.WEBSUB_RENEW_FAIL,
            severity=AlertSeverity.CRITICAL,
            title="old",
            notified_at=datetime.now(UTC) - timedelta(hours=5),
        )
        db_session.add(old_event)
        db_session.flush()

        # Insert a new unnotified event
        log_alert(alert_type=AlertType.WEBSUB_RENEW_FAIL, severity=AlertSeverity.CRITICAL, title="new")

        result = send_alert_digest()
        assert result["status"] == "sent"
        assert result["total"] == 1
        mock_send.assert_called_once()

    @patch("app.services.email.send_admin_notification")
    def test_groups_by_type_and_severity(self, mock_send, db_session):
        log_alert(alert_type=AlertType.YT_API_QUOTA, severity=AlertSeverity.CRITICAL, title="quota 1")
        log_alert(alert_type=AlertType.YT_API_QUOTA, severity=AlertSeverity.CRITICAL, title="quota 2")
        log_alert(alert_type=AlertType.TWITCH_REVOCATION, severity=AlertSeverity.WARNING, title="revoke")

        result = send_alert_digest()
        assert result["status"] == "sent"
        assert result["total"] == 3

        html_body = mock_send.call_args[0][1]
        assert "yt_api_quota" in html_body
        assert "twitch_revocation" in html_body
