from ..constants import ReportStatus, RequestStatus
from ..extensions import db
from ..models import Notification

TITLE_MAP = {
    "fictional_request": {
        RequestStatus.RECEIVED: "虛構物種申請已排入待辦",
        RequestStatus.IN_PROGRESS: "虛構物種申請處理中",
        RequestStatus.COMPLETED: "虛構物種申請已完成",
        RequestStatus.REJECTED: "虛構物種申請不處理",
        RequestStatus.APPROVED: "虛構物種申請已批准",  # 向下相容
    },
    "breed_request": {
        RequestStatus.RECEIVED: "品種申請已排入待辦",
        RequestStatus.IN_PROGRESS: "品種申請處理中",
        RequestStatus.COMPLETED: "品種申請已完成",
        RequestStatus.REJECTED: "品種申請不處理",
        RequestStatus.APPROVED: "品種申請已批准",
    },
    "species_name_report": {
        RequestStatus.RECEIVED: "名稱回報已排入待辦",
        RequestStatus.IN_PROGRESS: "名稱回報處理中",
        RequestStatus.COMPLETED: "名稱回報已完成",
        RequestStatus.REJECTED: "名稱回報不處理",
    },
    "report": {
        ReportStatus.INVESTIGATING: "帳號檢舉調查中",
        ReportStatus.CONFIRMED: "帳號檢舉已確認處理",
        ReportStatus.DISMISSED: "帳號檢舉不處理",
    },
}


def create_notification(user_id, type_, reference_id, status, admin_note=None, subject_name=None):
    if not user_id:
        return
    titles = TITLE_MAP.get(type_, {})
    title = titles.get(status)
    if not title:
        return
    if subject_name:
        title = f"{title}：{subject_name}"
    message = (admin_note or "")[:500] or None
    notif = Notification(
        user_id=str(user_id),
        type=type_,
        reference_id=reference_id,
        title=title,
        message=message,
        status=status,
    )
    db.session.add(notif)
