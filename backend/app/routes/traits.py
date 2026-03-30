"""VTuber trait CRUD routes."""

from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..models import VtuberTrait
from ..services.traits import create_trait, delete_trait, update_trait

traits_bp = Blueprint("traits", __name__)


@traits_bp.route("", methods=["POST"])
@login_required
def create_trait_route():
    """建立角色物種特徵。
    ---
    tags:
      - Traits
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            taxon_id:
              type: integer
              description: 現實物種 ID（與 fictional_species_id 二擇一）
            fictional_species_id:
              type: integer
              description: 虛構物種 ID（與 taxon_id 二擇一）
            breed_id:
              type: integer
            breed_name:
              type: string
            trait_note:
              type: string
    responses:
      201:
        description: 特徵已建立
      400:
        description: 驗證錯誤或分類階層不允許
      404:
        description: 物種或品種不存在
      409:
        description: 重複或祖先衝突
    """
    data = request.get_json() or {}
    result, status = create_trait(g.current_user_id, data)
    return jsonify(result), status


@traits_bp.route("", methods=["GET"])
def list_traits():
    """列出指定使用者的物種特徵。
    ---
    tags:
      - Traits
    parameters:
      - name: user_id
        in: query
        type: string
        required: true
    responses:
      200:
        description: 特徵清單
        schema:
          type: object
          properties:
            traits:
              type: array
              items:
                type: object
      400:
        description: 缺少 user_id
    """
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter required"}), 400

    traits = VtuberTrait.query.filter_by(user_id=user_id).all()
    return jsonify({"traits": [t.to_dict() for t in traits]})


@traits_bp.route("/<trait_id>", methods=["PATCH"])
@login_required
def update_trait_route(trait_id):
    """更新物種特徵（品種、備註）。
    ---
    tags:
      - Traits
    security:
      - BearerAuth: []
    parameters:
      - name: trait_id
        in: path
        type: string
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            breed_id:
              type: integer
            breed_name:
              type: string
            trait_note:
              type: string
    responses:
      200:
        description: 更新後的特徵
      403:
        description: 無權限
      404:
        description: 特徵不存在
    """
    data = request.get_json() or {}
    result, status = update_trait(trait_id, g.current_user_id, data)
    return jsonify(result), status


@traits_bp.route("/<trait_id>", methods=["DELETE"])
@login_required
def delete_trait_route(trait_id):
    """刪除物種特徵。
    ---
    tags:
      - Traits
    security:
      - BearerAuth: []
    parameters:
      - name: trait_id
        in: path
        type: string
        required: true
    responses:
      200:
        description: 特徵已刪除
      403:
        description: 無權限
      404:
        description: 特徵不存在
    """
    result, status = delete_trait(trait_id, g.current_user_id)
    return jsonify(result), status
