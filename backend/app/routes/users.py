"""User profile routes (get, update, appeal)."""

from datetime import UTC, datetime

from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..cache import invalidate_tree_cache
from ..extensions import db
from ..models import OAuthAccount, User, VtuberTrait
from ..schemas import AppealSchema, validate_with

users_bp = Blueprint("users", __name__)


@users_bp.route("/me", methods=["GET"])
@login_required
def get_me():
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
    return jsonify(user.to_dict())


@users_bp.route("/me", methods=["PATCH"])
@login_required
def update_me():
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

    data = request.get_json() or {}

    allowed = {
        "display_name",
        "organization",
        "bio",
        "country_flags",
        "social_links",
        "primary_platform",
        "profile_data",
        "org_type",
        "live_primary_real_trait_id",
        "live_primary_fictional_trait_id",
        "vtuber_declaration_at",
    }

    ALLOWED_SNS_KEYS = {
        "twitter",
        "threads",
        "instagram",
        "bluesky",
        "discord",
        "facebook",
        "marshmallow",
        "email",
    }

    if "org_type" in data:
        if data["org_type"] not in ("indie", "corporate", "club"):
            return jsonify({"error": "org_type must be indie, corporate, or club"}), 400
        if data["org_type"] == "indie":
            data["organization"] = None

    if "social_links" in data:
        links = data["social_links"]
        if not isinstance(links, dict):
            return jsonify({"error": "social_links must be an object"}), 400
        cleaned_links = {}
        for k, v in links.items():
            if k not in ALLOWED_SNS_KEYS:
                return jsonify({"error": f"Unknown SNS key: {k}"}), 400
            if v and not isinstance(v, str):
                return jsonify({"error": f"SNS value for {k} must be a string"}), 400
            if v and len(v) > 500:
                return jsonify({"error": f"SNS value for {k} is too long"}), 400
            if v:
                cleaned_links[k] = v.strip()
        data["social_links"] = cleaned_links

    if "bio" in data:
        bio = data["bio"]
        if bio is not None:
            if not isinstance(bio, str):
                return jsonify({"error": "bio must be a string"}), 400
            if len(bio) > 500:
                return jsonify({"error": "bio must be 500 characters or less"}), 400
            data["bio"] = bio.strip() or None

    if "country_flags" in data:
        flags = data["country_flags"]
        if not isinstance(flags, list):
            return jsonify({"error": "country_flags must be a list"}), 400
        cleaned = []
        for f in flags:
            if not isinstance(f, str) or len(f) != 2:
                return jsonify({"error": "Each flag must be a 2-character country code"}), 400
            cleaned.append(f.upper())
        data["country_flags"] = cleaned

    if "profile_data" in data:
        pd = data["profile_data"]
        if not isinstance(pd, dict):
            return jsonify({"error": "profile_data must be an object"}), 400

        ALLOWED_PD_KEYS = {
            "debut_date",
            "birthday_month",
            "birthday_day",
            "blood_type",
            "mbti",
            "gender",
            "representative_emoji",
            "fan_name",
            "activity_status",
            "illustrators",
            "riggers",
            "modelers_3d",
            "hashtags",
            "debut_video_url",
        }
        for key in pd:
            if key not in ALLOWED_PD_KEYS:
                return jsonify({"error": f"Unknown profile_data key: {key}"}), 400

        for str_key in (
            "debut_date",
            "blood_type",
            "mbti",
            "gender",
            "representative_emoji",
            "fan_name",
            "activity_status",
            "debut_video_url",
        ):
            if str_key in pd and pd[str_key] is not None:
                if not isinstance(pd[str_key], str):
                    return jsonify({"error": f"{str_key} must be a string"}), 400

        for int_key in ("birthday_month", "birthday_day"):
            if int_key in pd and pd[int_key] is not None:
                if not isinstance(pd[int_key], int):
                    return jsonify({"error": f"{int_key} must be an integer"}), 400

        for creator_key in ("illustrators", "riggers", "modelers_3d"):
            if creator_key in pd and pd[creator_key] is not None:
                if not isinstance(pd[creator_key], list):
                    return jsonify({"error": f"{creator_key} must be a list"}), 400
                for item in pd[creator_key]:
                    if not isinstance(item, dict) or "name" not in item:
                        return jsonify({"error": f"{creator_key} items must have a name"}), 400
                    if not isinstance(item["name"], str):
                        return jsonify({"error": f"{creator_key} name must be a string"}), 400
                    if "url" in item and item["url"] is not None and not isinstance(item["url"], str):
                        return jsonify({"error": f"{creator_key} url must be a string"}), 400

        if "hashtags" in pd and pd["hashtags"] is not None:
            if not isinstance(pd["hashtags"], list):
                return jsonify({"error": "hashtags must be a list"}), 400
            if any(not isinstance(item, str) for item in pd["hashtags"]):
                return jsonify({"error": "hashtags items must be strings"}), 400

        if pd.get("blood_type") and pd["blood_type"] not in ("A", "B", "O", "AB"):
            return jsonify({"error": "Invalid blood_type"}), 400
        if pd.get("activity_status") and pd["activity_status"] not in (
            "active",
            "hiatus",
            "preparing",
        ):
            return jsonify({"error": "Invalid activity_status"}), 400
        if pd.get("birthday_month") and not (1 <= pd["birthday_month"] <= 12):
            return jsonify({"error": "birthday_month must be 1-12"}), 400
        if pd.get("birthday_day") and not (1 <= pd["birthday_day"] <= 31):
            return jsonify({"error": "birthday_day must be 1-31"}), 400

        data["profile_data"] = pd

    # VTuber declaration: write-once timestamp
    if "vtuber_declaration_at" in data:
        if user.vtuber_declaration_at is not None:
            return jsonify({"error": "VTuber declaration already submitted"}), 400
        data["vtuber_declaration_at"] = datetime.now(UTC)

    if "primary_platform" in data:
        pp = data["primary_platform"]
        if pp not in ("youtube", "twitch"):
            return jsonify({"error": "primary_platform must be youtube or twitch"}), 400
        has_account = OAuthAccount.query.filter_by(user_id=g.current_user_id, provider=pp).first()
        if not has_account:
            return jsonify({"error": f"No {pp} account linked"}), 400

    # Validate live_primary_*_trait_id
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

    for key in allowed:
        if key in data:
            setattr(user, key, data[key])

    # Auto-update avatar_url when primary_platform changes
    if "primary_platform" in data:
        primary_account = OAuthAccount.query.filter_by(
            user_id=g.current_user_id, provider=data["primary_platform"]
        ).first()
        if primary_account and primary_account.provider_avatar_url:
            user.avatar_url = primary_account.provider_avatar_url

    db.session.commit()
    invalidate_tree_cache()
    return jsonify(user.to_dict())


@users_bp.route("/<user_id>", methods=["GET"])
def get_user(user_id):
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
    data = user.to_dict()
    public_accounts = OAuthAccount.query.filter_by(user_id=user_id, show_on_profile=True).all()
    data["oauth_accounts"] = [a.to_dict(public=True) for a in public_accounts]
    return jsonify(data)


@users_bp.route("/me/appeal", methods=["POST"])
@login_required
@validate_with(AppealSchema)
def submit_appeal(data):
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

    if user.visibility != "hidden":
        return jsonify({"error": "目前帳號狀態不允許申訴"}), 400

    user.visibility = "pending_review"
    user.appeal_note = data["appeal_note"]
    user.updated_at = datetime.now(UTC)

    db.session.commit()

    return jsonify({"ok": True, "visibility": user.visibility})
