from flask import Blueprint, Response, g, jsonify, request

from ..auth import admin_required, login_required
from ..constants import RequestStatus
from ..extensions import db
from ..models import FictionalSpecies, FictionalSpeciesRequest

fictional_bp = Blueprint("fictional", __name__)


@fictional_bp.route("", methods=["GET"])
def list_fictional_species() -> tuple[Response, int]:
    """列出虛構物種。
    ---
    tags:
      - Fictional
    parameters:
      - name: origin
        in: query
        type: string
        description: 依來源篩選
    responses:
      200:
        description: 虛構物種清單
        schema:
          type: object
          properties:
            species:
              type: array
              items:
                type: object
    """
    query = FictionalSpecies.query

    origin = request.args.get("origin")
    if origin:
        query = query.filter_by(origin=origin)

    species = query.order_by(
        FictionalSpecies.origin,
        FictionalSpecies.sub_origin,
        FictionalSpecies.name,
    ).all()

    return jsonify({"species": [s.to_dict() for s in species]}), 200


@fictional_bp.route("/requests", methods=["GET"])
@admin_required
def list_requests() -> tuple[Response, int]:
    """列出虛構物種請求（管理員）。
    ---
    tags:
      - Fictional
    security:
      - BearerAuth: []
    parameters:
      - name: status
        in: query
        type: string
        default: pending
        enum: [pending, received, in_progress, completed, approved, rejected]
    responses:
      200:
        description: 請求清單
    """
    status = request.args.get("status", RequestStatus.PENDING)
    if status not in RequestStatus.ALL:
        return jsonify({"error": "Invalid status filter"}), 400

    reqs = (
        FictionalSpeciesRequest.query.filter_by(status=status).order_by(FictionalSpeciesRequest.created_at.desc()).all()
    )

    return jsonify({"requests": [r.to_dict() for r in reqs]}), 200


@fictional_bp.route("/requests/<int:req_id>", methods=["PATCH"])
@admin_required
def update_request(req_id: int) -> tuple[Response, int]:
    """更新虛構物種請求狀態（管理員）。
    ---
    tags:
      - Fictional
    security:
      - BearerAuth: []
    parameters:
      - name: req_id
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
              enum: [received, in_progress, completed, rejected]
            admin_note:
              type: string
    responses:
      200:
        description: 更新後的請求
      400:
        description: 無效的狀態
      404:
        description: 請求不存在
    """
    req = db.session.get(FictionalSpeciesRequest, req_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status not in RequestStatus.UPDATABLE:
        return jsonify({"error": "status must be received, in_progress, completed, or rejected"}), 400

    req.status = new_status
    req.admin_note = data.get("admin_note") or req.admin_note

    from ..services.notifications import create_notification

    create_notification(
        req.user_id, "fictional_request", req.id, new_status, req.admin_note, subject_name=req.name_zh or req.name_en
    )

    db.session.commit()

    return jsonify(req.to_dict()), 200


@fictional_bp.route("/requests", methods=["POST"])
@login_required
def create_request() -> tuple[Response, int]:
    """提交虛構物種新增請求。
    ---
    tags:
      - Fictional
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name_zh
          properties:
            name_zh:
              type: string
              maxLength: 30
            name_en:
              type: string
              maxLength: 60
            suggested_origin:
              type: string
              maxLength: 60
            suggested_sub_origin:
              type: string
            description:
              type: string
              maxLength: 500
    responses:
      201:
        description: 請求已建立
      400:
        description: 驗證錯誤
    """
    data = request.get_json() or {}

    FIELD_LIMITS = {
        "name_zh": (1, 30),
        "name_en": (1, 60),
        "suggested_origin": (2, 60),
        "description": (10, 500),
    }

    name_zh = (data.get("name_zh") or "").strip()
    name_en = (data.get("name_en") or "").strip()
    suggested_origin = (data.get("suggested_origin") or "").strip()
    description = (data.get("description") or "").strip()

    if not name_zh:
        return jsonify({"error": "name_zh is required"}), 400

    for field, (min_len, max_len) in FIELD_LIMITS.items():
        val = locals().get(field, "")
        if val and (len(val) < min_len or len(val) > max_len):
            return jsonify({"error": f"{field} must be {min_len}-{max_len} characters"}), 400

    req = FictionalSpeciesRequest(
        user_id=g.current_user_id,
        name_zh=name_zh,
        name_en=name_en or None,
        suggested_origin=suggested_origin or None,
        suggested_sub_origin=(data.get("suggested_sub_origin") or "").strip() or None,
        description=description or None,
    )
    db.session.add(req)
    db.session.commit()

    from ..services.email import notify_new_fictional_request

    notify_new_fictional_request(req)

    return jsonify(req.to_dict()), 201
