"""Directory query, pagination and serialisation logic."""

import math
from datetime import datetime
from typing import Any

from sqlalchemy import func

from ...constants import Visibility
from ...extensions import db
from ...models import Breed, FictionalSpecies, OAuthAccount, SpeciesCache, User, VtuberTrait
from ...utils.taxonomy import strip_genus_suffix
from .facets import compute_facets
from .filters import (
    _apply_country_filter,
    _apply_gender_filter,
    _apply_name_filter,
    _apply_org_type_filter,
    _apply_platform_filter,
    _apply_sorting,
    _apply_status_filter,
    _apply_traits_filter,
)


def query_recent_users(since: datetime, limit: int) -> list[dict[str, Any]]:
    """Return recently-joined users who have at least one trait since *since*."""
    latest_trait = func.max(VtuberTrait.created_at).label("latest_trait_at")
    rows = (
        db.session.query(User, latest_trait)
        .join(VtuberTrait, User.id == VtuberTrait.user_id)
        .filter(User.visibility == Visibility.VISIBLE)
        .group_by(User.id)
        .having(latest_trait > since)
        .order_by(latest_trait.desc())
        .limit(limit)
        .all()
    )

    user_ids = [u.id for u, _ in rows]
    species_names = _collect_species_names(user_ids, since)
    entry_locs = _collect_latest_trait_entries(user_ids, since)

    return [
        {
            "id": u.id,
            "display_name": u.display_name,
            "avatar_url": u.avatar_url,
            "created_at": trait_at.isoformat(),
            "species_summary": "、".join(species_names.get(str(u.id), [])[:3]) or None,
            **entry_locs.get(str(u.id), {}),
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
        sp_zh = strip_genus_suffix(sp_zh, sp_rank)

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


def _collect_latest_trait_entries(user_ids: list[Any], since: datetime) -> dict[str, dict[str, Any]]:
    """Return tree-entry location info for each user's latest trait after *since*."""
    if not user_ids:
        return {}

    max_sq = (
        db.session.query(
            VtuberTrait.user_id,
            func.max(VtuberTrait.created_at).label("max_at"),
        )
        .filter(VtuberTrait.user_id.in_(user_ids), VtuberTrait.created_at > since)
        .group_by(VtuberTrait.user_id)
        .subquery()
    )

    trait_rows = (
        db.session.query(
            VtuberTrait.user_id,
            SpeciesCache.taxon_path,
            FictionalSpecies.category_path,
            VtuberTrait.breed_id,
            VtuberTrait.fictional_species_id,
        )
        .join(
            max_sq,
            db.and_(
                VtuberTrait.user_id == max_sq.c.user_id,
                VtuberTrait.created_at == max_sq.c.max_at,
            ),
        )
        .outerjoin(SpeciesCache, VtuberTrait.taxon_id == SpeciesCache.taxon_id)
        .outerjoin(FictionalSpecies, VtuberTrait.fictional_species_id == FictionalSpecies.id)
        .all()
    )

    result: dict[str, dict[str, Any]] = {}
    for uid, taxon_path, fict_path, breed_id, fict_id in trait_rows:
        loc: dict[str, Any] = {}
        if taxon_path:
            loc["entry_taxon_path"] = taxon_path
        if fict_path:
            loc["entry_fictional_path"] = fict_path
        if breed_id is not None:
            loc["entry_breed_id"] = breed_id
        if fict_id is not None:
            loc["entry_fictional_species_id"] = fict_id
        if loc:
            result[str(uid)] = loc
    return result


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
    query = User.query.filter(User.visibility == Visibility.VISIBLE)

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
