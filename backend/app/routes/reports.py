from datetime import UTC, datetime

from flask import Blueprint, g, jsonify, request

from ..auth import admin_required, get_current_user
from ..cache import invalidate_fictional_tree_cache, invalidate_tree_cache
from ..extensions import db
from ..limiter import limiter
from ..models import Blacklist, OAuthAccount, User, UserReport
from ..schemas import (
    BanUserSchema,
    CreateReportSchema,
    HideUserSchema,
    UpdateReportSchema,
    validate_with,
)

reports_bp = Blueprint("reports", __name__)
limiter.limit("5/minute")(reports_bp)


@reports_bp.route("", methods=["POST"])
@validate_with(CreateReportSchema)
def create_report(data):
    """Submit an impersonation report. No login required (anonymous allowed)."""
    reporter_id = get_current_user()

    reported_user_id = data["reported_user_id"]
    reason = data["reason"]
    evidence_url = data.get("evidence_url") or None

    # Business logic: verify reported user exists
    reported = db.session.get(User, reported_user_id)
    if not reported:
        return jsonify({"error": "被舉報使用者不存在"}), 404

    # Cannot report yourself
    if reporter_id and str(reporter_id) == str(reported_user_id):
        return jsonify({"error": "不能舉報自己"}), 400

    report = UserReport(
        reporter_id=reporter_id,
        reported_user_id=reported_user_id,
        report_type=data["report_type"],
        reason=reason,
        evidence_url=evidence_url,
    )
    db.session.add(report)
    db.session.commit()

    from ..services.email import notify_new_report

    notify_new_report(report)

    return jsonify(report.to_dict()), 201


@reports_bp.route("", methods=["GET"])
@admin_required
def list_reports():
    """List reports filtered by status. Admin only."""
    status = request.args.get("status", "pending")
    if status not in ("pending", "investigating", "confirmed", "dismissed"):
        return jsonify({"error": "Invalid status"}), 400

    reports = UserReport.query.filter_by(status=status).order_by(UserReport.created_at.desc()).all()

    return jsonify({"reports": [r.to_dict() for r in reports]})


