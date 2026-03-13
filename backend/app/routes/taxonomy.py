import logging

from flask import Blueprint, jsonify, request

from ..auth import admin_required
from ..limiter import limiter
from ..cache import (get_tree_cache, set_tree_cache, invalidate_tree_cache,
                     get_fictional_tree_cache, set_fictional_tree_cache,
                     invalidate_fictional_tree_cache)
from ..extensions import db
from ..models import User, VtuberTrait, SpeciesCache, FictionalSpecies, OAuthAccount
from ..services.gbif import _build_path_zh, _realign_taxon_path
from ..services.taxonomy_zh import get_species_zh_override, get_parent_species_zh_by_name

log = logging.getLogger(__name__)

taxonomy_bp = Blueprint('taxonomy', __name__)
limiter.limit("30/minute")(taxonomy_bp)

# Standard 7-position rank order for taxon_path
_STANDARD_RANKS = ['KINGDOM', 'PHYLUM', 'CLASS', 'ORDER', 'FAMILY', 'GENUS', 'SPECIES']

# Medusozoa classes: Cnidaria classes that belong under the Medusozoa subphylum
_MEDUSOZOA_CLASSES = {'Scyphozoa', 'Cubozoa', 'Staurozoa', 'Hydrozoa'}

def _compute_path_ranks(taxon_path, taxon_rank):
    """Compute a rank label array for each segment of taxon_path.

    Standard 7-segment paths map 1:1 to _STANDARD_RANKS.
    SUBPHYLUM taxa (3 segments like Animalia|Cnidaria|Medusozoa):
        → ['KINGDOM', 'PHYLUM', 'SUBPHYLUM']
    SUBCLASS taxa (4 segments like Animalia|Cnidaria|Hydrozoa|Hydroidolina):
        → ['KINGDOM', 'PHYLUM', 'CLASS', 'SUBCLASS']
    """
    if not taxon_path:
        return []
    parts = taxon_path.split('|')
    n = len(parts)
    rank_upper = (taxon_rank or '').upper()

    # For SUBPHYLUM/SUBCLASS, the last segment is the sub-rank taxon itself
    if rank_upper == 'SUBPHYLUM' and n >= 2:
        ranks = list(_STANDARD_RANKS[:n - 1])
        ranks.append('SUBPHYLUM')
        return ranks
    if rank_upper == 'SUBCLASS' and n >= 3:
        ranks = list(_STANDARD_RANKS[:n - 1])
        ranks.append('SUBCLASS')
        return ranks

    # SUBSPECIES/VARIETY/FORM: 8-segment path (7 standard + sub-species rank)
    _SUB_SPECIES_RANKS = {'SUBSPECIES', 'VARIETY', 'FORM'}
    if rank_upper in _SUB_SPECIES_RANKS and n > len(_STANDARD_RANKS):
        ranks = list(_STANDARD_RANKS)  # first 7 (KINGDOM→SPECIES)
        ranks.append(rank_upper)       # 8th segment
        return ranks

    # Standard path: use positional mapping
    return list(_STANDARD_RANKS[:n])


def _inject_medusozoa(entries):
    """Post-process entries to inject Medusozoa subphylum between Cnidaria and its classes.

    Only modifies entries where phylum=Cnidaria and class is one of the
    Medusozoa classes. Inserts 'Medusozoa' into taxon_path and updates
    path_ranks and path_zh accordingly.

    This is display-only — does NOT modify the DB.
    """
    for entry in entries:
        path = entry.get('taxon_path')
        if not path:
            continue

        parts = path.split('|')
        path_ranks = entry.get('path_ranks', [])

        # Find phylum position (should be index 1)
        phylum_idx = None
        for i, r in enumerate(path_ranks):
            if r == 'PHYLUM':
                phylum_idx = i
                break
        if phylum_idx is None or phylum_idx + 1 >= len(parts):
            continue

        # Check: is this a Cnidaria entry with a Medusozoa class?
        if parts[phylum_idx] != 'Cnidaria':
            continue
        class_idx = phylum_idx + 1
        if class_idx >= len(parts):
            continue
        class_name = parts[class_idx]
        if class_name not in _MEDUSOZOA_CLASSES:
            continue

        # Insert Medusozoa between phylum and class
        insert_pos = phylum_idx + 1
        parts.insert(insert_pos, 'Medusozoa')
        path_ranks.insert(insert_pos, 'SUBPHYLUM')

        entry['taxon_path'] = '|'.join(parts)
        entry['path_ranks'] = path_ranks

        # Update path_zh with subphylum
        pzh = entry.get('path_zh') or {}
        if isinstance(pzh, dict):
            pzh['subphylum'] = '水母亞門'
            entry['path_zh'] = pzh


