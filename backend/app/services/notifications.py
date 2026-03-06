from ..extensions import db
from ..models import Notification

TITLE_MAP = {
    'fictional_request': {
        'approved': '虛構物種申請已批准',
        'rejected': '虛構物種申請已駁回',
    },
    'breed_request': {
        'approved': '品種申請已批准',
        'rejected': '品種申請已駁回',
    },
    'report': {
        'confirmed': '帳號檢舉已確認處理',
        'dismissed': '帳號檢舉已駁回',
    },
}


def create_notification(user_id, type_, reference_id, status, admin_note=None):
    if not user_id:
        return
    titles = TITLE_MAP.get(type_, {})
    title = titles.get(status)
    if not title:
        return
    message = (admin_note or '')[:500] or None
    notif = Notification(
        user_id=str(user_id),
        type=type_,
        reference_id=reference_id,
        title=title,
        message=message,
    )
    db.session.add(notif)