@reports_bp.route("/<int:report_id>", methods=["PATCH"])
@admin_required
@validate_with(UpdateReportSchema)
def update_report(data, report_id):
    """Update report status (confirmed/dismissed). Admin only."""
    report = db.session.get(UserReport, report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    new_status = data.get("status")
    if new_status:
        report.status = new_status
    if data.get("admin_note") is not None:
        report.admin_note = data["admin_note"] or None

    if new_status:
        from ..services.notifications import create_notification

        create_notification(report.reporter_id, "report", report.id, new_status, report.admin_note)

    db.session.commit()
    return jsonify(report.to_dict())


@reports_bp.route("/<int:report_id>/hide", methods=["POST"])
@admin_required
@validate_with(HideUserSchema)
def hide_user(data, report_id):
    """Hide the reported user (shadow ban) instead of full ban. Admin only."""
    report = db.session.get(UserReport, report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404
    if not report.reported_user_id:
        return jsonify({"error": "被舉報使用者已刪除"}), 404

    reported_user = db.session.get(User, report.reported_user_id)
    if not reported_user:
        return jsonify({"error": "被舉報使用者不存在"}), 404

    reason = data.get("reason") or "您的頻道內容以真人形象為主，不符合本服務的收錄標準"

    reported_user.visibility = "hidden"
    reported_user.visibility_reason = reason
    reported_user.visibility_changed_at = datetime.now(UTC)
    reported_user.visibility_changed_by = g.current_user_id
    reported_user.appeal_note = None

    report.status = "confirmed"
    if data.get("admin_note") is not None:
        report.admin_note = data["admin_note"] or None

    from ..services.notifications import create_notification

    create_notification(report.reporter_id, "report", report.id, "confirmed", report.admin_note)

    db.session.commit()
    invalidate_tree_cache()
    invalidate_fictional_tree_cache()

    return jsonify(
        {
            "ok": True,
            "user_id": reported_user.id,
            "visibility": "hidden",
            "message": f"已隱藏使用者 {reported_user.display_name}",
        }
    )


@reports_bp.route("/<int:report_id>/blacklist-preview", methods=["GET"])
@admin_required
def blacklist_preview(report_id):
    """Preview the reported user's OAuth accounts for banning. Admin only."""
    report = db.session.get(UserReport, report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404
    if not report.reported_user_id:
        return jsonify({"error": "被舉報使用者已刪除"}), 404

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

    return jsonify({"identifiers": items})


@reports_bp.route("/<int:report_id>/ban", methods=["POST"])
@admin_required
@validate_with(BanUserSchema)
def ban_user(data, report_id):
    """Ban identifiers and delete the reported user. Admin only."""
    report = db.session.get(UserReport, report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404
    if not report.reported_user_id:
        return jsonify({"error": "被舉報使用者已刪除"}), 404

    identifiers = data["identifiers"]
    reason = data.get("reason") or report.reason

    reported_user = db.session.get(User, report.reported_user_id)
    if not reported_user:
        return jsonify({"error": "被舉報使用者不存在"}), 404

    # Add identifiers to blacklist
    banned_count = 0
    for ident in identifiers:
        id_type = ident.get("identifier_type")
        id_value = ident.get("identifier_value")
        if not id_type or not id_value:
            continue

        existing = Blacklist.query.filter_by(
            identifier_type=id_type,
            identifier_value=id_value,
        ).first()
        if existing:
            continue

        entry = Blacklist(
            identifier_type=id_type,
            identifier_value=id_value,
            user_id=report.reported_user_id,
            reason=reason,
            banned_by=g.current_user_id,
        )
        db.session.add(entry)
        banned_count += 1

    # Also blacklist the Supabase user ID (JWT sub)
    existing_sub = Blacklist.query.filter_by(
        identifier_type="supabase_uid",
        identifier_value=str(report.reported_user_id),
    ).first()
    if not existing_sub:
        db.session.add(
            Blacklist(
                identifier_type="supabase_uid",
                identifier_value=str(report.reported_user_id),
                user_id=report.reported_user_id,
                reason=reason,
                banned_by=g.current_user_id,
            )
        )
        banned_count += 1

    # Also blacklist any auth_id_aliases pointing to this user
    from ..models import AuthIdAlias

    aliases = AuthIdAlias.query.filter_by(user_id=str(report.reported_user_id)).all()
    for alias in aliases:
        existing_alias = Blacklist.query.filter_by(
            identifier_type="supabase_uid",
            identifier_value=alias.auth_id,
        ).first()
        if not existing_alias:
            db.session.add(
                Blacklist(
                    identifier_type="supabase_uid",
                    identifier_value=alias.auth_id,
                    user_id=report.reported_user_id,
                    reason=reason,
                    banned_by=g.current_user_id,
                )
            )
            banned_count += 1

    # Mark report as confirmed
    report.status = "confirmed"
    if data.get("admin_note") is not None:
        report.admin_note = data["admin_note"] or None

    from ..services.notifications import create_notification

    create_notification(report.reporter_id, "report", report.id, "confirmed", report.admin_note)

    # Delete the reported user (CASCADE clears oauth_accounts, vtuber_traits, etc.)
    db.session.delete(reported_user)
    db.session.commit()

    invalidate_tree_cache()

    return jsonify(
        {
            "ok": True,
            "banned_count": banned_count,
            "message": f"已封鎖 {banned_count} 個帳號識別碼並刪除使用者",
        }
    )


@reports_bp.route("/blacklist", methods=["GET"])
@admin_required
def list_blacklist():
    """List all blacklisted identifiers. Admin only."""
    entries = Blacklist.query.order_by(Blacklist.created_at.desc()).all()
    return jsonify({"blacklist": [e.to_dict() for e in entries]})


@reports_bp.route("/blacklist/<int:entry_id>", methods=["DELETE"])
@admin_required
def delete_blacklist_entry(entry_id):
    """Remove a blacklist entry. Admin only."""
    entry = db.session.get(Blacklist, entry_id)
    if not entry:
        return jsonify({"error": "Blacklist entry not found"}), 404

    db.session.delete(entry)
    db.session.commit()
    return jsonify({"ok": True})
