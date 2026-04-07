import logging
from typing import Any

from flask import Blueprint, Response, jsonify, request
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

from ..auth import admin_required
from ..cache import (
    get_fictional_tree_cache,
    get_tree_cache,
    invalidate_fictional_tree_cache,
    invalidate_tree_cache,
    set_fictional_tree_cache,
    set_tree_cache,
)
from ..constants import Visibility
from ..extensions import db
from ..limiter import limiter
from ..models import FictionalSpecies, OAuthAccount, SpeciesCache, User, VtuberTrait
from ..services.gbif import _realign_taxon_path  # type: ignore[attr-defined]
from ..services.taxonomy_path import (
    assign_default_primary,
    compute_path_ranks,
    inject_medusozoa,
    rebuild_path_zh,
)
from ..services.taxonomy_zh import get_parent_species_zh_by_name, get_species_zh_override

logger = logging.getLogger(__name__)

taxonomy_bp = Blueprint("taxonomy", __name__)
limiter.limit("30/minute")(taxonomy_bp)


@taxonomy_bp.route("/tree", methods=["GET"])
def get_taxonomy_tree() -> Response:
    """取得完整的現實物種分類樹。
    ---
    tags:
      - Taxonomy
    parameters:
      - name: refresh
        in: query
        type: string
        description: 設為 1 強制刷新快取（需管理員權限）
    responses:
      200:
        description: 分類樹資料（含所有 trait entries）
        schema:
          type: object
          properties:
            entries:
              type: array
              items:
                type: object
    """
    # refresh=1 requires admin authentication
    use_cache = True
    if request.args.get("refresh"):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            from ..auth import get_current_user
            from ..models import AuthIdAlias

            uid = get_current_user()
            if uid:
                alias = db.session.get(AuthIdAlias, uid)
                if alias:
                    uid = alias.user_id
                user = db.session.get(User, str(uid))
                if user and user.role == "admin":
                    use_cache = False

    if use_cache:
        cached = get_tree_cache()
        if cached:
            return jsonify(cached)

    rows = (
        db.session.query(VtuberTrait, SpeciesCache, User)
        .join(SpeciesCache, VtuberTrait.taxon_id == SpeciesCache.taxon_id)
        .join(User, VtuberTrait.user_id == User.id)
        .filter(VtuberTrait.taxon_id.isnot(None))
        .filter(User.visibility == Visibility.VISIBLE)
        .order_by(User.created_at.desc())
        .all()
    )

    # Batch query platforms to avoid N+1 (deduplicate providers per user)
    user_ids = list({user.id for _, _, user in rows})
    platform_rows = (
        (
            db.session.query(OAuthAccount.user_id, OAuthAccount.provider)
            .filter(OAuthAccount.user_id.in_(user_ids))
            .distinct()
            .all()
        )
        if user_ids
        else []
    )
    user_platforms: dict[str, list[str]] = {}
    for uid, provider in platform_rows:
        user_platforms.setdefault(uid, []).append(provider)

    # Batch query total trait count per user (real + fictional) for visual budget
    trait_count_rows = (
        (
            db.session.query(VtuberTrait.user_id, func.count(VtuberTrait.id))
            .filter(VtuberTrait.user_id.in_(user_ids))
            .group_by(VtuberTrait.user_id)
            .all()
        )
        if user_ids
        else []
    )
    user_trait_counts: dict[str, int] = dict(trait_count_rows)

    needs_commit = False
    entries: list[dict[str, Any]] = []
    _parent_override_cache: dict[str, str | None] = {}  # parent_binomial → override zh or None
    for trait, species, user in rows:
        # Read pre-computed path_zh from DB (written at cache-time by _cache_species)
        path_zh = species.path_zh or {}

        # Auto-rebuild path_zh from static table if empty
        if not path_zh or path_zh == {}:
            path_zh = rebuild_path_zh(species)
            if path_zh:
                needs_commit = True

        # Apply species zh override to DB cache if needed
        zh_override = get_species_zh_override(species.taxon_id)
        if zh_override and species.common_name_zh != zh_override:
            species.common_name_zh = zh_override
            needs_commit = True

        # For SUBSPECIES/VARIETY/FORM: apply parent species override to path_zh['species']
        rank_upper = (species.taxon_rank or "").upper()
        if rank_upper in ("SUBSPECIES", "VARIETY", "FORM"):
            parts = (species.scientific_name or "").split()
            if len(parts) >= 2:
                parent_binomial = " ".join(parts[:2])
                if parent_binomial not in _parent_override_cache:
                    # Try DB lookup first, then static name-based fallback
                    parent = SpeciesCache.query.filter(
                        SpeciesCache.scientific_name.ilike(f"{parent_binomial}%"),
                        SpeciesCache.taxon_rank == "SPECIES",
                    ).first()
                    _parent_override_cache[parent_binomial] = (
                        get_species_zh_override(parent.taxon_id)
                        if parent
                        else get_parent_species_zh_by_name(parent_binomial)
                    )
                parent_zh = _parent_override_cache[parent_binomial]
                if parent_zh and path_zh and path_zh.get("species") != parent_zh:
                    path_zh = dict(path_zh) if path_zh else {}
                    path_zh["species"] = parent_zh
                    species.path_zh = path_zh
                    needs_commit = True

        # Realign taxon_path to include empty segments for missing ranks
        taxon_path, path_changed = _realign_taxon_path(species)
        if path_changed:
            needs_commit = True

        # Breed info: prefer breed object, fallback to legacy free-text
        breed_id = trait.breed_id
        breed_name_zh = None
        breed_name_en = None
        breed_name = trait.breed_name  # legacy fallback
        if trait.breed:
            breed_name_zh = trait.breed.name_zh
            breed_name_en = trait.breed.name_en
            breed_name = breed_name_zh or breed_name_en

        pd = user._computed_profile_data()
        entries.append(
            {
                "trait_id": trait.id,
                "user_id": user.id,
                "display_name": user.display_name,
                "avatar_url": user.avatar_url,
                "country_flags": user.country_flags or [],
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "organization": user.organization,
                "org_type": user.org_type or "indie",
                "gender": pd.get("gender"),
                "activity_status": pd.get("activity_status"),
                "debut_date": pd.get("debut_date"),
                "last_live_at": user.last_live_at.isoformat() if user.last_live_at else None,
                "platforms": user_platforms.get(user.id, []),
                "trait_count": user_trait_counts.get(user.id, 0),
                "is_live_primary": str(trait.id) == str(user.live_primary_real_trait_id),
                "taxon_id": species.taxon_id,
                "taxon_rank": species.taxon_rank,
                "taxon_path": taxon_path,
                "path_ranks": compute_path_ranks(taxon_path, species.taxon_rank),
                "scientific_name": species.scientific_name,
                "common_name_zh": get_species_zh_override(species.taxon_id) or species._effective_common_name_zh(),
                "alternative_names_zh": species.alternative_names_zh,
                "breed_name": breed_name,
                "breed_id": breed_id,
                "breed_name_zh": breed_name_zh,
                "breed_name_en": breed_name_en,
                "path_zh": path_zh,
            }
        )

    # Persist rebuilt path_zh to DB so future reads are instant
    if needs_commit:
        try:
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            logger.exception("Failed to persist path_zh updates")

    # Post-process: inject Medusozoa subphylum for display
    inject_medusozoa(entries)

    # Auto-assign is_live_primary for users who haven't set one
    assign_default_primary(entries)

    result = {"entries": entries}
    set_tree_cache(result)
    return jsonify(result)


