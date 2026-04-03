"""Admin management routes — request counts, exports, transitions, visibility."""

from flask import Blueprint, Response, g, jsonify, request

from ..auth import admin_required
from ..constants import Visibility
from ..models import User
from ..response_schemas import UserResponse
from ..services import admin as admin_svc

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/request-counts")
@admin_required
def get_request_counts() -> tuple[Response, int]:
    """取得所有管理請求的狀態統計。管理員。
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    responses:
      200:
        description: 各類請求的狀態計數
        schema:
          type: object
          properties:
            fictional:
              type: object
            breed:
              type: object
            name_report:
              type: object
            report:
              type: object
            visibility:
              type: object
    """
    return jsonify(admin_svc.get_request_counts()), 200


@admin_bp.route("/export-fictional")
@admin_required
def export_fictional() -> tuple[Response, int]:
    """匯出已收到的虛構物種請求。管理員。
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    responses:
      200:
        description: 匯出資料（含指示說明）
    """
    return jsonify(admin_svc.export_fictional()), 200


@admin_bp.route("/export-breeds")
@admin_required
def export_breeds() -> tuple[Response, int]:
    """匯出已收到的品種請求（含物種上下文）。管理員。
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    responses:
      200:
        description: 匯出資料
    """
    return jsonify(admin_svc.export_breeds()), 200


@admin_bp.route("/transition-fictional", methods=["POST"])
@admin_required
def transition_fictional() -> tuple[Response, int]:
    """批量將虛構物種請求從 received 轉為 in_progress。管理員。
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    responses:
      200:
        description: 轉移成功
        schema:
          type: object
          properties:
            updated:
              type: integer
      500:
        description: 轉移失敗
    """
    result, status = admin_svc.transition_fictional()
    return jsonify(result), status


@admin_bp.route("/transition-breeds", methods=["POST"])
@admin_required
def transition_breeds() -> tuple[Response, int]:
    """批量將品種請求從 received 轉為 in_progress。管理員。
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    responses:
      200:
        description: 轉移成功
        schema:
          type: object
          properties:
            updated:
              type: integer
      500:
        description: 轉移失敗
    """
    result, status = admin_svc.transition_breeds()
    return jsonify(result), status


@admin_bp.route("/users/<user_id>/visibility", methods=["PATCH"])
@admin_required
def set_user_visibility(user_id: str) -> tuple[Response, int]:
    """設定使用者能見度。管理員。
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    parameters:
      - name: user_id
        in: path
        type: string
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - visibility
          properties:
            visibility:
              type: string
              enum: [visible, hidden]
            reason:
              type: string
    responses:
      200:
        description: 更新成功
      400:
        description: 無效的 visibility
      404:
        description: 使用者不存在
    """
    data = request.get_json() or {}
    result, status = admin_svc.set_user_visibility(user_id, g.current_user_id, data)
    return jsonify(result), status


@admin_bp.route("/users/pending-reviews", methods=["GET"])
@admin_required
def pending_reviews() -> tuple[Response, int]:
    """列出待審核的申訴使用者。管理員。
    ---
    tags:
      - Admin
    security:
      - BearerAuth: []
    responses:
      200:
        description: 待審核使用者清單
    """
    users = User.query.filter_by(visibility=Visibility.PENDING_REVIEW).order_by(User.updated_at.desc()).all()
    return jsonify(
        {
            "users": [UserResponse.from_model(u).model_dump(mode="json") for u in users],
        }
    ), 200
