"""User directory and discovery routes."""

import math
from datetime import UTC, datetime, timedelta
from datetime import date as _date

from flask import Blueprint, jsonify, request
from sqlalchemy import case, func, literal, or_, text

from ..extensions import db
from ..models import Breed, FictionalSpecies, OAuthAccount, SpeciesCache, User, VtuberTrait

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

    # Only return users who have at least one trait (= visible on tree).
    # Use the trait's created_at as the timestamp so the toast timeline
    # aligns with when the user actually appears on the tree.
    latest_trait = func.max(VtuberTrait.created_at).label("latest_trait_at")
    rows = (
        db.session.query(User, latest_trait)
        .join(VtuberTrait, User.id == VtuberTrait.user_id)
        .filter(User.visibility == "visible")
        .group_by(User.id)
        .having(latest_trait > since)
        .order_by(latest_trait.desc())
        .limit(limit)
        .all()
    )

    # Collect species names for each user (real species + breeds + fictional)
    user_ids = [u.id for u, _ in rows]
    species_names = {}
    if user_ids:
        trait_rows = (
            db.session.query(
                VtuberTrait.user_id,
                SpeciesCache.common_name_zh,
                SpeciesCache.scientific_name,
                SpeciesCache.taxon_rank,
                Breed.name_zh.label("breed_zh"),
                Breed.name_en.label("breed_en"),
                FictionalSpecies.name_zh.label("fict_zh"),
                FictionalSpecies.name.label("fict_en"),
            )
            .outerjoin(SpeciesCache, VtuberTrait.taxon_id == SpeciesCache.taxon_id)
            .outerjoin(Breed, VtuberTrait.breed_id == Breed.id)
            .outerjoin(FictionalSpecies, VtuberTrait.fictional_species_id == FictionalSpecies.id)
            .filter(VtuberTrait.user_id.in_(user_ids))
            .filter(VtuberTrait.created_at > since)
            .all()
        )
        for uid, sp_zh, sp_sci, sp_rank, br_zh, br_en, fi_zh, fi_en in trait_rows:
            # Strip genus suffix "屬" from species-level Chinese names
            if (
                sp_zh
                and sp_zh.endswith("屬")
                and len(sp_zh) >= 2
                and (sp_rank or "").upper() in ("SPECIES", "SUBSPECIES", "VARIETY")
            ):
                sp_zh = sp_zh[:-1]
            # Prefer breed name if present, then species name, then fictional
            if br_zh or br_en:
                name = br_zh or br_en
            elif sp_zh or sp_sci:
                name = sp_zh or sp_sci
            elif fi_zh or fi_en:
                name = fi_zh or fi_en
            else:
                name = ""
            if name:
                species_names.setdefault(str(uid), []).append(name)

    return jsonify(
        [
            {
                "id": u.id,
                "display_name": u.display_name,
                "avatar_url": u.avatar_url,
                "created_at": trait_at.isoformat(),
                "species_summary": "、".join(species_names.get(str(u.id), [])[:3]) or None,
            }
            for u, trait_at in rows
        ]
    )


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
    q = request.args.get("q", "").strip()
    country = request.args.get("country", "").strip()
    gender = request.args.get("gender", "").strip()
    status = request.args.get("status", "").strip()
    org_type = request.args.get("org_type", "").strip()
    platform = request.args.get("platform", "").strip()
    has_traits = request.args.get("has_traits", "").strip()
    sort = request.args.get("sort", "created_at").strip()
    order = request.args.get("order", "desc").strip()
    live_first = request.args.get("live_first", "").strip().lower() == "true"
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 24, type=int)

    per_page = min(max(per_page, 1), 100)
    page = max(page, 1)

    query = User.query.filter(User.visibility == "visible")

    # Name search
    if q:
        query = query.filter(User.display_name.ilike(f"%{q}%"))

    # Country flags filter (JSONB containment, OR logic)
    if country:
        raw = [c.strip() for c in country.split(",") if c.strip()]
        codes = [c for c in raw if c.upper() == "NONE" or (len(c) == 2 and c.isalpha())]
        if codes:
            conditions = []
            bind_params = {}
            for i, code in enumerate(codes):
                if code.upper() == "NONE":
                    conditions.append(
                        "(users.country_flags IS NULL"
                        " OR users.country_flags = '[]'::jsonb"
                        " OR users.country_flags::text = 'null')"
                    )
                else:
                    lo_key = f"cc_lo_{i}"
                    up_key = f"cc_up_{i}"
                    bind_params[lo_key] = f'["{code.lower()}"]'
                    bind_params[up_key] = f'["{code.upper()}"]'
                    conditions.append(
                        f"(users.country_flags @> :{lo_key}::jsonb OR users.country_flags @> :{up_key}::jsonb)"
                    )
            query = query.filter(text("(" + " OR ".join(conditions) + ")").bindparams(**bind_params))

    # Gender filter
    if gender:
        vals = [v.strip() for v in gender.split(",") if v.strip()]
        if vals:
            conditions = []
            for v in vals:
                if v == "unset":
                    conditions.append(
                        or_(
                            User.profile_data["gender"].astext.is_(None),
                            text("users.profile_data->>'gender' IS NULL"),
                            text("users.profile_data->>'gender' = ''"),
                        )
                    )
                elif v == "other":
                    conditions.append(
                        text(
                            "users.profile_data->>'gender' IS NOT NULL "
                            "AND users.profile_data->>'gender' != '' "
                            "AND users.profile_data->>'gender' NOT IN ('男', '女')"
                        )
                    )
                else:
                    conditions.append(text("users.profile_data->>'gender' = :g").bindparams(g=v))
            query = query.filter(or_(*conditions))

    # Activity status filter (with debut_date auto-switch logic)
    if status:
        vals = [v.strip() for v in status.split(",") if v.strip()]
        if vals:
            today_str = _date.today().isoformat()
            conditions = []
            for v in vals:
                if v == "active":
                    conditions.append(
                        or_(
                            text("users.profile_data->>'activity_status' = 'active'"),
                            text(
                                "users.profile_data->>'activity_status' = 'preparing' "
                                "AND users.profile_data->>'debut_date' IS NOT NULL "
                                "AND users.profile_data->>'debut_date' <= :today"
                            ).bindparams(today=today_str),
                        )
                    )
                elif v == "preparing":
                    conditions.append(
                        text(
                            "users.profile_data->>'activity_status' = 'preparing' "
                            "AND (users.profile_data->>'debut_date' IS NULL "
                            "OR users.profile_data->>'debut_date' > :today)"
                        ).bindparams(today=today_str)
                    )
                else:
                    conditions.append(text("users.profile_data->>'activity_status' = :s").bindparams(s=v))
            query = query.filter(or_(*conditions))

    # Organization type filter
    if org_type in ("corporate", "indie", "club"):
        query = query.filter(User.org_type == org_type)

    # Platform filter
    if platform:
        providers = [p.strip() for p in platform.split(",") if p.strip()]
        if providers:
            query = query.filter(
                User.id.in_(
                    db.session.query(OAuthAccount.user_id).filter(OAuthAccount.provider.in_(providers)).distinct()
                )
            )

    # Has traits filter
    if has_traits == "true":
        query = query.filter(User.id.in_(db.session.query(VtuberTrait.user_id).distinct()))
    elif has_traits == "false":
        query = query.filter(~User.id.in_(db.session.query(VtuberTrait.user_id).distinct()))

    # Sorting
    valid_sorts = ("debut_date", "name", "created_at", "active_first", "organization")
    if sort not in valid_sorts:
        sort = "created_at"
    if order not in ("asc", "desc"):
        order = "desc"

    # Live-pinning: only when live_first toggle is on or sort is active_first
    live_weight = None
    if live_first or sort == "active_first":
        from ..models import LiveStream

        is_live = db.session.query(LiveStream.user_id).filter(LiveStream.user_id == User.id).correlate(User).exists()
        live_weight = case((is_live, 1), else_=0)

    if sort == "active_first":
        seven_days_ago = datetime.now(UTC) - timedelta(days=7)
        recent_live = case(
            (User.last_live_at > seven_days_ago, User.last_live_at),
            else_=literal(None).cast(db.DateTime(timezone=True)),
        )
        query = query.order_by(live_weight.desc(), recent_live.desc().nullslast(), User.display_name.asc())
    elif sort == "organization":
        org_priority = case((User.org_type == "corporate", 0), (User.org_type == "club", 1), else_=2)
        dir_fn = (lambda c: c.asc()) if order == "asc" else (lambda c: c.desc())
        order_clauses = []
        if live_weight is not None:
            order_clauses.append(live_weight.desc())
        order_clauses.extend(
            [dir_fn(org_priority), dir_fn(func.coalesce(User.organization, "")), User.display_name.asc()]
        )
        query = query.order_by(*order_clauses)
    elif sort == "name":
        dir_fn = (lambda c: c.asc()) if order == "asc" else (lambda c: c.desc())
        order_clauses = []
        if live_weight is not None:
            order_clauses.append(live_weight.desc())
        order_clauses.append(dir_fn(User.display_name))
        query = query.order_by(*order_clauses)
    elif sort == "debut_date":
        order_clauses = []
        if live_weight is not None:
            order_clauses.append(live_weight.desc())
        if order == "asc":
            order_clauses.append(text("users.profile_data->>'debut_date' ASC NULLS LAST"))
        else:
            order_clauses.append(text("users.profile_data->>'debut_date' DESC NULLS LAST"))
        query = query.order_by(*order_clauses)
    else:  # created_at
        dir_fn = (lambda c: c.asc()) if order == "asc" else (lambda c: c.desc())
        order_clauses = []
        if live_weight is not None:
            order_clauses.append(live_weight.desc())
        order_clauses.append(dir_fn(User.created_at))
        query = query.order_by(*order_clauses)

    # Count + paginate
    total = query.count()
    total_pages = max(1, math.ceil(total / per_page))
    users = query.offset((page - 1) * per_page).limit(per_page).all()
    user_ids = [u.id for u in users]

    # Batch load platforms
    platforms_map = {}
    if user_ids:
        accounts = OAuthAccount.query.filter(OAuthAccount.user_id.in_(user_ids)).all()
        for a in accounts:
            uid = str(a.user_id)
            platforms_map.setdefault(uid, set()).add(a.provider)

    # Batch load species names
    species_map = {}
    if user_ids:
        traits = VtuberTrait.query.filter(VtuberTrait.user_id.in_(user_ids)).all()
        for t in traits:
            uid = str(t.user_id)
            name = t.computed_display_name() or "?"
            species_map.setdefault(uid, []).append(name)

    items = []
    for u in users:
        uid = str(u.id)
        pd = u._computed_profile_data()
        items.append(
            {
                "id": uid,
                "display_name": u.display_name,
                "avatar_url": u.avatar_url,
                "organization": u.organization,
                "org_type": u.org_type or "indie",
                "country_flags": u.country_flags or [],
                "last_live_at": u.last_live_at.isoformat() if u.last_live_at else None,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "profile_data": {
                    "gender": pd.get("gender"),
                    "activity_status": pd.get("activity_status"),
                    "debut_date": pd.get("debut_date"),
                    "representative_emoji": pd.get("representative_emoji"),
                    "illustrators": pd.get("illustrators") or [],
                    "riggers": pd.get("riggers") or [],
                    "modelers_3d": pd.get("modelers_3d") or [],
                },
                "platforms": sorted(platforms_map.get(uid, [])),
                "species_names": species_map.get(uid, []),
                "has_traits": uid in species_map,
            }
        )

    facets = _compute_facets()

    return jsonify(
        {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "facets": facets,
        }
    )


