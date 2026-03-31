"""User report and moderation routes."""

from flask import Blueprint, Response, g, jsonify, request

from ..auth import admin_required, get_current_user
from ..constants import ReportStatus, ReportType
from ..limiter import limiter
from ..models import Blacklist, UserReport
from ..services import moderation as mod_svc

reports_bp = Blueprint("reports", __name__)
limiter.limit("5/minute")(reports_bp)


@reports_bp.route("", methods=["POST"])
def create_report() -> tuple[Response, int]:
    """提交檢舉（冒充或非 VTuber）。無需登入。
    ---
    tags:
      - Reports
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - reported_user_id
            - reason
          properties:
            reported_user_id:
              type: string
            report_type:
              type: string
              enum: [impersonation, not_vtuber]
              default: impersonation
            reason:
              type: string
              maxLength: 2000
            evidence_url:
              type: string
    responses:
      201:
        description: 檢舉已建立
      400:
        description: 驗證錯誤
      404:
        description: 被舉報使用者不存在
    """
    data = request.get_json() or {}
    result, status = mod_svc.create_report(
        reporter_id=get_current_user(),
        reported_user_id=data.get("reported_user_id", ""),
        report_type=data.get("report_type", ReportType.IMPERSONATION),
        reason=(data.get("reason") or "").strip(),
        evidence_url=(data.get("evidence_url") or "").strip() or None,
    )
    return jsonify(result), status


@reports_bp.route("", methods=["GET"])
@admin_required
def list_reports() -> tuple[Response, int] | Response:
    """列出檢舉（管理員）。
    ---
    tags:
      - Reports
    security:
      - BearerAuth: []
    parameters:
      - name: status
        in: query
        type: string
        default: pending
        enum: [pending, investigating, confirmed, dismissed]
    responses:
      200:
        description: 檢舉清單
    """
    status = request.args.get("status", ReportStatus.PENDING)
    if status not in ReportStatus.ALL:
        return jsonify({"error": "Invalid status"}), 400

    reports = UserReport.query.filter_by(status=status).order_by(UserReport.created_at.desc()).all()
    return jsonify({"reports": [r.to_dict() for r in reports]})


@reports_bp.route("/<int:report_id>", methods=["PATCH"])
@admin_required
def update_report(report_id: int) -> tuple[Response, int]:
    """更新檢舉狀態（管理員）。
    ---
    tags:
      - Reports
    security:
      - BearerAuth: []
    parameters:
      - name: report_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            status:
              type: string
              enum: [investigating, confirmed, dismissed]
            admin_note:
              type: string
    responses:
      200:
        description: 更新後的檢舉
      404:
        description: 檢舉不存在
    """
    data = request.get_json() or {}
    result, status = mod_svc.update_report(report_id, data)
    return jsonify(result), status


@reports_bp.route("/<int:report_id>/hide", methods=["POST"])
@admin_required
def hide_user(report_id: int) -> tuple[Response, int]:
    """隱藏被舉報使用者（影子封鎖）。管理員。
    ---
    tags:
      - Reports
    security:
      - BearerAuth: []
    parameters:
      - name: report_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            reason:
              type: string
            admin_note:
              type: string
    responses:
      200:
        description: 使用者已隱藏
      404:
        description: 檢舉或使用者不存在
    """
    data = request.get_json() or {}
    result, status = mod_svc.hide_user(report_id, g.current_user_id, data)
    return jsonify(result), status


@reports_bp.route("/<int:report_id>/blacklist-preview", methods=["GET"])
@admin_required
def blacklist_preview(report_id: int) -> tuple[Response, int]:
    """預覽被舉報使用者的帳號（用於封鎖）。管理員。
    ---
    tags:
      - Reports
    security:
      - BearerAuth: []
    parameters:
      - name: report_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: 帳號識別碼清單
      404:
        description: 檢舉不存在
    """
    result, status = mod_svc.blacklist_preview(report_id)
    return jsonify(result), status


@reports_bp.route("/<int:report_id>/ban", methods=["POST"])
@admin_required
def ban_user(report_id: int) -> tuple[Response, int]:
    """封鎖帳號識別碼並刪除使用者。管理員。
    ---
    tags:
      - Reports
    security:
      - BearerAuth: []
    parameters:
      - name: report_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - identifiers
          properties:
            identifiers:
              type: array
              items:
                type: object
                properties:
                  identifier_type:
                    type: string
                  identifier_value:
                    type: string
            reason:
              type: string
            admin_note:
              type: string
    responses:
      200:
        description: 封鎖與刪除成功
      400:
        description: 未選擇要封鎖的帳號
      404:
        description: 檢舉或使用者不存在
    """
    data = request.get_json() or {}
    result, status = mod_svc.ban_user(report_id, g.current_user_id, data)
    return jsonify(result), status


@reports_bp.route("/blacklist", methods=["GET"])
@admin_required
def list_blacklist() -> Response:
    """列出所有黑名單。管理員。
    ---
    tags:
      - Reports
    security:
      - BearerAuth: []
    responses:
      200:
        description: 黑名單清單
    """
    entries = Blacklist.query.order_by(Blacklist.created_at.desc()).all()
    return jsonify({"blacklist": [e.to_dict() for e in entries]})


@reports_bp.route("/blacklist/<int:entry_id>", methods=["DELETE"])
@admin_required
def delete_blacklist_entry(entry_id: int) -> tuple[Response, int]:
    """移除黑名單項目。管理員。
    ---
    tags:
      - Reports
    security:
      - BearerAuth: []
    parameters:
      - name: entry_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: 移除成功
      404:
        description: 項目不存在
    """
    result, status = mod_svc.delete_blacklist_entry(entry_id)
    return jsonify(result), status