def _rebuild_path_zh(species):
    """Rebuild path_zh using full fallback chain (static table + Wikidata).

    Uses _build_path_zh which has @lru_cache on Wikidata calls,
    so external API hits only happen once per unique rank name.
    """
    data = {
        'kingdom': species.kingdom,
        'phylum': species.phylum,
        'class': species.class_,
        'order': species.order_,
        'family': species.family,
        'genus': species.genus,
        'taxon_rank': species.taxon_rank,
        'scientific_name': species.scientific_name,
    }
    rank = (species.taxon_rank or '').upper()
    if rank in ('SUBSPECIES', 'VARIETY', 'FORM'):
        # Derive parent species binomial and look up its taxon_id for zh resolution
        parts = (species.scientific_name or '').split()
        parent_binomial = ' '.join(parts[:2]) if len(parts) >= 2 else None
        if parent_binomial:
            parent = SpeciesCache.query.filter(
                SpeciesCache.scientific_name.ilike(f'{parent_binomial}%'),
                SpeciesCache.taxon_rank == 'SPECIES',
            ).first()
            if parent:
                data['speciesKey'] = parent.taxon_id
                data['species'] = parent_binomial
    result = _build_path_zh(data)
    if result:
        species.path_zh = result
    return result


@taxonomy_bp.route('/tree', methods=['GET'])
def get_taxonomy_tree():
    """Return all vtuber traits with real species, joined with user and species data.

    Frontend builds the tree structure from the flat list using taxon_path.
    Uses in-process cache (TTL 5 min) to avoid repeated DB queries.
    """
    # refresh=1 requires admin authentication
    use_cache = True
    if request.args.get('refresh'):
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            from ..auth import get_current_user
            from ..models import AuthIdAlias
            uid = get_current_user()
            if uid:
                alias = db.session.get(AuthIdAlias, uid)
                if alias:
                    uid = alias.user_id
                user = db.session.get(User, str(uid))
                if user and user.role == 'admin':
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
        .order_by(User.created_at.desc())
        .all()
    )

    # Batch query platforms to avoid N+1 (deduplicate providers per user)
    user_ids = list({user.id for _, _, user in rows})
    platform_rows = (
        db.session.query(OAuthAccount.user_id, OAuthAccount.provider)
        .filter(OAuthAccount.user_id.in_(user_ids))
        .distinct()
        .all()
    ) if user_ids else []
    user_platforms = {}
    for uid, provider in platform_rows:
        user_platforms.setdefault(uid, []).append(provider)

    needs_commit = False
    entries = []
    _parent_override_cache = {}  # parent_binomial → override zh or None
    for trait, species, user in rows:
        # Read pre-computed path_zh from DB (written at cache-time by _cache_species)
        path_zh = species.path_zh or {}

        # Auto-rebuild path_zh from static table if empty
        if not path_zh or path_zh == {}:
            path_zh = _rebuild_path_zh(species)
            if path_zh:
                needs_commit = True

        # Apply species zh override to DB cache if needed
        zh_override = get_species_zh_override(species.taxon_id)
        if zh_override and species.common_name_zh != zh_override:
            species.common_name_zh = zh_override
            needs_commit = True

        # For SUBSPECIES/VARIETY/FORM: apply parent species override to path_zh['species']
        rank_upper = (species.taxon_rank or '').upper()
        if rank_upper in ('SUBSPECIES', 'VARIETY', 'FORM'):
            parts = (species.scientific_name or '').split()
            if len(parts) >= 2:
                parent_binomial = ' '.join(parts[:2])
                if parent_binomial not in _parent_override_cache:
                    # Try DB lookup first, then static name-based fallback
                    parent = SpeciesCache.query.filter(
                        SpeciesCache.scientific_name.ilike(f'{parent_binomial}%'),
                        SpeciesCache.taxon_rank == 'SPECIES',
                    ).first()
                    _parent_override_cache[parent_binomial] = (
                        get_species_zh_override(parent.taxon_id) if parent
                        else get_parent_species_zh_by_name(parent_binomial)
                    )
                parent_zh = _parent_override_cache[parent_binomial]
                if parent_zh and path_zh.get('species') != parent_zh:
                    path_zh = dict(path_zh) if path_zh else {}
                    path_zh['species'] = parent_zh
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
        entries.append({
            'user_id': user.id,
            'display_name': user.display_name,
            'avatar_url': user.avatar_url,
            'country_flags': user.country_flags or [],
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'organization': user.organization,
            'org_type': user.org_type or 'indie',
            'gender': pd.get('gender'),
            'activity_status': pd.get('activity_status'),
            'debut_date': pd.get('debut_date'),
            'last_live_at': user.last_live_at.isoformat() if user.last_live_at else None,
            'platforms': user_platforms.get(user.id, []),
            'taxon_id': species.taxon_id,
            'taxon_rank': species.taxon_rank,
            'taxon_path': taxon_path,
            'path_ranks': _compute_path_ranks(taxon_path, species.taxon_rank),
            'scientific_name': species.scientific_name,
            'common_name_zh': get_species_zh_override(species.taxon_id) or species._effective_common_name_zh(),
            'alternative_names_zh': species.alternative_names_zh,
            'breed_name': breed_name,
            'breed_id': breed_id,
            'breed_name_zh': breed_name_zh,
            'breed_name_en': breed_name_en,
            'path_zh': path_zh,
        })

    # Persist rebuilt path_zh to DB so future reads are instant
    if needs_commit:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

    # Post-process: inject Medusozoa subphylum for display
    _inject_medusozoa(entries)

    result = {'entries': entries}
    set_tree_cache(result)
    return jsonify(result)


