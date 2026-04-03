"""User profile routes (get, update, appeal)."""

from datetime import UTC, datetime
from typing import Any

from flask import Blueprint, Response, g, jsonify

from ..auth import login_required
from ..cache import invalidate_tree_cache
from ..constants import Visibility
from ..extensions import db
from ..models import OAuthAccount, User, VtuberTrait
from ..response_schemas import OAuthAccountPublicResponse, UserResponse
from ..schemas import AppealSchema, UpdateProfileSchema, validate_with

users_bp = Blueprint("users", __name__)


@users_bp.route("/me", methods=["GET"])
@login_required
def get_me() -> tuple[Response, int] | Response:
    """取得目前登入使用者的個人資料。
    ---
    tags:
      - Users
    security:
      - BearerAuth: []
    responses:
      200:
        description: 使用者資料
      404:
        description: 使用者不存在
    """
    user = db.session.get(User, g.current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(UserResponse.from_model(user).model_dump(mode="json"))


@users_bp.route("/me", methods=["PATCH"])
@login_required
@validate_with(UpdateProfileSchema)
def update_me(data: dict[str, Any]) -> tuple[Response, int] | Response:
    """更新目前登入使用者的個人資料。
    ---
    tags:
      - Users
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        schema:
          type: object
          properties:
            display_name:
              type: string
            organization:
              type: string
            bio:
              type: string
              maxLength: 500
            country_flags:
              type: array
              items:
                type: string
                minLength: 2
                maxLength: 2
            social_links:
              type: object
            primary_platform:
              type: string
              enum: [youtube, twitch]
            profile_data:
              type: object
            org_type:
              type: string
              enum: [indie, corporate, club]
            vtuber_declaration_at:
              type: boolean
              description: 設為 true 觸發 VTuber 聲明（僅限一次）
    responses:
      200:
        description: 更新後的使用者資料
      400:
        description: 驗證錯誤
      404:
        description: 使用者不存在
    """
    user = db.session.get(User, g.current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # --- Business logic requiring DB lookups ---

    # VTuber declaration: write-once timestamp
    if "vtuber_declaration_at" in data:
        if user.vtuber_declaration_at is not None:
            return jsonify({"error": "VTuber declaration already submitted"}), 400
        data["vtuber_declaration_at"] = datetime.now(UTC)

    if "primary_platform" in data:
        pp = data["primary_platform"]
        has_account = OAuthAccount.query.filter_by(user_id=g.current_user_id, provider=pp).first()
        if not has_account:
            return jsonify({"error": f"No {pp} account linked"}), 400

    # Validate live_primary_*_trait_id ownership & type
    for field, fk_col in [
        ("live_primary_real_trait_id", "taxon_id"),
        ("live_primary_fictional_trait_id", "fictional_species_id"),
    ]:
        if field in data:
            trait_id = data[field]
            if trait_id is not None:
                trait = db.session.get(VtuberTrait, trait_id)
                if not trait or str(trait.user_id) != str(g.current_user_id):
                    return jsonify({"error": f"Invalid {field}"}), 400
                if getattr(trait, fk_col) is None:
                    return jsonify({"error": f"Trait type mismatch for {field}"}), 400

    for key, value in data.items():
        setattr(user, key, value)

    # Auto-update avatar_url when primary_platform changes
    if "primary_platform" in data:
        primary_account = OAuthAccount.query.filter_by(
            user_id=g.current_user_id, provider=data["primary_platform"]
        ).first()
        if primary_account and primary_account.provider_avatar_url:
            user.avatar_url = primary_account.provider_avatar_url

    db.session.commit()
    invalidate_tree_cache()
    return jsonify(UserResponse.from_model(user).model_dump(mode="json"))


@users_bp.route("/<user_id>", methods=["GET"])
def get_user(user_id: str) -> tuple[Response, int] | Response:
    """取得指定使用者的公開資料。
    ---
    tags:
      - Users
    parameters:
      - name: user_id
        in: path
        type: string
        required: true
    responses:
      200:
        description: 使用者資料（含公開 OAuth 帳號）
      404:
        description: 使用者不存在
    """
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    data = UserResponse.from_model(user).model_dump(mode="json")
    public_accounts = OAuthAccount.query.filter_by(user_id=user_id, show_on_profile=True).all()
    data["oauth_accounts"] = [
        OAuthAccountPublicResponse.model_validate(a).model_dump(mode="json") for a in public_accounts
    ]
    return jsonify(data)


@users_bp.route("/me/appeal", methods=["POST"])
@login_required
@validate_with(AppealSchema)
def submit_appeal(data: dict[str, Any]) -> tuple[Response, int] | Response:
    """提交申訴以請求能見度審查。
    ---
    tags:
      - Users
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - appeal_note
          properties:
            appeal_note:
              type: string
    responses:
      200:
        description: 申訴已提交
        schema:
          type: object
          properties:
            ok:
              type: boolean
            visibility:
              type: string
      400:
        description: 目前帳號狀態不允許申訴
      404:
        description: 使用者不存在
    """
    user = db.session.get(User, g.current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.visibility != Visibility.HIDDEN:
        return jsonify({"error": "目前帳號狀態不允許申訴"}), 400

    user.visibility = Visibility.PENDING_REVIEW
    user.appeal_note = data["appeal_note"]
    user.updated_at = datetime.now(UTC)

    db.session.commit()

    return jsonify({"ok": True, "visibility": user.visibility})
