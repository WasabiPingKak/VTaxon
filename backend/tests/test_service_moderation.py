"""Unit tests for moderation service — reports, hide user, blacklist."""

import uuid
from unittest.mock import patch

from app.constants import ReportStatus, ReportType, Visibility
from app.models import Blacklist, OAuthAccount, User, UserReport


def _make_user(session, *, role="user", display_name="TestUser"):
    uid = f"user-{uuid.uuid4().hex[:8]}"
    user = User(id=uid, display_name=display_name, role=role)
    session.add(user)
    session.commit()
    return user


def _make_report(session, reporter, reported, **kwargs):
    report = UserReport(
        reporter_id=reporter.id,
        reported_user_id=reported.id,
        report_type=kwargs.get("report_type", ReportType.IMPERSONATION),
        reason=kwargs.get("reason", "假冒本人"),
        evidence_url=kwargs.get("evidence_url"),
    )
    session.add(report)
    session.commit()
    return report


# ---------------------------------------------------------------------------
# create_report
# ---------------------------------------------------------------------------


class TestCreateReport:
    @patch("app.services.email.notify_new_report")
    def test_invalid_report_type(self, mock_email, app, db_session):
        reporter = _make_user(db_session)
        reported = _make_user(db_session, display_name="Reported")
        from app.services.moderation import create_report

        result, status = create_report(
            reporter_id=reporter.id,
            reported_user_id=reported.id,
            report_type="invalid_type",
            reason="test",
            evidence_url=None,
        )
        assert status == 400
        assert "無效" in result["error"]

    @patch("app.services.email.notify_new_report")
    def test_missing_reported_user_id(self, mock_email, app, db_session):
        reporter = _make_user(db_session)
        from app.services.moderation import create_report

        result, status = create_report(
            reporter_id=reporter.id,
            reported_user_id=None,
            report_type=ReportType.IMPERSONATION,
            reason="test",
            evidence_url=None,
        )
        assert status == 400
        assert "缺少" in result["error"]

    @patch("app.services.email.notify_new_report")
    def test_missing_reason(self, mock_email, app, db_session):
        reporter = _make_user(db_session)
        reported = _make_user(db_session, display_name="Reported")
        from app.services.moderation import create_report

        result, status = create_report(
            reporter_id=reporter.id,
            reported_user_id=reported.id,
            report_type=ReportType.IMPERSONATION,
            reason="",
            evidence_url=None,
        )
        assert status == 400
        assert "理由" in result["error"]

    @patch("app.services.email.notify_new_report")
    def test_reason_too_long(self, mock_email, app, db_session):
        reporter = _make_user(db_session)
        reported = _make_user(db_session, display_name="Reported")
        from app.services.moderation import create_report

        result, status = create_report(
            reporter_id=reporter.id,
            reported_user_id=reported.id,
            report_type=ReportType.IMPERSONATION,
            reason="x" * 2001,
            evidence_url=None,
        )
        assert status == 400
        assert "2000" in result["error"]

    @patch("app.services.email.notify_new_report")
    def test_reported_user_not_found(self, mock_email, app, db_session):
        reporter = _make_user(db_session)
        from app.services.moderation import create_report

        result, status = create_report(
            reporter_id=reporter.id,
            reported_user_id="nonexistent-id",
            report_type=ReportType.IMPERSONATION,
            reason="test reason",
            evidence_url=None,
        )
        assert status == 404
        assert "不存在" in result["error"]

    @patch("app.services.email.notify_new_report")
    def test_self_report(self, mock_email, app, db_session):
        user = _make_user(db_session)
        from app.services.moderation import create_report

        result, status = create_report(
            reporter_id=user.id,
            reported_user_id=user.id,
            report_type=ReportType.IMPERSONATION,
            reason="test reason",
            evidence_url=None,
        )
        assert status == 400
        assert "自己" in result["error"]

    @patch("app.services.email.notify_new_report")
    def test_success(self, mock_email, app, db_session):
        reporter = _make_user(db_session)
        reported = _make_user(db_session, display_name="Reported")
        from app.services.moderation import create_report

        result, status = create_report(
            reporter_id=reporter.id,
            reported_user_id=reported.id,
            report_type=ReportType.NOT_VTUBER,
            reason="Not a VTuber",
            evidence_url="https://example.com/evidence",
        )
        assert status == 201
        assert result["reporter_id"] == reporter.id
        assert result["reported_user_id"] == reported.id
        assert result["report_type"] == ReportType.NOT_VTUBER
        mock_email.assert_called_once()

        # Verify DB record
        report = db_session.get(UserReport, result["id"])
        assert report is not None
        assert report.reason == "Not a VTuber"


# ---------------------------------------------------------------------------
# update_report
# ---------------------------------------------------------------------------


