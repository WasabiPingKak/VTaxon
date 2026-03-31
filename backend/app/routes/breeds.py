import logging

from flask import Blueprint, Response, g, jsonify, request
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

from ..auth import admin_required, login_required
from ..cache import invalidate_tree_cache
from ..extensions import db
from ..models import Breed, BreedRequest, SpeciesCache

logger = logging.getLogger(__name__)

breeds_bp = Blueprint("breeds", __name__)


@breeds_bp.route("/categories", methods=["GET"])
def list_breed_categories() -> tuple[Response, int]:
    """列出有品種的物種及品種數量。
    ---
    tags:
      - Breeds
    responses:
      200:
        description: 品種分類清單
        schema:
          type: object
          properties:
            categories:
              type: array
              items:
                type: object
    """
    from ..services.gbif import resolve_missing_chinese_name

    rows = db.session.query(Breed.taxon_id, func.count(Breed.id).label("breed_count")).group_by(Breed.taxon_id).all()
    categories = []
    for taxon_id, breed_count in rows:
        sp = db.session.get(SpeciesCache, taxon_id)
        entry = {
            "taxon_id": taxon_id,
            "breed_count": breed_count,
        }
        if sp:
            # Back-fill missing Chinese names
            if not sp.common_name_zh:
                resolve_missing_chinese_name(sp)
            entry.update(sp.to_dict())
        categories.append(entry)

    # Sort by breed_count descending
    categories.sort(key=lambda c: c["breed_count"], reverse=True)
    return jsonify({"categories": categories}), 200


@breeds_bp.route("", methods=["GET"])
def list_breeds() -> tuple[Response, int]:
    """列出指定物種的品種。
    ---
    tags:
      - Breeds
    parameters:
      - name: taxon_id
        in: query
        type: integer
        required: true
    responses:
      200:
        description: 品種清單與物種資訊
        schema:
          type: object
          properties:
            breeds:
              type: array
              items:
                type: object
            species:
              type: object
      400:
        description: 缺少 taxon_id
    """
    taxon_id = request.args.get("taxon_id", type=int)
    if not taxon_id:
        return jsonify({"error": "taxon_id query parameter required"}), 400

    breeds = Breed.query.filter_by(taxon_id=taxon_id).order_by(Breed.name_zh).all()
    actual_taxon_id = taxon_id

    # Fallback: GBIF keys can change over time — if no breeds found for this
    # exact taxon_id, look for breeds under other taxon_ids that share the
    # same canonical scientific name (e.g. "Canis lupus familiaris").
    if not breeds:
        sp = db.session.get(SpeciesCache, taxon_id)
        if sp:
            # Extract canonical name: genus (upper) + lowercase epithets,
            # stop at author (next uppercase word after genus).
            parts = sp.scientific_name.split()
            canon_parts = [parts[0]]  # genus
            for p in parts[1:]:
                if p[0].islower():
                    canon_parts.append(p)
                else:
                    break
            canon = " ".join(canon_parts)
            alt_ids = (
                db.session.query(SpeciesCache.taxon_id)
                .filter(SpeciesCache.taxon_id != taxon_id)
                .filter(SpeciesCache.scientific_name.like(f"{canon}%"))
                .all()
            )
            for (alt_id,) in alt_ids:
                breeds = Breed.query.filter_by(taxon_id=alt_id).order_by(Breed.name_zh).all()
                if breeds:
                    actual_taxon_id = alt_id
                    break

    # Include parent species info so frontend can construct full onSelect payload
    sp = db.session.get(SpeciesCache, actual_taxon_id)
    species_info = sp.to_dict() if sp else None

    return jsonify({"breeds": [b.to_dict() for b in breeds], "species": species_info}), 200


@breeds_bp.route("/search", methods=["GET"])
def search_breeds() -> tuple[Response, int]:
    """搜尋品種（中文子字串或英文不分大小寫）。
    ---
    tags:
      - Breeds
    parameters:
      - name: q
        in: query
        type: string
        required: true
      - name: limit
        in: query
        type: integer
        default: 20
        maximum: 50
    responses:
      200:
        description: 品種搜尋結果
      400:
        description: 缺少搜尋關鍵字
    """
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"error": "Query parameter q is required"}), 400

    limit = request.args.get("limit", 20, type=int)
    limit = min(limit, 50)

    # Detect CJK
    has_cjk = any(0x4E00 <= ord(ch) <= 0x9FFF or 0x3400 <= ord(ch) <= 0x4DBF for ch in q)

    if has_cjk:
        breeds = Breed.query.filter(Breed.name_zh.isnot(None)).filter(Breed.name_zh.like(f"%{q}%")).limit(limit).all()
    else:
        breeds = Breed.query.filter(func.lower(Breed.name_en).like(f"%{q.lower()}%")).limit(limit).all()

    # Enrich each breed with parent species info
    results = []
    for b in breeds:
        d = b.to_dict()
        if b.species:
            d["species_name_zh"] = b.species._effective_common_name_zh()
            d["species_scientific_name"] = b.species.scientific_name
        results.append(d)

    return jsonify({"breeds": results}), 200


