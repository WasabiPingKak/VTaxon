"""Business logic for user reports, moderation (hide/ban), and blacklist management."""

import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.exc import IntegrityError

from ..cache import invalidate_fictional_tree_cache, invalidate_tree_cache
from ..extensions import db
from ..models import AuthIdAlias, Blacklist, OAuthAccount, User, UserReport

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Create report
# ---------------------------------------------------------------------------


def create_report(
    *, reporter_id: str | None, reported_user_id: str, report_type: str, reason: str, evidence_url: str | None
) -> tuple[dict[str, Any], int]:
    """Validate and create a user report. Returns (result_dict, http_status)."""
    if report_type not in ("impersonation", "not_vtuber"):
        return {"error": "無效的檢舉類型"}, 400
    if not reported_user_id:
        return {"error": "缺少被舉報使用者 ID"}, 400
    if not reason:
        return {"error": "請填寫舉報理由"}, 400
    if len(reason) > 2000:
        return {"error": "理由不得超過 2000 字"}, 400

    reported = db.session.get(User, reported_user_id)
    if not reported:
        return {"error": "被舉報使用者不存在"}, 404

    if reporter_id and str(reporter_id) == str(reported_user_id):
        return {"error": "不能舉報自己"}, 400

    report = UserReport(
        reporter_id=reporter_id,
        reported_user_id=reported_user_id,
        report_type=report_type,
        reason=reason,
        evidence_url=evidence_url,
    )
    db.session.add(report)
    db.session.commit()

    from .email import notify_new_report

    notify_new_report(report)

    return report.to_dict(), 201


# ---------------------------------------------------------------------------
# Update report
# ---------------------------------------------------------------------------


def update_report(report_id: int, data: dict[str, Any]) -> tuple[dict[str, Any], int]:
    """Update report status. Returns (result_dict, http_status)."""
    report = db.session.get(UserReport, report_id)
    if not report:
        return {"error": "Report not found"}, 404

    new_status = data.get("status")
    if new_status and new_status not in ("investigating", "confirmed", "dismissed"):
        return {"error": "Invalid status"}, 400

    if new_status:
        report.status = new_status
    if "admin_note" in data:
        report.admin_note = data["admin_note"] or None

    if new_status:
        from .notifications import create_notification

        create_notification(report.reporter_id, "report", report.id, new_status, report.admin_note)

    db.session.commit()
    return report.to_dict(), 200


# ---------------------------------------------------------------------------
# Hide user (shadow ban)
# ---------------------------------------------------------------------------


def hide_user(report_id: int, admin_user_id: str, data: dict[str, Any]) -> tuple[dict[str, Any], int]:
    """Hide the reported user. Returns (result_dict, http_status)."""
    report = db.session.get(UserReport, report_id)
    if not report:
        return {"error": "Report not found"}, 404
    if not report.reported_user_id:
        return {"error": "被舉報使用者已刪除"}, 404

    reported_user = db.session.get(User, report.reported_user_id)
    if not reported_user:
        return {"error": "被舉報使用者不存在"}, 404

    reason = (data.get("reason") or "").strip() or "您的頻道內容以真人形象為主，不符合本服務的收錄標準"

    reported_user.visibility = "hidden"
    reported_user.visibility_reason = reason
    reported_user.visibility_changed_at = datetime.now(UTC)
    reported_user.visibility_changed_by = admin_user_id
    reported_user.appeal_note = None

    report.status = "confirmed"
    if "admin_note" in data:
        report.admin_note = data["admin_note"] or None

    from .notifications import create_notification

    create_notification(report.reporter_id, "report", report.id, "confirmed", report.admin_note)

    db.session.commit()
    invalidate_tree_cache()
    invalidate_fictional_tree_cache()

    return {
        "ok": True,
        "user_id": reported_user.id,
        "visibility": "hidden",
        "message": f"已隱藏使用者 {reported_user.display_name}",
    }, 200


# ---------------------------------------------------------------------------
# Blacklist preview
# ---------------------------------------------------------------------------


