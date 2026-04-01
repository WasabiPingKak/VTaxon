"""Unit tests for app.services.notifications — create_notification."""

import uuid

from app.constants import ReportStatus, RequestStatus
from app.models import Notification, User
from app.services.notifications import create_notification


class TestCreateNotification:
    def test_fictional_request_completed(self, app, db_session):
        uid = str(uuid.uuid4())
        u = User(id=uid, display_name="T")
        db_session.add(u)
        db_session.commit()

        create_notification(uid, "fictional_request", 1, RequestStatus.COMPLETED, subject_name="龍")
        db_session.commit()

        notif = Notification.query.filter_by(user_id=uid).first()
        assert notif is not None
        assert "虛構物種申請已完成" in notif.title
        assert "龍" in notif.title
        assert notif.type == "fictional_request"
        assert notif.status == RequestStatus.COMPLETED

    def test_breed_request_rejected_with_admin_note(self, app, db_session):
        uid = str(uuid.uuid4())
        u = User(id=uid, display_name="T")
        db_session.add(u)
        db_session.commit()

        create_notification(uid, "breed_request", 2, RequestStatus.REJECTED, admin_note="不符合收錄標準")
        db_session.commit()

        notif = Notification.query.filter_by(user_id=uid).first()
        assert notif is not None
        assert "品種申請不處理" in notif.title
        assert notif.message == "不符合收錄標準"

    def test_report_investigating(self, app, db_session):
        uid = str(uuid.uuid4())
        u = User(id=uid, display_name="T")
        db_session.add(u)
        db_session.commit()

        create_notification(uid, "report", 3, ReportStatus.INVESTIGATING)
        db_session.commit()

        notif = Notification.query.filter_by(user_id=uid).first()
        assert notif is not None
        assert "帳號檢舉調查中" in notif.title

    def test_unknown_type_does_nothing(self, app, db_session):
        uid = str(uuid.uuid4())
        u = User(id=uid, display_name="T")
        db_session.add(u)
        db_session.commit()

        create_notification(uid, "unknown_type", 4, "some_status")
        db_session.commit()

        assert Notification.query.filter_by(user_id=uid).count() == 0

    def test_unknown_status_does_nothing(self, app, db_session):
        uid = str(uuid.uuid4())
        u = User(id=uid, display_name="T")
        db_session.add(u)
        db_session.commit()

        create_notification(uid, "fictional_request", 5, "nonexistent_status")
        db_session.commit()

        assert Notification.query.filter_by(user_id=uid).count() == 0

    def test_none_user_id_does_nothing(self, app, db_session):
        create_notification(None, "fictional_request", 6, RequestStatus.COMPLETED)
        db_session.commit()
        assert Notification.query.count() == 0

    def test_admin_note_truncated_at_500(self, app, db_session):
        uid = str(uuid.uuid4())
        u = User(id=uid, display_name="T")
        db_session.add(u)
        db_session.commit()

        long_note = "x" * 600
        create_notification(uid, "breed_request", 7, RequestStatus.COMPLETED, admin_note=long_note)
        db_session.commit()

        notif = Notification.query.filter_by(user_id=uid).first()
        assert notif is not None
        assert len(notif.message) == 500

    def test_subject_name_appended_to_title(self, app, db_session):
        uid = str(uuid.uuid4())
        u = User(id=uid, display_name="T")
        db_session.add(u)
        db_session.commit()

        create_notification(uid, "species_name_report", 8, RequestStatus.COMPLETED, subject_name="家貓")
        db_session.commit()

        notif = Notification.query.filter_by(user_id=uid).first()
        assert notif.title == "名稱回報已完成：家貓"

    def test_no_admin_note_message_is_none(self, app, db_session):
        uid = str(uuid.uuid4())
        u = User(id=uid, display_name="T")
        db_session.add(u)
        db_session.commit()

        create_notification(uid, "fictional_request", 9, RequestStatus.RECEIVED)
        db_session.commit()

        notif = Notification.query.filter_by(user_id=uid).first()
        assert notif.message is None