@taxonomy_bp.route('/cache', methods=['DELETE'])
@admin_required
def clear_cache():
    """Clear all in-process taxonomy caches. Admin only."""
    invalidate_tree_cache()
    invalidate_fictional_tree_cache()
    return jsonify({'message': 'Cache cleared'}), 200


@taxonomy_bp.route('/fictional-tree', methods=['GET'])
def get_fictional_tree():
    """Return all vtuber traits with fictional species, joined with user and fictional_species data."""
    # refresh=1 requires admin authentication
    use_cache = True
    if request.args.get('refresh'):
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            from ..auth import get_current_user
            from ..models import AuthIdAlias
            uid = get_current_user()
            if uid:
                alias = db.session.get(AuthIdAlias, uid)
                if alias:
                    uid = alias.user_id
                user = db.session.get(User, str(uid))
                if user and user.role == 'admin':
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
        .order_by(User.created_at.desc())
        .all()
    )

    # Batch query platforms to avoid N+1 (deduplicate providers per user)
    user_ids = list({user.id for _, _, user in rows})
    platform_rows = (
        db.session.query(OAuthAccount.user_id, OAuthAccount.provider)
        .filter(OAuthAccount.user_id.in_(user_ids))
        .distinct()
        .all()
    ) if user_ids else []
    user_platforms = {}
    for uid, provider in platform_rows:
        user_platforms.setdefault(uid, []).append(provider)

    entries = []
    for trait, fictional, user in rows:
        # Use category_path directly; fallback to legacy construction
        fictional_path = fictional.category_path
        if not fictional_path:
            path_parts = [fictional.origin]
            if fictional.sub_origin:
                path_parts.append(fictional.sub_origin)
            path_parts.append(fictional.name)
            fictional_path = '|'.join(path_parts)

        # Extract type from category_path (4-segment paths have type at index 2)
        path_segments = fictional_path.split('|')
        fictional_type = path_segments[2] if len(path_segments) >= 4 else None

        pd = user._computed_profile_data()
        entries.append({
            'user_id': user.id,
            'display_name': user.display_name,
            'avatar_url': user.avatar_url,
            'country_flags': user.country_flags or [],
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'organization': user.organization,
            'org_type': user.org_type or 'indie',
            'gender': pd.get('gender'),
            'activity_status': pd.get('activity_status'),
            'debut_date': pd.get('debut_date'),
            'last_live_at': user.last_live_at.isoformat() if user.last_live_at else None,
            'platforms': user_platforms.get(user.id, []),
            'fictional_species_id': fictional.id,
            'fictional_path': fictional_path,
            'fictional_name': fictional.name,
            'fictional_name_zh': fictional.name_zh or fictional.name,
            'origin': fictional.origin,
            'sub_origin': fictional.sub_origin,
            'fictional_type': fictional_type,
        })

    result = {'entries': entries}
    set_fictional_tree_cache(result)
    return jsonify(result)
