"""Route integration tests for /api/reports — report flow, admin review, ban."""

import sys
from unittest.mock import MagicMock, patch

import pytest

# Stub 'resend' module which may not be installed in test environment
if "resend" not in sys.modules:
    sys.modules["resend"] = MagicMock()

from app.models import Blacklist, OAuthAccount, User, UserReport


@pytest.fixture(autouse=True)
def _mock_email_and_notifications():
    """Mock external services used by reports routes."""
    with (
        patch("app.services.moderation.notify_new_report", create=True),
        patch("app.services.email.notify_new_report", create=True),
        patch("app.services.moderation.create_notification", create=True),
    ):
        yield


# ---------------------------------------------------------------------------
# POST /api/reports — Create report
# ---------------------------------------------------------------------------


class TestCreateReport:
    def test_anonymous_report(self, client, db_session, sample_user):
        """Anonymous users can submit reports."""
        resp = client.post(
            "/api/reports",
            json={
                "reported_user_id": sample_user.id,
                "report_type": "impersonation",
                "reason": "This person is impersonating another VTuber.",
            },
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["reported_user_id"] == sample_user.id
        assert data["status"] == "pending"
        assert data["reporter_id"] is None

    def test_authenticated_report(self, client, db_session, sample_user):
        target = User(id="user-target", display_name="Target", role="user")
        db_session.add(target)
        db_session.commit()

        with patch("app.routes.reports.get_current_user", return_value=sample_user.id):
            resp = client.post(
                "/api/reports",
                json={
                    "reported_user_id": target.id,
                    "report_type": "not_vtuber",
                    "reason": "This is a real person, not a VTuber.",
                },
            )
        assert resp.status_code == 201
        assert resp.get_json()["reporter_id"] == sample_user.id

    def test_report_invalid_type(self, client, db_session, sample_user):
        resp = client.post(
            "/api/reports",
            json={
                "reported_user_id": sample_user.id,
                "report_type": "spam",
                "reason": "test",
            },
        )
        assert resp.status_code == 400

    def test_report_missing_reason(self, client, db_session, sample_user):
        resp = client.post(
            "/api/reports",
            json={
                "reported_user_id": sample_user.id,
                "report_type": "impersonation",
            },
        )
        assert resp.status_code == 400

    def test_report_nonexistent_user(self, client, db_session):
        resp = client.post(
            "/api/reports",
            json={
                "reported_user_id": "ghost-user-id",
                "report_type": "impersonation",
                "reason": "test",
            },
        )
        assert resp.status_code == 404

    def test_cannot_report_self(self, client, db_session, sample_user):
        with patch("app.routes.reports.get_current_user", return_value=sample_user.id):
            resp = client.post(
                "/api/reports",
                json={
                    "reported_user_id": sample_user.id,
                    "report_type": "impersonation",
                    "reason": "self report",
                },
            )
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# GET /api/reports — List (admin only)
# ---------------------------------------------------------------------------


class TestListReports:
    def test_list_requires_admin(self, client, db_session, sample_user, mock_auth):
        with mock_auth(sample_user.id):
            resp = client.get("/api/reports")
        assert resp.status_code == 403

    def test_list_reports_as_admin(self, client, db_session, admin_user, sample_user, mock_auth):
        report = UserReport(
            reporter_id=None,
            reported_user_id=sample_user.id,
            report_type="impersonation",
            reason="test",
        )
        db_session.add(report)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.get("/api/reports?status=pending")
        assert resp.status_code == 200
        reports = resp.get_json()["reports"]
        assert len(reports) >= 1


# ---------------------------------------------------------------------------
# PATCH /api/reports/<id> — Update status (admin only)
# ---------------------------------------------------------------------------


class TestUpdateReport:
    def test_update_report_status(self, client, db_session, admin_user, sample_user, mock_auth):
        report = UserReport(
            reporter_id=None,
            reported_user_id=sample_user.id,
            report_type="impersonation",
            reason="test",
        )
        db_session.add(report)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.patch(
                f"/api/reports/{report.id}",
                json={
                    "status": "investigating",
                    "admin_note": "Looking into it",
                },
            )
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "investigating"

    def test_update_report_invalid_status(self, client, db_session, admin_user, sample_user, mock_auth):
        report = UserReport(
            reporter_id=None,
            reported_user_id=sample_user.id,
            report_type="impersonation",
            reason="test",
        )
        db_session.add(report)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.patch(
                f"/api/reports/{report.id}",
                json={
                    "status": "invalid_status",
                },
            )
        assert resp.status_code == 400

    def test_update_nonexistent_report(self, client, db_session, admin_user, mock_auth):
        with mock_auth(admin_user.id):
            resp = client.patch(
                "/api/reports/99999",
                json={
                    "status": "dismissed",
                },
            )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/reports/<id>/hide — Shadow ban (admin only)
# ---------------------------------------------------------------------------


class TestHideUser:
    def test_hide_user(self, client, db_session, admin_user, mock_auth):
        target = User(id="user-hide-target", display_name="HideMe", role="user")
        db_session.add(target)
        db_session.flush()
        report = UserReport(
            reporter_id=None,
            reported_user_id=target.id,
            report_type="not_vtuber",
            reason="Not a VTuber",
        )
        db_session.add(report)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.post(
                f"/api/reports/{report.id}/hide",
                json={
                    "reason": "Content not VTuber related",
                },
            )
        assert resp.status_code == 200
        assert resp.get_json()["visibility"] == "hidden"

        # Verify user state
        db_session.refresh(target)
        assert target.visibility == "hidden"
        assert target.visibility_reason == "Content not VTuber related"

    def test_hide_requires_admin(self, client, db_session, sample_user, mock_auth):
        report = UserReport(
            reporter_id=None,
            reported_user_id=sample_user.id,
            report_type="not_vtuber",
            reason="test",
        )
        db_session.add(report)
        db_session.flush()

        with mock_auth(sample_user.id):
            resp = client.post(f"/api/reports/{report.id}/hide", json={})
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# POST /api/reports/<id>/ban — Full ban + delete (admin only)
# ---------------------------------------------------------------------------


class TestBanUser:
    def test_ban_user_creates_blacklist_and_deletes(self, client, db_session, admin_user, mock_auth):
        target = User(id="user-ban-target", display_name="BanMe", role="user")
        db_session.add(target)
        db_session.flush()

        oauth = OAuthAccount(
            user_id=target.id,
            provider="youtube",
            provider_account_id="YT-12345",
            provider_display_name="BanMe Channel",
        )
        db_session.add(oauth)
        db_session.flush()

        report = UserReport(
            reporter_id=None,
            reported_user_id=target.id,
            report_type="impersonation",
            reason="Impersonating someone",
        )
        db_session.add(report)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.post(
                f"/api/reports/{report.id}/ban",
                json={
                    "identifiers": [
                        {"identifier_type": "youtube", "identifier_value": "YT-12345"},
                    ],
                    "reason": "Confirmed impersonation",
                },
            )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["ok"] is True
        assert data["banned_count"] >= 1

        # User should be deleted
        assert db_session.get(User, "user-ban-target") is None

        # Blacklist should contain the identifier
        bl = Blacklist.query.filter_by(
            identifier_type="youtube",
            identifier_value="YT-12345",
        ).first()
        assert bl is not None

    def test_ban_requires_identifiers(self, client, db_session, admin_user, mock_auth):
        target = User(id="user-ban-no-ids", display_name="NoIds", role="user")
        db_session.add(target)
        db_session.flush()
        report = UserReport(
            reporter_id=None,
            reported_user_id=target.id,
            report_type="impersonation",
            reason="test",
        )
        db_session.add(report)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.post(
                f"/api/reports/{report.id}/ban",
                json={
                    "identifiers": [],
                },
            )
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Blacklist management
# ---------------------------------------------------------------------------


class TestBlacklist:
    def test_list_blacklist(self, client, db_session, admin_user, mock_auth):
        entry = Blacklist(
            identifier_type="twitch",
            identifier_value="TWITCH-999",
            reason="test",
            banned_by=admin_user.id,
        )
        db_session.add(entry)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.get("/api/reports/blacklist")
        assert resp.status_code == 200
        bl = resp.get_json()["blacklist"]
        assert any(e["identifier_value"] == "TWITCH-999" for e in bl)

    def test_delete_blacklist_entry(self, client, db_session, admin_user, mock_auth):
        entry = Blacklist(
            identifier_type="twitch",
            identifier_value="TWITCH-DEL",
            reason="test",
            banned_by=admin_user.id,
        )
        db_session.add(entry)
        db_session.flush()

        with mock_auth(admin_user.id):
            resp = client.delete(f"/api/reports/blacklist/{entry.id}")
        assert resp.status_code == 200
        assert db_session.get(Blacklist, entry.id) is None

    def test_blacklist_requires_admin(self, client, db_session, sample_user, mock_auth):
        with mock_auth(sample_user.id):
            resp = client.get("/api/reports/blacklist")
        assert resp.status_code == 403