class TestUpdateReport:
    @patch("app.services.notifications.create_notification")
    def test_report_not_found(self, mock_notif, app, db_session):
        from app.services.moderation import update_report

        result, status = update_report(99999, {"status": ReportStatus.INVESTIGATING})
        assert status == 404

    @patch("app.services.notifications.create_notification")
    def test_invalid_status(self, mock_notif, app, db_session):
        reporter = _make_user(db_session)
        reported = _make_user(db_session, display_name="Reported")
        report = _make_report(db_session, reporter, reported)
        from app.services.moderation import update_report

        result, status = update_report(report.id, {"status": "invalid_status"})
        assert status == 400
        assert "Invalid status" in result["error"]

    @patch("app.services.notifications.create_notification")
    def test_valid_status_update(self, mock_notif, app, db_session):
        reporter = _make_user(db_session)
        reported = _make_user(db_session, display_name="Reported")
        report = _make_report(db_session, reporter, reported)
        from app.services.moderation import update_report

        result, status = update_report(report.id, {"status": ReportStatus.INVESTIGATING})
        assert status == 200
        assert result["status"] == ReportStatus.INVESTIGATING
        mock_notif.assert_called_once()

    @patch("app.services.notifications.create_notification")
    def test_update_admin_note(self, mock_notif, app, db_session):
        reporter = _make_user(db_session)
        reported = _make_user(db_session, display_name="Reported")
        report = _make_report(db_session, reporter, reported)
        from app.services.moderation import update_report

        result, status = update_report(report.id, {"admin_note": "看過了，需要更多證據"})
        assert status == 200
        assert result["admin_note"] == "看過了，需要更多證據"
        # No status change → no notification
        mock_notif.assert_not_called()


# ---------------------------------------------------------------------------
# hide_user
# ---------------------------------------------------------------------------


class TestHideUser:
    @patch("app.services.moderation.invalidate_fictional_tree_cache")
    @patch("app.services.moderation.invalidate_tree_cache")
    @patch("app.services.notifications.create_notification")
    def test_report_not_found(self, mock_notif, mock_tree, mock_ftree, app, db_session):
        from app.services.moderation import hide_user

        result, status = hide_user(99999, "admin-id", {})
        assert status == 404

    @patch("app.services.moderation.invalidate_fictional_tree_cache")
    @patch("app.services.moderation.invalidate_tree_cache")
    @patch("app.services.notifications.create_notification")
    def test_hide_success(self, mock_notif, mock_tree, mock_ftree, app, db_session):
        reporter = _make_user(db_session)
        reported = _make_user(db_session, display_name="BadUser")
        admin = _make_user(db_session, role="admin", display_name="Admin")
        report = _make_report(db_session, reporter, reported)
        from app.services.moderation import hide_user

        result, status = hide_user(report.id, admin.id, {"reason": "非 VTuber"})
        assert status == 200
        assert result["ok"] is True
        assert result["visibility"] == Visibility.HIDDEN

        # Verify DB state
        db_session.refresh(reported)
        assert reported.visibility == Visibility.HIDDEN
        assert reported.visibility_reason == "非 VTuber"
        assert reported.visibility_changed_by == admin.id

        db_session.refresh(report)
        assert report.status == ReportStatus.CONFIRMED

        mock_notif.assert_called_once()
        mock_tree.assert_called_once()
        mock_ftree.assert_called_once()


# ---------------------------------------------------------------------------
# blacklist_preview
# ---------------------------------------------------------------------------


class TestBlacklistPreview:
    def test_report_not_found(self, app, db_session):
        from app.services.moderation import blacklist_preview

        result, status = blacklist_preview(99999)
        assert status == 404

    def test_returns_identifiers(self, app, db_session):
        reporter = _make_user(db_session)
        reported = _make_user(db_session, display_name="Target")
        # Add OAuth accounts to the reported user
        acct = OAuthAccount(
            user_id=reported.id,
            provider="youtube",
            provider_account_id="YT-12345",
            provider_display_name="TargetCh",
            channel_url="https://youtube.com/c/target",
        )
        db_session.add(acct)
        db_session.commit()

        report = _make_report(db_session, reporter, reported)
        from app.services.moderation import blacklist_preview

        result, status = blacklist_preview(report.id)
        assert status == 200
        assert len(result["identifiers"]) == 1
        ident = result["identifiers"][0]
        assert ident["provider"] == "youtube"
        assert ident["provider_account_id"] == "YT-12345"
        assert ident["already_banned"] is False


# ---------------------------------------------------------------------------
# delete_blacklist_entry
# ---------------------------------------------------------------------------


class TestDeleteBlacklistEntry:
    def test_not_found(self, app, db_session):
        from app.services.moderation import delete_blacklist_entry

        result, status = delete_blacklist_entry(99999)
        assert status == 404

    def test_success(self, app, db_session):
        user = _make_user(db_session)
        admin = _make_user(db_session, role="admin", display_name="Admin")
        entry = Blacklist(
            identifier_type="youtube",
            identifier_value="YT-BAN-001",
            user_id=user.id,
            reason="spam",
            banned_by=admin.id,
        )
        db_session.add(entry)
        db_session.commit()
        entry_id = entry.id

        from app.services.moderation import delete_blacklist_entry

        result, status = delete_blacklist_entry(entry_id)
        assert status == 200
        assert result["ok"] is True
        assert db_session.get(Blacklist, entry_id) is None