@breeds_bp.route("", methods=["POST"])
@admin_required
def create_breed() -> tuple[Response, int]:
    """新增品種（管理員）。
    ---
    tags:
      - Breeds
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - taxon_id
            - name_en
          properties:
            taxon_id:
              type: integer
            name_en:
              type: string
            name_zh:
              type: string
            breed_group:
              type: string
    responses:
      201:
        description: 品種已建立
      400:
        description: 缺少必填欄位
      409:
        description: 品種已存在
    """
    data = request.get_json() or {}

    taxon_id = data.get("taxon_id")
    name_en = (data.get("name_en") or "").strip()
    if not taxon_id or not name_en:
        return jsonify({"error": "taxon_id and name_en required"}), 400

    breed = Breed(
        taxon_id=taxon_id,
        name_en=name_en,
        name_zh=(data.get("name_zh") or "").strip() or None,
        breed_group=(data.get("breed_group") or "").strip() or None,
    )
    db.session.add(breed)
    try:
        db.session.commit()
        invalidate_tree_cache()
    except SQLAlchemyError:
        db.session.rollback()
        logger.exception("Failed to create breed for taxon_id=%s", data.get("taxon_id"))
        return jsonify({"error": "Breed already exists for this species"}), 409

    return jsonify(breed.to_dict()), 201


# ── Breed Requests ──────────────────────────────────


@breeds_bp.route("/requests", methods=["POST"])
@login_required
def create_breed_request() -> tuple[Response, int]:
    """提交品種新增請求。
    ---
    tags:
      - Breeds
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
            - name_en
            - description
          properties:
            taxon_id:
              type: integer
            name_zh:
              type: string
            name_en:
              type: string
            description:
              type: string
    responses:
      201:
        description: 請求已建立
      400:
        description: 驗證錯誤
    """
    data = request.get_json() or {}

    name_zh = (data.get("name_zh") or "").strip()
    name_en = (data.get("name_en") or "").strip()
    if not name_zh:
        return jsonify({"error": "請填寫品種中文名稱"}), 400
    if not name_en:
        return jsonify({"error": "請填寫品種英文名稱"}), 400
    description = (data.get("description") or "").strip()
    if not description:
        return jsonify({"error": "請填寫補充說明並附上參考來源連結"}), 400

    req = BreedRequest(
        user_id=g.current_user_id,
        taxon_id=data.get("taxon_id"),
        name_zh=name_zh,
        name_en=name_en,
        description=description,
    )
    db.session.add(req)
    db.session.commit()

    from ..services.email import notify_new_breed_request

    notify_new_breed_request(req)

    return jsonify(req.to_dict()), 201


@breeds_bp.route("/requests", methods=["GET"])
@admin_required
def list_breed_requests() -> tuple[Response, int]:
    """列出品種請求（管理員）。
    ---
    tags:
      - Breeds
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
    status = request.args.get("status", "pending")
    if status not in ("pending", "received", "in_progress", "completed", "approved", "rejected"):
        return jsonify({"error": "Invalid status filter"}), 400

    reqs = BreedRequest.query.filter_by(status=status).order_by(BreedRequest.created_at.desc()).all()

    return jsonify({"requests": [r.to_dict() for r in reqs]}), 200


@breeds_bp.route("/requests/<int:req_id>", methods=["PATCH"])
@admin_required
def update_breed_request(req_id: int) -> tuple[Response, int]:
    """更新品種請求狀態（管理員）。
    ---
    tags:
      - Breeds
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
    req = db.session.get(BreedRequest, req_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    data = request.get_json() or {}
    new_status = data.get("status")
    if new_status not in ("received", "in_progress", "completed", "rejected"):
        return jsonify({"error": "status must be received, in_progress, completed, or rejected"}), 400

    req.status = new_status
    req.admin_note = data.get("admin_note") or req.admin_note

    from ..services.notifications import create_notification

    create_notification(
        req.user_id, "breed_request", req.id, new_status, req.admin_note, subject_name=req.name_zh or req.name_en
    )

    db.session.commit()

    return jsonify(req.to_dict()), 200