@taxonomy_bp.route("/cache", methods=["DELETE"])
@admin_required
def clear_cache() -> tuple[Response, int]:
    """清除所有分類樹快取（管理員）。
    ---
    tags:
      - Taxonomy
    security:
      - BearerAuth: []
    responses:
      200:
        description: 快取已清除
    """
    invalidate_tree_cache()
    invalidate_fictional_tree_cache()
    return jsonify({"message": "Cache cleared"}), 200


@taxonomy_bp.route("/fictional-tree", methods=["GET"])
def get_fictional_tree() -> Response:
    """取得完整的虛構物種分類樹。
    ---
    tags:
      - Taxonomy
    parameters:
      - name: refresh
        in: query
        type: string
        description: 設為 1 強制刷新快取（需管理員權限）
    responses:
      200:
        description: 虛構分類樹資料
        schema:
          type: object
          properties:
            entries:
              type: array
              items:
                type: object
    """
    # refresh=1 requires admin authentication
    use_cache = True
    if request.args.get("refresh"):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            from ..auth import get_current_user
            from ..models import AuthIdAlias

            uid = get_current_user()
            if uid:
                alias = db.session.get(AuthIdAlias, uid)
                if alias:
                    uid = alias.user_id
                user = db.session.get(User, str(uid))
                if user and user.role == "admin":
                    use_cache = False

    if use_cache:
        cached = get_fictional_tree_cache()
        if cached:
            return jsonify(cached)

    rows = (
        db.session.query(VtuberTrait, FictionalSpecies, User)
        .join(FictionalSpecies, VtuberTrait.fictional_species_id == FictionalSpecies.id)
        .join(User, VtuberTrait.user_id == User.id)
        .filter(VtuberTrait.fictional_species_id.isnot(None))
        .filter(User.visibility == Visibility.VISIBLE)
        .order_by(User.created_at.desc())
        .all()
    )

    # Batch query platforms to avoid N+1 (deduplicate providers per user)
    user_ids = list({user.id for _, _, user in rows})
    platform_rows = (
        (
            db.session.query(OAuthAccount.user_id, OAuthAccount.provider)
            .filter(OAuthAccount.user_id.in_(user_ids))
            .distinct()
            .all()
        )
        if user_ids
        else []
    )
    user_platforms: dict[str, list[str]] = {}
    for uid, provider in platform_rows:
        user_platforms.setdefault(uid, []).append(provider)

    # Batch query total trait count per user (real + fictional) for visual budget
    trait_count_rows = (
        (
            db.session.query(VtuberTrait.user_id, func.count(VtuberTrait.id))
            .filter(VtuberTrait.user_id.in_(user_ids))
            .group_by(VtuberTrait.user_id)
            .all()
        )
        if user_ids
        else []
    )
    user_trait_counts: dict[str, int] = dict(trait_count_rows)

    entries: list[dict[str, Any]] = []
    for trait, fictional, user in rows:
        # Use category_path directly; fallback to legacy construction
        fictional_path = fictional.category_path
        if not fictional_path:
            path_parts = [fictional.origin]
            if fictional.sub_origin:
                path_parts.append(fictional.sub_origin)
            path_parts.append(fictional.name)
            fictional_path = "|".join(path_parts)

        # Extract type from category_path (4-segment paths have type at index 2)
        path_segments = fictional_path.split("|")
        fictional_type = path_segments[2] if len(path_segments) >= 4 else None

        pd = user._computed_profile_data()
        entries.append(
            {
                "trait_id": trait.id,
                "user_id": user.id,
                "display_name": user.display_name,
                "avatar_url": user.avatar_url,
                "country_flags": user.country_flags or [],
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "organization": user.organization,
                "org_type": user.org_type or "indie",
                "gender": pd.get("gender"),
                "activity_status": pd.get("activity_status"),
                "debut_date": pd.get("debut_date"),
                "last_live_at": user.last_live_at.isoformat() if user.last_live_at else None,
                "platforms": user_platforms.get(user.id, []),
                "trait_count": user_trait_counts.get(user.id, 0),
                "is_live_primary": str(trait.id) == str(user.live_primary_fictional_trait_id),
                "fictional_species_id": fictional.id,
                "fictional_path": fictional_path,
                "fictional_name": fictional.name,
                "fictional_name_zh": fictional.name_zh or fictional.name,
                "origin": fictional.origin,
                "sub_origin": fictional.sub_origin,
                "fictional_type": fictional_type,
            }
        )

    # Auto-assign is_live_primary for users who haven't set one
    assign_default_primary(entries)

    result = {"entries": entries}
    set_fictional_tree_cache(result)
    return jsonify(result)
