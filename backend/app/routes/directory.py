"""User directory and discovery routes."""

from datetime import datetime

from flask import Blueprint, jsonify, request

from ..services.directory import query_directory, query_recent_users

directory_bp = Blueprint("directory", __name__)


@directory_bp.route("/recent", methods=["GET"])
def recent_users():
    """取得最近加入且有物種特徵的使用者。
    ---
    tags:
      - Directory
    parameters:
      - name: since
        in: query
        type: string
        format: date-time
        required: true
        description: ISO 8601 時間戳，只回傳此時間之後新增特徵的使用者
      - name: limit
        in: query
        type: integer
        default: 5
        minimum: 1
        maximum: 10
    responses:
      200:
        description: 最近加入的使用者清單
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
              display_name:
                type: string
              avatar_url:
                type: string
              created_at:
                type: string
              species_summary:
                type: string
      400:
        description: since 格式不正確
    """
    since_str = request.args.get("since", "").strip()
    if not since_str:
        return jsonify([])

    try:
        since = datetime.fromisoformat(since_str.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid since timestamp"}), 400

    limit = request.args.get("limit", 5, type=int)
    limit = min(max(limit, 1), 10)

    return jsonify(query_recent_users(since, limit))


@directory_bp.route("/directory", methods=["GET"])
def directory():
    """分頁使用者名錄（支援多種篩選與排序）。
    ---
    tags:
      - Directory
    parameters:
      - name: q
        in: query
        type: string
        description: 依名稱模糊搜尋
      - name: country
        in: query
        type: string
        description: 國旗篩選（逗號分隔，支援 NONE）
      - name: gender
        in: query
        type: string
        description: 性別篩選（逗號分隔，支援 unset/other）
      - name: status
        in: query
        type: string
        description: 活動狀態（active/hiatus/preparing）
      - name: org_type
        in: query
        type: string
        enum: [indie, corporate, club]
      - name: platform
        in: query
        type: string
        description: 平台篩選（youtube/twitch，逗號分隔）
      - name: has_traits
        in: query
        type: string
        enum: ["true", "false"]
      - name: sort
        in: query
        type: string
        enum: [created_at, name, debut_date, active_first, organization]
        default: created_at
      - name: order
        in: query
        type: string
        enum: [asc, desc]
        default: desc
      - name: live_first
        in: query
        type: string
        enum: ["true", "false"]
      - name: page
        in: query
        type: integer
        default: 1
      - name: per_page
        in: query
        type: integer
        default: 24
        maximum: 100
    responses:
      200:
        description: 分頁使用者清單與 facet 統計
        schema:
          type: object
          properties:
            items:
              type: array
              items:
                type: object
            total:
              type: integer
            page:
              type: integer
            per_page:
              type: integer
            total_pages:
              type: integer
            facets:
              type: object
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 24, type=int)

    return jsonify(
        query_directory(
            q=request.args.get("q", "").strip(),
            country=request.args.get("country", "").strip(),
            gender=request.args.get("gender", "").strip(),
            status=request.args.get("status", "").strip(),
            org_type=request.args.get("org_type", "").strip(),
            platform=request.args.get("platform", "").strip(),
            has_traits=request.args.get("has_traits", "").strip(),
            sort=request.args.get("sort", "created_at").strip(),
            order=request.args.get("order", "desc").strip(),
            live_first=request.args.get("live_first", "").strip().lower() == "true",
            page=max(page, 1),
            per_page=min(max(per_page, 1), 100),
        )
    )
