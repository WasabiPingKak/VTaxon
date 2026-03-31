import logging
from collections.abc import Generator

import requests as _requests
from flask import Blueprint, Response, g, jsonify, request, stream_with_context

from ..auth import admin_required, login_required
from ..constants import RequestStatus
from ..extensions import db
from ..limiter import limiter
from ..models import SpeciesCache, SpeciesNameReport
from ..services.gbif import (  # type: ignore[attr-defined]
    clear_chinese_name_caches,
    get_species,
    get_subspecies,
    get_subspecies_stream,
    match_species,
    search_species,
    search_species_stream,
)

logger = logging.getLogger(__name__)

species_bp = Blueprint("species", __name__)
limiter.limit("30/minute")(species_bp)


@species_bp.route("/search", methods=["GET"])
def search() -> tuple[Response, int] | Response:
    """搜尋物種（依名稱）。
    ---
    tags:
      - Species
    parameters:
      - name: q
        in: query
        type: string
        required: true
        description: 搜尋關鍵字
      - name: limit
        in: query
        type: integer
        default: 10
        maximum: 50
    responses:
      200:
        description: 搜尋結果
        schema:
          type: object
          properties:
            results:
              type: array
              items:
                type: object
      400:
        description: 缺少搜尋關鍵字
      502:
        description: GBIF 暫時無法使用
    """
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"error": "Query parameter q is required"}), 400

    limit = request.args.get("limit", 10, type=int)
    limit = min(limit, 50)

    try:
        results = search_species(q, limit=limit)
    except _requests.RequestException:
        logger.exception("GBIF search failed")
        return jsonify({"error": "物種搜尋暫時無法使用，請稍後再試"}), 502

    return jsonify({"results": results})


@species_bp.route("/search/stream", methods=["GET"])
def search_stream() -> tuple[Response, int] | Response:
    """串流物種搜尋（NDJSON 格式，逐筆回傳）。
    ---
    tags:
      - Species
    produces:
      - application/x-ndjson
    parameters:
      - name: q
        in: query
        type: string
        required: true
      - name: limit
        in: query
        type: integer
        default: 10
        maximum: 50
    responses:
      200:
        description: NDJSON 串流，每行一個 JSON 物件
      400:
        description: 缺少搜尋關鍵字
    """
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"error": "Query parameter q is required"}), 400

    limit = request.args.get("limit", 10, type=int)
    limit = min(limit, 50)

    def generate() -> Generator[str, None, None]:
        try:
            for line in search_species_stream(q, limit=limit):
                yield line
        except _requests.RequestException:
            import json

            logger.exception("Streaming species search failed")
            yield json.dumps({"error": "物種搜尋暫時無法使用，請稍後再試"}, ensure_ascii=False) + "\n"

    return Response(
        stream_with_context(generate()),
        mimetype="application/x-ndjson",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
        },
    )


@species_bp.route("/match", methods=["GET"])
def match() -> tuple[Response, int] | Response:
    """精確比對物種名稱（GBIF Backbone Taxonomy）。
    ---
    tags:
      - Species
    parameters:
      - name: name
        in: query
        type: string
        required: true
        description: 物種名稱
    responses:
      200:
        description: 比對結果
      400:
        description: 缺少 name 參數
      404:
        description: 無匹配結果
      502:
        description: GBIF 暫時無法使用
    """
    name = request.args.get("name", "").strip()
    if not name:
        return jsonify({"error": "Query parameter name is required"}), 400

    try:
        result = match_species(name)
    except _requests.RequestException:
        logger.exception("GBIF match failed")
        return jsonify({"error": "物種比對暫時無法使用，請稍後再試"}), 502

    if not result:
        return jsonify({"error": "No match found"}), 404

    return jsonify(result)


@species_bp.route("/<int:taxon_id>", methods=["GET"])
def get_one(taxon_id: int) -> tuple[Response, int] | Response:
    """取得單一物種資料。
    ---
    tags:
      - Species
    parameters:
      - name: taxon_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: 物種資料
      404:
        description: 物種不存在
    """
    result = get_species(taxon_id)
    if not result:
        return jsonify({"error": "Species not found"}), 404
    return jsonify(result)


@species_bp.route("/<int:taxon_id>/children", methods=["GET"])
def get_children(taxon_id: int) -> tuple[Response, int] | Response:
    """取得物種的子分類（亞種等）。
    ---
    tags:
      - Species
    parameters:
      - name: taxon_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: 子分類清單
        schema:
          type: object
          properties:
            results:
              type: array
              items:
                type: object
      502:
        description: GBIF 暫時無法使用
    """
    try:
        subspecies = get_subspecies(taxon_id)
    except _requests.RequestException:
        logger.exception("Failed to fetch children for taxon %s", taxon_id)
        return jsonify({"error": "子分類查詢暫時無法使用，請稍後再試"}), 502
    return jsonify({"results": subspecies})


@species_bp.route("/<int:taxon_id>/children/stream", methods=["GET"])
def get_children_stream(taxon_id: int) -> Response:
    """串流取得子分類（NDJSON 格式）。
    ---
    tags:
      - Species
    produces:
      - application/x-ndjson
    parameters:
      - name: taxon_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: NDJSON 串流
    """

    def generate() -> Generator[str, None, None]:
        try:
            for line in get_subspecies_stream(taxon_id):
                yield line
        except _requests.RequestException:
            import json

            logger.exception("Streaming subspecies fetch failed for taxon %s", taxon_id)
            yield json.dumps({"error": "子分類查詢暫時無法使用，請稍後再試"}, ensure_ascii=False) + "\n"

    return Response(
        stream_with_context(generate()),
        mimetype="application/x-ndjson",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
        },
    )