def blacklist_preview(report_id: int) -> tuple[dict[str, Any], int]:
    """Preview identifiers for banning. Returns (result_dict, http_status)."""
    report = db.session.get(UserReport, report_id)
    if not report:
        return {"error": "Report not found"}, 404
    if not report.reported_user_id:
        return {"error": "被舉報使用者已刪除"}, 404

    accounts = OAuthAccount.query.filter_by(user_id=report.reported_user_id).all()

    items = []
    for a in accounts:
        already_banned = (
            Blacklist.query.filter_by(
                identifier_type=a.provider,
                identifier_value=a.provider_account_id,
            ).first()
            is not None
        )
        items.append(
            {
                "provider": a.provider,
                "provider_account_id": a.provider_account_id,
                "provider_display_name": a.provider_display_name,
                "channel_url": a.channel_url,
                "already_banned": already_banned,
            }
        )

    return {"identifiers": items}, 200


# ---------------------------------------------------------------------------
# Ban user
# ---------------------------------------------------------------------------


def ban_user(report_id: int, admin_user_id: str, data: dict[str, Any]) -> tuple[dict[str, Any], int]:
    """Ban identifiers and delete user. Returns (result_dict, http_status)."""
    report = db.session.get(UserReport, report_id)
    if not report:
        return {"error": "Report not found"}, 404
    if not report.reported_user_id:
        return {"error": "被舉報使用者已刪除"}, 404

    identifiers = data.get("identifiers", [])
    reason = data.get("reason") or report.reason

    if not identifiers:
        return {"error": "請選擇至少一個要封鎖的帳號"}, 400

    reported_user = db.session.get(User, report.reported_user_id)
    if not reported_user:
        return {"error": "被舉報使用者不存在"}, 404

    banned_count = _add_identifiers_to_blacklist(identifiers, report.reported_user_id, reason, admin_user_id)
    banned_count += _blacklist_supabase_uids(report.reported_user_id, reason, admin_user_id)

    # Mark report as confirmed
    report.status = "confirmed"
    if "admin_note" in data:
        report.admin_note = data["admin_note"] or None

    from .notifications import create_notification

    create_notification(report.reporter_id, "report", report.id, "confirmed", report.admin_note)

    # Delete the reported user
    db.session.delete(reported_user)
    db.session.commit()
    invalidate_tree_cache()

    return {
        "ok": True,
        "banned_count": banned_count,
        "message": f"已封鎖 {banned_count} 個帳號識別碼並刪除使用者",
    }, 200


def _add_identifiers_to_blacklist(identifiers: list[dict[str, Any]], user_id: str, reason: str, banned_by: str) -> int:
    """Add OAuth identifiers to blacklist. Returns count of new entries.

    Uses savepoint per entry so a concurrent duplicate doesn't abort the
    entire batch.
    """
    count = 0
    for ident in identifiers:
        id_type = ident.get("identifier_type")
        id_value = ident.get("identifier_value")
        if not id_type or not id_value:
            continue
        try:
            with db.session.begin_nested():
                db.session.add(
                    Blacklist(
                        identifier_type=id_type,
                        identifier_value=id_value,
                        user_id=user_id,
                        reason=reason,
                        banned_by=banned_by,
                    )
                )
            count += 1
        except IntegrityError:
            logger.debug("Blacklist entry already exists: %s/%s", id_type, id_value)
    return count


def _blacklist_supabase_uids(user_id: str, reason: str, banned_by: str) -> int:
    """Blacklist the Supabase UID and any auth_id_aliases. Returns count.

    Uses savepoint per entry so a concurrent duplicate doesn't abort the
    entire batch.
    """
    count = 0
    uid_values = [str(user_id)]

    aliases = AuthIdAlias.query.filter_by(user_id=str(user_id)).all()
    uid_values.extend(alias.auth_id for alias in aliases)

    for uid_value in uid_values:
        try:
            with db.session.begin_nested():
                db.session.add(
                    Blacklist(
                        identifier_type="supabase_uid",
                        identifier_value=uid_value,
                        user_id=user_id,
                        reason=reason,
                        banned_by=banned_by,
                    )
                )
            count += 1
        except IntegrityError:
            logger.debug("Blacklist supabase_uid already exists: %s", uid_value)

    return count


# ---------------------------------------------------------------------------
# Blacklist CRUD
# ---------------------------------------------------------------------------


def delete_blacklist_entry(entry_id: int) -> tuple[dict[str, Any], int]:
    """Delete a blacklist entry. Returns (result_dict, http_status)."""
    entry = db.session.get(Blacklist, entry_id)
    if not entry:
        return {"error": "Blacklist entry not found"}, 404
    db.session.delete(entry)
    db.session.commit()
    return {"ok": True}, 200