def _compute_facets():
    today_str = _date.today().isoformat()
    facets = {}

    # Country counts (unnest JSONB array)
    rows = db.session.execute(
        text(
            "SELECT UPPER(elem::text), COUNT(DISTINCT u.id) "
            "FROM users u, jsonb_array_elements_text(u.country_flags) AS elem "
            "GROUP BY 1"
        )
    ).fetchall()
    facets["country"] = {r[0]: r[1] for r in rows}

    # No-flag count
    facets["country_none"] = (
        db.session.execute(
            text(
                "SELECT COUNT(*) FROM users "
                "WHERE country_flags IS NULL "
                "OR country_flags = '[]'::jsonb "
                "OR country_flags::text = 'null'"
            )
        ).scalar()
        or 0
    )

    # Gender counts
    rows = db.session.execute(
        text(
            "SELECT "
            "  CASE "
            "    WHEN profile_data->>'gender' IS NULL "
            "      OR profile_data->>'gender' = '' THEN 'unset' "
            "    WHEN profile_data->>'gender' IN ('男','女') "
            "      THEN profile_data->>'gender' "
            "    ELSE 'other' "
            "  END, "
            "  COUNT(*) "
            "FROM users GROUP BY 1"
        )
    ).fetchall()
    facets["gender"] = {r[0]: r[1] for r in rows}

    # Status counts (with preparing→active auto-switch)
    rows = db.session.execute(
        text(
            "SELECT "
            "  CASE "
            "    WHEN profile_data->>'activity_status' = 'active' THEN 'active' "
            "    WHEN profile_data->>'activity_status' = 'preparing' "
            "      AND profile_data->>'debut_date' IS NOT NULL "
            "      AND profile_data->>'debut_date' <= :today THEN 'active' "
            "    WHEN profile_data->>'activity_status' = 'preparing' THEN 'preparing' "
            "    WHEN profile_data->>'activity_status' = 'hiatus' THEN 'hiatus' "
            "    ELSE '_none' "
            "  END, "
            "  COUNT(*) "
            "FROM users GROUP BY 1"
        ),
        {"today": today_str},
    ).fetchall()
    facets["status"] = {r[0]: r[1] for r in rows if r[0] != "_none"}

    # Org type counts
    rows = db.session.execute(text("SELECT COALESCE(org_type, 'indie'), COUNT(*) FROM users GROUP BY 1")).fetchall()
    facets["org_type"] = {r[0]: r[1] for r in rows}
    total_users = sum(facets["org_type"].values())

    # Platform counts
    rows = db.session.execute(
        text("SELECT provider, COUNT(DISTINCT user_id) FROM oauth_accounts GROUP BY provider")
    ).fetchall()
    facets["platform"] = {r[0]: r[1] for r in rows}

    # Has traits counts
    with_traits = db.session.execute(text("SELECT COUNT(DISTINCT user_id) FROM vtuber_traits")).scalar() or 0
    facets["has_traits"] = {
        "true": with_traits,
        "false": total_users - with_traits,
    }

    return facets