@species_bp.route("/cache/clear", methods=["POST"])
@admin_required
def clear_cache() -> Response:
    """清除中文名稱快取（管理員）。
    ---
    tags:
      - Species
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        schema:
          type: object
          properties:
            taxon_ids:
              type: array
              items:
                type: integer
              description: 指定要清除的 taxon_id，省略則清除全部
    responses:
      200:
        description: 清除結果
        schema:
          type: object
          properties:
            cleared_count:
              type: integer
            lru_caches_cleared:
              type: boolean
            scope:
              type: string
              enum: [specific, all]
    """
    # 1. Clear all in-memory LRU caches
    clear_chinese_name_caches()

    # 2. Clear DB cache
    data = request.get_json(silent=True) or {}
    taxon_ids = data.get("taxon_ids")

    if taxon_ids:
        # Clear specific taxa
        result = db.session.execute(
            db.update(SpeciesCache)
            .where(SpeciesCache.taxon_id.in_(taxon_ids))
            .where(SpeciesCache.common_name_zh.isnot(None))
            .values(common_name_zh=None)
        )
    else:
        # Clear all
        result = db.session.execute(
            db.update(SpeciesCache).where(SpeciesCache.common_name_zh.isnot(None)).values(common_name_zh=None)
        )

    db.session.commit()
    cleared_count: int = result.rowcount  # type: ignore[attr-defined]

    return jsonify(
        {
            "cleared_count": cleared_count,
            "lru_caches_cleared": True,
            "scope": "specific" if taxon_ids else "all",
        }
    )


# ── Name Reports ──────────────────────────────────────────────────


@species_bp.route("/name-reports", methods=["POST"])
@login_required
def create_name_report() -> tuple[Response, int] | Response:
    """提交物種名稱回報（中文名稱缺漏或錯誤）。
    ---
    tags:
      - Species
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - report_type
            - suggested_name_zh
          properties:
            taxon_id:
              type: integer
            report_type:
              type: string
              enum: [missing_zh, wrong_zh, not_found]
            suggested_name_zh:
              type: string
            description:
              type: string
    responses:
      201:
        description: 回報已建立
      400:
        description: 驗證錯誤
    """
    data = request.get_json() or {}
    taxon_id = data.get("taxon_id")
    report_type = data.get("report_type")
    suggested_name_zh = (data.get("suggested_name_zh") or "").strip()

    if not report_type or not suggested_name_zh:
        return jsonify({"error": "report_type, suggested_name_zh 為必填"}), 400

    if report_type not in ("missing_zh", "wrong_zh", "not_found"):
        return jsonify({"error": "report_type 必須為 missing_zh、wrong_zh 或 not_found"}), 400

    if report_type != "not_found" and not taxon_id:
        return jsonify({"error": "taxon_id 為必填（not_found 類型除外）"}), 400

    if report_type == "not_found":
        description = (data.get("description") or "").strip()
        if not description:
            return jsonify({"error": "not_found 類型必須填寫補充說明"}), 400

    # Look up current name from cache
    current_name_zh = None
    if taxon_id:
        species = db.session.get(SpeciesCache, taxon_id)
        current_name_zh = species.common_name_zh if species else None

    report = SpeciesNameReport(
        user_id=g.current_user_id,
        taxon_id=taxon_id,
        report_type=report_type,
        current_name_zh=current_name_zh,
        suggested_name_zh=suggested_name_zh,
        description=(data.get("description") or "").strip() or None,
    )
    db.session.add(report)
    db.session.commit()
    return jsonify(report.to_dict()), 201


@species_bp.route("/name-reports", methods=["GET"])
@admin_required
def list_name_reports() -> Response:
    """列出物種名稱回報（管理員）。
    ---
    tags:
      - Species
    security:
      - BearerAuth: []
    parameters:
      - name: status
        in: query
        type: string
        default: pending
    responses:
      200:
        description: 回報清單
    """
    status = request.args.get("status", RequestStatus.PENDING)
    reports = SpeciesNameReport.query.filter_by(status=status).order_by(SpeciesNameReport.created_at.desc()).all()
    return jsonify({"reports": [r.to_dict() for r in reports]})


@species_bp.route("/name-reports/<int:report_id>", methods=["PATCH"])
@admin_required
def update_name_report(report_id: int) -> tuple[Response, int] | Response:
    """更新物種名稱回報狀態（管理員）。
    ---
    tags:
      - Species
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
            admin_note:
              type: string
    responses:
      200:
        description: 更新後的回報
      404:
        description: 回報不存在
    """
    report = db.session.get(SpeciesNameReport, report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    data = request.get_json() or {}
    old_status = report.status

    if "status" in data:
        report.status = data["status"]
    if "admin_note" in data:
        report.admin_note = data["admin_note"]

    if report.status != old_status:
        from ..services.notifications import create_notification

        create_notification(
            report.user_id,
            "species_name_report",
            report.id,
            report.status,
            admin_note=report.admin_note,
            subject_name=report.suggested_name_zh,
        )

    db.session.commit()
    return jsonify(report.to_dict())
