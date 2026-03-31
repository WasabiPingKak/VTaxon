"""Business logic for user directory and discovery."""

import math
from datetime import UTC, datetime, timedelta
from datetime import date as _date
from typing import Any

from flask_sqlalchemy.query import Query
from sqlalchemy import case, func, literal, or_, text

from ..extensions import db
from ..models import Breed, FictionalSpecies, LiveStream, OAuthAccount, SpeciesCache, User, VtuberTrait


def query_recent_users(since: datetime, limit: int) -> list[dict[str, Any]]:
    """Return recently-joined users who have at least one trait since *since*."""
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

    user_ids = [u.id for u, _ in rows]
    species_names = _collect_species_names(user_ids, since)

    return [
        {
            "id": u.id,
            "display_name": u.display_name,
            "avatar_url": u.avatar_url,
            "created_at": trait_at.isoformat(),
            "species_summary": "、".join(species_names.get(str(u.id), [])[:3]) or None,
        }
        for u, trait_at in rows
    ]


def _collect_species_names(user_ids: list[Any], since: datetime) -> dict[str, list[str]]:
    """Batch-load species display names for the given users (traits after *since*)."""
    if not user_ids:
        return {}

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

    names: dict[str, list[str]] = {}
    for uid, sp_zh, sp_sci, sp_rank, br_zh, br_en, fi_zh, fi_en in trait_rows:
        if (
            sp_zh
            and sp_zh.endswith("屬")
            and len(sp_zh) >= 2
            and (sp_rank or "").upper() in ("SPECIES", "SUBSPECIES", "VARIETY")
        ):
            sp_zh = sp_zh[:-1]

        if br_zh or br_en:
            name = br_zh or br_en
        elif sp_zh or sp_sci:
            name = sp_zh or sp_sci
        elif fi_zh or fi_en:
            name = fi_zh or fi_en
        else:
            name = ""
        if name:
            names.setdefault(str(uid), []).append(name)

    return names


# ---------------------------------------------------------------------------
# Directory listing
# ---------------------------------------------------------------------------


def query_directory(
    *,
    q: str | None,
    country: str | None,
    gender: str | None,
    status: str | None,
    org_type: str | None,
    platform: str | None,
    has_traits: str | None,
    sort: str,
    order: str,
    live_first: bool,
    page: int,
    per_page: int,
) -> dict[str, Any]:
    """Build, filter, sort and paginate the user directory query.

    Returns a dict ready for JSON serialisation.
    """
    query = User.query.filter(User.visibility == "visible")

    # Filters
    query = _apply_name_filter(query, q)
    query = _apply_country_filter(query, country)
    query = _apply_gender_filter(query, gender)
    query = _apply_status_filter(query, status)
    query = _apply_org_type_filter(query, org_type)
    query = _apply_platform_filter(query, platform)
    query = _apply_traits_filter(query, has_traits)

    # Sorting
    query = _apply_sorting(query, sort, order, live_first)

    # Paginate
    total = query.count()
    total_pages = max(1, math.ceil(total / per_page))
    users = query.offset((page - 1) * per_page).limit(per_page).all()
    user_ids = [u.id for u in users]

    # Batch load related data
    platforms_map = _batch_load_platforms(user_ids)
    species_map = _batch_load_species(user_ids)

    items = [_serialize_user(u, platforms_map, species_map) for u in users]
    facets = compute_facets()

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "facets": facets,
    }


# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------


def _apply_name_filter(query: Query, q: str | None) -> Query:
    if q:
        query = query.filter(User.display_name.ilike(f"%{q}%"))
    return query


def _apply_country_filter(query: Query, country: str | None) -> Query:
    if not country:
        return query
    raw = [c.strip() for c in country.split(",") if c.strip()]
    codes = [c for c in raw if c.upper() == "NONE" or (len(c) == 2 and c.isalpha())]
    if not codes:
        return query

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
            conditions.append(f"(users.country_flags @> :{lo_key}::jsonb OR users.country_flags @> :{up_key}::jsonb)")
    return query.filter(text("(" + " OR ".join(conditions) + ")").bindparams(**bind_params))


def _apply_gender_filter(query: Query, gender: str | None) -> Query:
    if not gender:
        return query
    vals = [v.strip() for v in gender.split(",") if v.strip()]
    if not vals:
        return query

    conditions: list[Any] = []
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
    return query.filter(or_(*conditions))


