from ..extensions import db
from ..models import Notification

TITLE_MAP = {
    'fictional_request': {
        'received':    '虛構物種申請已受理',
        'in_progress': '虛構物種申請處理中',
        'completed':   '虛構物種申請已完成',
        'rejected':    '虛構物種申請已駁回',
        'approved':    '虛構物種申請已批准',  # 向下相容
    },
    'breed_request': {
        'received':    '品種申請已受理',
        'in_progress': '品種申請處理中',
        'completed':   '品種申請已完成',
        'rejected':    '品種申請已駁回',
        'approved':    '品種申請已批准',
    },
    'report': {
        'investigating': '帳號檢舉調查中',
        'confirmed':     '帳號檢舉已確認處理',
        'dismissed':     '帳號檢舉已駁回',
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
        status=status,
    )
    db.session.add(notif)
