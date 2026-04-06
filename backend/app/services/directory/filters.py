"""Directory query filters and sorting logic."""

from datetime import UTC, datetime, timedelta
from typing import Any

from flask_sqlalchemy.query import Query
from sqlalchemy import case, func, literal, or_, text

from ...extensions import db
from ...models import LiveStream, OAuthAccount, User, VtuberTrait


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

    today_str = datetime.now(UTC).date().isoformat()
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