def _apply_status_filter(query: Query, status: str | None) -> Query:
    if not status:
        return query
    vals = [v.strip() for v in status.split(",") if v.strip()]
    if not vals:
        return query

    today_str = _date.today().isoformat()
    conditions: list[Any] = []
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
    return query.filter(or_(*conditions))


def _apply_org_type_filter(query: Query, org_type: str | None) -> Query:
    if org_type in ("corporate", "indie", "club"):
        query = query.filter(User.org_type == org_type)
    return query


def _apply_platform_filter(query: Query, platform: str | None) -> Query:
    if not platform:
        return query
    providers = [p.strip() for p in platform.split(",") if p.strip()]
    if providers:
        query = query.filter(
            User.id.in_(db.session.query(OAuthAccount.user_id).filter(OAuthAccount.provider.in_(providers)).distinct())
        )
    return query


def _apply_traits_filter(query: Query, has_traits: str | None) -> Query:
    if has_traits == "true":
        query = query.filter(User.id.in_(db.session.query(VtuberTrait.user_id).distinct()))
    elif has_traits == "false":
        query = query.filter(~User.id.in_(db.session.query(VtuberTrait.user_id).distinct()))
    return query


# ---------------------------------------------------------------------------
# Sorting
# ---------------------------------------------------------------------------


def _apply_sorting(query: Query, sort: str, order: str, live_first: bool) -> Query:
    valid_sorts = ("debut_date", "name", "created_at", "active_first", "organization")
    if sort not in valid_sorts:
        sort = "created_at"
    if order not in ("asc", "desc"):
        order = "desc"

    live_weight = None
    if live_first or sort == "active_first":
        is_live = db.session.query(LiveStream.user_id).filter(LiveStream.user_id == User.id).correlate(User).exists()
        live_weight = case((is_live, 1), else_=0)

    if sort == "active_first":
        seven_days_ago = datetime.now(UTC) - timedelta(days=7)
        recent_live = case(
            (User.last_live_at > seven_days_ago, User.last_live_at),
            else_=literal(None).cast(db.DateTime(timezone=True)),
        )
        query = query.order_by(live_weight.desc(), recent_live.desc().nullslast(), User.display_name.asc())  # type: ignore[union-attr]
    elif sort == "organization":
        org_priority = case((User.org_type == "corporate", 0), (User.org_type == "club", 1), else_=2)
        dir_fn: Any = (lambda c: c.asc()) if order == "asc" else (lambda c: c.desc())
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
            order_clauses.append(text("users.profile_data->>'debut_date' ASC NULLS LAST"))  # type: ignore[arg-type]
        else:
            order_clauses.append(text("users.profile_data->>'debut_date' DESC NULLS LAST"))  # type: ignore[arg-type]
        query = query.order_by(*order_clauses)
    else:  # created_at
        dir_fn = (lambda c: c.asc()) if order == "asc" else (lambda c: c.desc())
        order_clauses = []
        if live_weight is not None:
            order_clauses.append(live_weight.desc())
        order_clauses.append(dir_fn(User.created_at))
        query = query.order_by(*order_clauses)

    return query


# ---------------------------------------------------------------------------
# Batch loaders
# ---------------------------------------------------------------------------


def _batch_load_platforms(user_ids: list[Any]) -> dict[str, set[str]]:
    if not user_ids:
        return {}
    platforms_map: dict[str, set[str]] = {}
    accounts = OAuthAccount.query.filter(OAuthAccount.user_id.in_(user_ids)).all()
    for a in accounts:
        uid = str(a.user_id)
        platforms_map.setdefault(uid, set()).add(a.provider)
    return platforms_map


def _batch_load_species(user_ids: list[Any]) -> dict[str, list[str]]:
    if not user_ids:
        return {}
    species_map: dict[str, list[str]] = {}
    traits = VtuberTrait.query.filter(VtuberTrait.user_id.in_(user_ids)).all()
    for t in traits:
        uid = str(t.user_id)
        name = t.computed_display_name() or "?"
        species_map.setdefault(uid, []).append(name)
    return species_map


# ---------------------------------------------------------------------------
# Serialisation
# ---------------------------------------------------------------------------


def _serialize_user(u: User, platforms_map: dict[str, set[str]], species_map: dict[str, list[str]]) -> dict[str, Any]:
    uid = str(u.id)
    pd = u._computed_profile_data()
    return {
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


# ---------------------------------------------------------------------------
# Facets
# ---------------------------------------------------------------------------


def compute_facets() -> dict[str, Any]:
    """Compute aggregated facet statistics for the directory sidebar."""
    today_str = _date.today().isoformat()
    facets: dict[str, Any] = {}

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
