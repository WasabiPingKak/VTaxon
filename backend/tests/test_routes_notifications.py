"""Route integration tests for /api/notifications — list, grouped, unread-count, mark read."""

import uuid

import pytest

from app.extensions import db as _db
from app.models import Notification, User


@pytest.fixture()
def notif_user(app):
    """Create a user with a real UUID id (required by Notification.user_id pgUUID column)."""
    uid = str(uuid.uuid4())
    with app.app_context():
        u = User(id=uid, display_name="NotifUser", role="user")
        _db.session.add(u)
        _db.session.commit()
        yield u


@pytest.fixture()
def notif_user2(app):
    uid = str(uuid.uuid4())
    with app.app_context():
        u = User(id=uid, display_name="NotifUser2", role="user")
        _db.session.add(u)
        _db.session.commit()
        yield u


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _notif(db_session, user_id, type_="breed_request", ref_id=1, title="test", is_read=False, status="pending"):
    n = Notification(
        user_id=user_id,
        type=type_,
        reference_id=ref_id,
        title=title,
        is_read=is_read,
        status=status,
    )
    db_session.add(n)
    db_session.flush()
    return n


# ---------------------------------------------------------------------------
# GET /api/notifications
# ---------------------------------------------------------------------------


class TestListNotifications:
    def test_list_own_notifications(self, client, db_session, mock_auth, notif_user):
        _notif(db_session, notif_user.id)
        _notif(db_session, notif_user.id, is_read=True)

        with mock_auth(notif_user.id):
            resp = client.get("/api/notifications")
        assert resp.status_code == 200
        assert len(resp.get_json()["notifications"]) == 2

    def test_unread_only_filter(self, client, db_session, mock_auth, notif_user):
        _notif(db_session, notif_user.id, is_read=False)
        _notif(db_session, notif_user.id, is_read=True)

        with mock_auth(notif_user.id):
            resp = client.get("/api/notifications?unread_only=true")
        assert len(resp.get_json()["notifications"]) == 1

    def test_unauthenticated_rejected(self, client):
        resp = client.get("/api/notifications")
        assert resp.status_code == 401

    def test_does_not_show_other_users_notifications(self, client, db_session, mock_auth, notif_user, notif_user2):
        _notif(db_session, notif_user2.id)  # belongs to admin

        with mock_auth(notif_user.id):
            resp = client.get("/api/notifications")
        assert resp.get_json()["notifications"] == []


# ---------------------------------------------------------------------------
# GET /api/notifications/unread-count
# ---------------------------------------------------------------------------


class TestUnreadCount:
    def test_returns_count(self, client, db_session, mock_auth, notif_user):
        _notif(db_session, notif_user.id, is_read=False)
        _notif(db_session, notif_user.id, is_read=False)
        _notif(db_session, notif_user.id, is_read=True)

        with mock_auth(notif_user.id):
            resp = client.get("/api/notifications/unread-count")
        assert resp.status_code == 200
        assert resp.get_json()["count"] == 2


# ---------------------------------------------------------------------------
# POST /api/notifications/read
# ---------------------------------------------------------------------------


class TestMarkRead:
    def test_mark_all_read(self, client, db_session, mock_auth, notif_user):
        _notif(db_session, notif_user.id)
        _notif(db_session, notif_user.id)

        with mock_auth(notif_user.id):
            resp = client.post("/api/notifications/read", json={"all": True})
        assert resp.status_code == 200

        # Verify all read
        with mock_auth(notif_user.id):
            resp = client.get("/api/notifications/unread-count")
        assert resp.get_json()["count"] == 0

    def test_mark_specific_ids(self, client, db_session, mock_auth, notif_user):
        n1 = _notif(db_session, notif_user.id)
        _notif(db_session, notif_user.id)

        with mock_auth(notif_user.id):
            resp = client.post("/api/notifications/read", json={"ids": [n1.id]})
        assert resp.status_code == 200

        with mock_auth(notif_user.id):
            resp = client.get("/api/notifications/unread-count")
        assert resp.get_json()["count"] == 1

    def test_missing_payload_returns_400(self, client, mock_auth, notif_user):
        with mock_auth(notif_user.id):
            resp = client.post("/api/notifications/read", json={})
        assert resp.status_code == 400

    def test_ids_must_be_list(self, client, mock_auth, notif_user):
        with mock_auth(notif_user.id):
            resp = client.post("/api/notifications/read", json={"ids": "not-a-list"})
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# GET /api/notifications/grouped
# ---------------------------------------------------------------------------


class TestGroupedNotifications:
    def test_groups_by_type_and_reference(self, client, db_session, mock_auth, notif_user):
        _notif(db_session, notif_user.id, type_="breed_request", ref_id=1, status="pending")
        _notif(db_session, notif_user.id, type_="breed_request", ref_id=1, status="in_progress")
        _notif(db_session, notif_user.id, type_="fictional_request", ref_id=2, status="pending")

        with mock_auth(notif_user.id):
            resp = client.get("/api/notifications/grouped")
        assert resp.status_code == 200
        groups = resp.get_json()["groups"]
        assert len(groups) == 2  # 2 distinct (type, reference_id) groups

    def test_type_filter(self, client, db_session, mock_auth, notif_user):
        _notif(db_session, notif_user.id, type_="breed_request", ref_id=1)
        _notif(db_session, notif_user.id, type_="fictional_request", ref_id=2)

        with mock_auth(notif_user.id):
            resp = client.get("/api/notifications/grouped?type=breed_request")
        groups = resp.get_json()["groups"]
        assert len(groups) == 1
        assert groups[0]["type"] == "breed_request"
