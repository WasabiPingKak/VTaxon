import logging
import math
import os
from datetime import date as _date, datetime, timezone

log = logging.getLogger(__name__)

import requests
from flask import Blueprint, g, jsonify, request
from sqlalchemy import case, func, literal, or_, text
from sqlalchemy.exc import IntegrityError

from ..auth import login_required
from ..cache import invalidate_tree_cache
from ..extensions import db
from ..models import (Blacklist, Breed, FictionalSpecies, OAuthAccount,
                       SpeciesCache, User, VtuberTrait)

users_bp = Blueprint('users', __name__)


@users_bp.route('/recent', methods=['GET'])
def recent_users():
    since_str = request.args.get('since', '').strip()
    if not since_str:
        return jsonify([])

    try:
        since = datetime.fromisoformat(since_str.replace('Z', '+00:00'))
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid since timestamp'}), 400

    limit = request.args.get('limit', 5, type=int)
    limit = min(max(limit, 1), 10)

    # Only return users who have at least one trait (= visible on tree).
    # Use the trait's created_at as the timestamp so the toast timeline
    # aligns with when the user actually appears on the tree.
    latest_trait = func.max(VtuberTrait.created_at).label('latest_trait_at')
    rows = (
        db.session.query(User, latest_trait)
        .join(VtuberTrait, User.id == VtuberTrait.user_id)
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
                Breed.name_zh.label('breed_zh'),
                Breed.name_en.label('breed_en'),
                FictionalSpecies.name_zh.label('fict_zh'),
                FictionalSpecies.name.label('fict_en'),
            )
            .outerjoin(SpeciesCache, VtuberTrait.taxon_id == SpeciesCache.taxon_id)
            .outerjoin(Breed, VtuberTrait.breed_id == Breed.id)
            .outerjoin(FictionalSpecies,
                       VtuberTrait.fictional_species_id == FictionalSpecies.id)
            .filter(VtuberTrait.user_id.in_(user_ids))
            .filter(VtuberTrait.created_at > since)
            .all()
        )
        for uid, sp_zh, sp_sci, sp_rank, br_zh, br_en, fi_zh, fi_en in trait_rows:
            # Strip genus suffix "屬" from species-level Chinese names
            if (sp_zh and sp_zh.endswith('屬') and len(sp_zh) >= 2
                    and (sp_rank or '').upper() in
                    ('SPECIES', 'SUBSPECIES', 'VARIETY')):
                sp_zh = sp_zh[:-1]
            # Prefer breed name if present, then species name, then fictional
            if br_zh or br_en:
                name = br_zh or br_en
            elif sp_zh or sp_sci:
                name = sp_zh or sp_sci
            elif fi_zh or fi_en:
                name = fi_zh or fi_en
            else:
                name = ''
            if name:
                species_names.setdefault(str(uid), []).append(name)

    return jsonify([
        {
            'id': u.id,
            'display_name': u.display_name,
            'avatar_url': u.avatar_url,
            'created_at': trait_at.isoformat(),
            'species_summary': '、'.join(
                species_names.get(str(u.id), [])[:3]
            ) or None,
        }
        for u, trait_at in rows
    ])


@users_bp.route('/directory', methods=['GET'])
def directory():
    q = request.args.get('q', '').strip()
    country = request.args.get('country', '').strip()
    gender = request.args.get('gender', '').strip()
    status = request.args.get('status', '').strip()
    org_type = request.args.get('org_type', '').strip()
    platform = request.args.get('platform', '').strip()
    has_traits = request.args.get('has_traits', '').strip()
    sort = request.args.get('sort', 'created_at').strip()
    order = request.args.get('order', 'desc').strip()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 24, type=int)

    per_page = min(max(per_page, 1), 100)
    page = max(page, 1)

    query = User.query

    # Name search
    if q:
        query = query.filter(User.display_name.ilike(f'%{q}%'))

    # Country flags filter (JSONB containment, OR logic)
    # DB stores lowercase codes (e.g. "tw"), facets return UPPER for display
    if country:
        raw = [c.strip() for c in country.split(',') if c.strip()]
        # Strict validation: 2-letter alpha codes or 'NONE'
        codes = [c for c in raw if c.upper() == 'NONE' or (len(c) == 2 and c.isalpha())]
        if codes:
            conditions = []
            bind_params = {}
            for i, code in enumerate(codes):
                if code.upper() == 'NONE':
                    conditions.append(
                        "(users.country_flags IS NULL"
                        " OR users.country_flags = '[]'::jsonb"
                        " OR users.country_flags::text = 'null')"
                    )
                else:
                    lo_key = f'cc_lo_{i}'
                    up_key = f'cc_up_{i}'
                    bind_params[lo_key] = f'["{code.lower()}"]'
                    bind_params[up_key] = f'["{code.upper()}"]'
                    conditions.append(
                        f"(users.country_flags @> :{lo_key}::jsonb"
                        f" OR users.country_flags @> :{up_key}::jsonb)"
                    )
            query = query.filter(
                text("(" + " OR ".join(conditions) + ")").bindparams(**bind_params)
            )

    # Gender filter
    if gender:
        vals = [v.strip() for v in gender.split(',') if v.strip()]
        if vals:
            conditions = []
            for v in vals:
                if v == 'unset':
                    conditions.append(
                        or_(
                            User.profile_data['gender'].astext.is_(None),
                            text("users.profile_data->>'gender' IS NULL"),
                            text("users.profile_data->>'gender' = ''"),
                        )
                    )
                elif v == 'other':
                    conditions.append(
                        text(
                            "users.profile_data->>'gender' IS NOT NULL "
                            "AND users.profile_data->>'gender' != '' "
                            "AND users.profile_data->>'gender' NOT IN ('男', '女')"
                        )
                    )
                else:
                    conditions.append(
                        text("users.profile_data->>'gender' = :g").bindparams(g=v)
                    )
            query = query.filter(or_(*conditions))

    # Activity status filter (with debut_date auto-switch logic)
    if status:
        vals = [v.strip() for v in status.split(',') if v.strip()]
        if vals:
            today_str = _date.today().isoformat()
            conditions = []
            for v in vals:
                if v == 'active':
                    # Stored as active, OR stored as preparing but debut_date <= today
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
                elif v == 'preparing':
                    # Stored as preparing AND (no debut_date OR debut_date > today)
                    conditions.append(
                        text(
                            "users.profile_data->>'activity_status' = 'preparing' "
                            "AND (users.profile_data->>'debut_date' IS NULL "
                            "OR users.profile_data->>'debut_date' > :today)"
                        ).bindparams(today=today_str)
                    )
                else:
                    conditions.append(
                        text(
                            "users.profile_data->>'activity_status' = :s"
                        ).bindparams(s=v)
                    )
            query = query.filter(or_(*conditions))

    # Organization type filter
    if org_type in ('corporate', 'indie', 'club'):
        query = query.filter(User.org_type == org_type)

    # Platform filter
    if platform:
        providers = [p.strip() for p in platform.split(',') if p.strip()]
        if providers:
            query = query.filter(
                User.id.in_(
                    db.session.query(OAuthAccount.user_id)
                    .filter(OAuthAccount.provider.in_(providers))
                    .distinct()
                )
            )

    # Has traits filter
    if has_traits == 'true':
        query = query.filter(
            User.id.in_(
                db.session.query(VtuberTrait.user_id).distinct()
            )
        )
    elif has_traits == 'false':
        query = query.filter(
            ~User.id.in_(
                db.session.query(VtuberTrait.user_id).distinct()
            )
        )

    # Sorting
    if sort not in ('debut_date', 'name', 'created_at'):
        sort = 'created_at'
    if order not in ('asc', 'desc'):
        order = 'desc'

    if sort == 'name':
        order_col = User.display_name
    elif sort == 'debut_date':
        order_col = text("users.profile_data->>'debut_date'")
    else:
        order_col = User.created_at

    if order == 'asc':
        if sort == 'debut_date':
            query = query.order_by(text(
                "users.profile_data->>'debut_date' ASC NULLS LAST"
            ))
        else:
            query = query.order_by(order_col.asc())
    else:
        if sort == 'debut_date':
            query = query.order_by(text(
                "users.profile_data->>'debut_date' DESC NULLS LAST"
            ))
        else:
            query = query.order_by(order_col.desc())

    # Count + paginate
    total = query.count()
    total_pages = max(1, math.ceil(total / per_page))
    users = query.offset((page - 1) * per_page).limit(per_page).all()
    user_ids = [u.id for u in users]

    # Batch load platforms
    platforms_map = {}
    if user_ids:
        accounts = OAuthAccount.query.filter(
            OAuthAccount.user_id.in_(user_ids)
        ).all()
        for a in accounts:
            uid = str(a.user_id)
            platforms_map.setdefault(uid, set()).add(a.provider)

    # Batch load species names
    species_map = {}
    if user_ids:
        traits = (
            VtuberTrait.query
            .filter(VtuberTrait.user_id.in_(user_ids))
            .all()
        )
        for t in traits:
            uid = str(t.user_id)
            name = t.computed_display_name() or '?'
            species_map.setdefault(uid, []).append(name)

    items = []
    for u in users:
        uid = str(u.id)
        pd = u._computed_profile_data()
        items.append({
            'id': uid,
            'display_name': u.display_name,
            'avatar_url': u.avatar_url,
            'organization': u.organization,
            'org_type': u.org_type or 'indie',
            'country_flags': u.country_flags or [],
            'created_at': u.created_at.isoformat() if u.created_at else None,
            'profile_data': {
                'gender': pd.get('gender'),
                'activity_status': pd.get('activity_status'),
                'debut_date': pd.get('debut_date'),
                'representative_emoji': pd.get('representative_emoji'),
                'illustrators': pd.get('illustrators') or [],
                'riggers': pd.get('riggers') or [],
                'modelers_3d': pd.get('modelers_3d') or [],
            },
            'platforms': sorted(platforms_map.get(uid, [])),
            'species_names': species_map.get(uid, []),
            'has_traits': uid in species_map,
        })

    # Compute facets (counts per filter dimension, from ALL users)
    facets = _compute_facets()

    return jsonify({
        'items': items,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages,
        'facets': facets,
    })


def _compute_facets():
    today_str = _date.today().isoformat()
    facets = {}

    # Country counts (unnest JSONB array)
    rows = db.session.execute(text(
        "SELECT UPPER(elem::text), COUNT(DISTINCT u.id) "
        "FROM users u, jsonb_array_elements_text(u.country_flags) AS elem "
        "GROUP BY 1"
    )).fetchall()
    facets['country'] = {r[0]: r[1] for r in rows}

    # No-flag count
    facets['country_none'] = db.session.execute(text(
        "SELECT COUNT(*) FROM users "
        "WHERE country_flags IS NULL "
        "OR country_flags = '[]'::jsonb "
        "OR country_flags::text = 'null'"
    )).scalar() or 0

    # Gender counts
    rows = db.session.execute(text(
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
    )).fetchall()
    facets['gender'] = {r[0]: r[1] for r in rows}

    # Status counts (with preparing→active auto-switch)
    rows = db.session.execute(text(
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
    ), {'today': today_str}).fetchall()
    facets['status'] = {r[0]: r[1] for r in rows if r[0] != '_none'}

    # Org type counts
    rows = db.session.execute(text(
        "SELECT COALESCE(org_type, 'indie'), COUNT(*) "
        "FROM users GROUP BY 1"
    )).fetchall()
    facets['org_type'] = {r[0]: r[1] for r in rows}
    total_users = sum(facets['org_type'].values())

    # Platform counts
    rows = db.session.execute(text(
        "SELECT provider, COUNT(DISTINCT user_id) "
        "FROM oauth_accounts GROUP BY provider"
    )).fetchall()
    facets['platform'] = {r[0]: r[1] for r in rows}

    # Has traits counts
    with_traits = db.session.execute(text(
        "SELECT COUNT(DISTINCT user_id) FROM vtuber_traits"
    )).scalar() or 0
    facets['has_traits'] = {
        'true': with_traits,
        'false': total_users - with_traits,
    }

    return facets


@users_bp.route('/me', methods=['GET'])
@login_required
def get_me():
    user = db.session.get(User, g.current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())


@users_bp.route('/me', methods=['PATCH'])
@login_required
def update_me():
    user = db.session.get(User, g.current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    allowed = {'display_name', 'organization', 'bio', 'country_flags',
               'social_links', 'primary_platform', 'profile_data', 'org_type'}

    ALLOWED_SNS_KEYS = {
        'twitter', 'threads', 'instagram', 'bluesky',
        'discord', 'facebook', 'marshmallow', 'email',
    }

    if 'org_type' in data:
        if data['org_type'] not in ('indie', 'corporate', 'club'):
            return jsonify({'error': 'org_type must be indie, corporate, or club'}), 400
        if data['org_type'] == 'indie':
            data['organization'] = None

    if 'social_links' in data:
        links = data['social_links']
        if not isinstance(links, dict):
            return jsonify({'error': 'social_links must be an object'}), 400
        cleaned_links = {}
        for k, v in links.items():
            if k not in ALLOWED_SNS_KEYS:
                return jsonify({'error': f'Unknown SNS key: {k}'}), 400
            if v and not isinstance(v, str):
                return jsonify({'error': f'SNS value for {k} must be a string'}), 400
            if v and len(v) > 500:
                return jsonify({'error': f'SNS value for {k} is too long'}), 400
            if v:
                cleaned_links[k] = v.strip()
        data['social_links'] = cleaned_links

    if 'bio' in data:
        bio = data['bio']
        if bio is not None:
            if not isinstance(bio, str):
                return jsonify({'error': 'bio must be a string'}), 400
            if len(bio) > 500:
                return jsonify({'error': 'bio must be 500 characters or less'}), 400
            data['bio'] = bio.strip() or None

    if 'country_flags' in data:
        flags = data['country_flags']
        if not isinstance(flags, list):
            return jsonify({'error': 'country_flags must be a list'}), 400
        cleaned = []
        for f in flags:
            if not isinstance(f, str) or len(f) != 2:
                return jsonify({'error': 'Each flag must be a 2-character country code'}), 400
            cleaned.append(f.upper())
        data['country_flags'] = cleaned

    if 'profile_data' in data:
        pd = data['profile_data']
        if not isinstance(pd, dict):
            return jsonify({'error': 'profile_data must be an object'}), 400

        ALLOWED_PD_KEYS = {
            'debut_date', 'birthday_month', 'birthday_day', 'blood_type',
            'mbti', 'gender', 'representative_emoji', 'fan_name',
            'activity_status', 'illustrators', 'riggers', 'modelers_3d',
            'hashtags', 'debut_video_url',
        }
        for key in pd:
            if key not in ALLOWED_PD_KEYS:
                return jsonify({'error': f'Unknown profile_data key: {key}'}), 400

        # Validate string fields
        for str_key in ('debut_date', 'blood_type', 'mbti', 'gender',
                        'representative_emoji', 'fan_name', 'activity_status',
                        'debut_video_url'):
            if str_key in pd and pd[str_key] is not None:
                if not isinstance(pd[str_key], str):
                    return jsonify({'error': f'{str_key} must be a string'}), 400

        # Validate integer fields
        for int_key in ('birthday_month', 'birthday_day'):
            if int_key in pd and pd[int_key] is not None:
                if not isinstance(pd[int_key], int):
                    return jsonify({'error': f'{int_key} must be an integer'}), 400

        # Validate creator fields — list of {name, url?} objects
        for creator_key in ('illustrators', 'riggers', 'modelers_3d'):
            if creator_key in pd and pd[creator_key] is not None:
                if not isinstance(pd[creator_key], list):
                    return jsonify({'error': f'{creator_key} must be a list'}), 400
                for item in pd[creator_key]:
                    if not isinstance(item, dict) or 'name' not in item:
                        return jsonify({'error': f'{creator_key} items must have a name'}), 400
                    if not isinstance(item['name'], str):
                        return jsonify({'error': f'{creator_key} name must be a string'}), 400
                    if 'url' in item and item['url'] is not None and not isinstance(item['url'], str):
                        return jsonify({'error': f'{creator_key} url must be a string'}), 400

        # Validate hashtags — array of strings
        if 'hashtags' in pd and pd['hashtags'] is not None:
            if not isinstance(pd['hashtags'], list):
                return jsonify({'error': 'hashtags must be a list'}), 400
            if any(not isinstance(item, str) for item in pd['hashtags']):
                return jsonify({'error': 'hashtags items must be strings'}), 400

        # Validate specific values
        if pd.get('blood_type') and pd['blood_type'] not in ('A', 'B', 'O', 'AB'):
            return jsonify({'error': 'Invalid blood_type'}), 400
        if pd.get('activity_status') and pd['activity_status'] not in (
            'active', 'hiatus', 'preparing',
        ):
            return jsonify({'error': 'Invalid activity_status'}), 400
        if pd.get('birthday_month') and not (1 <= pd['birthday_month'] <= 12):
            return jsonify({'error': 'birthday_month must be 1-12'}), 400
        if pd.get('birthday_day') and not (1 <= pd['birthday_day'] <= 31):
            return jsonify({'error': 'birthday_day must be 1-31'}), 400

        data['profile_data'] = pd

    if 'primary_platform' in data:
        pp = data['primary_platform']
        if pp not in ('youtube', 'twitch'):
            return jsonify({'error': 'primary_platform must be youtube or twitch'}), 400
        # Verify the user actually has an OAuthAccount for this platform
        has_account = OAuthAccount.query.filter_by(
            user_id=g.current_user_id, provider=pp
        ).first()
        if not has_account:
            return jsonify({'error': f'No {pp} account linked'}), 400

    for key in allowed:
        if key in data:
            setattr(user, key, data[key])

    # Auto-update avatar_url when primary_platform changes
    if 'primary_platform' in data:
        primary_account = OAuthAccount.query.filter_by(
            user_id=g.current_user_id, provider=data['primary_platform']
        ).first()
        if primary_account and primary_account.provider_avatar_url:
            user.avatar_url = primary_account.provider_avatar_url

    db.session.commit()
    invalidate_tree_cache()
    return jsonify(user.to_dict())


@users_bp.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = user.to_dict()
    public_accounts = OAuthAccount.query.filter_by(
        user_id=user_id, show_on_profile=True
    ).all()
    data['oauth_accounts'] = [a.to_dict(public=True) for a in public_accounts]
    return jsonify(data)


@users_bp.route('/me/oauth-accounts', methods=['GET'])
@login_required
def get_my_oauth_accounts():
    accounts = OAuthAccount.query.filter_by(
        user_id=g.current_user_id
    ).all()
    return jsonify([a.to_dict() for a in accounts])


@users_bp.route('/me/oauth-accounts/sync', methods=['POST'])
@login_required
def sync_oauth_accounts():
    data = request.get_json() or {}
    identities = data.get('identities', [])
    channel_url_input = data.get('channel_url')
    provider_for_url = data.get('provider_for_url')
    avatar_url_input = data.get('provider_avatar_url')
    avatar_for_provider = data.get('avatar_for_provider')
    channel_display_name = data.get('channel_display_name')
    provider_token = data.get('provider_token')
    token_provider = data.get('token_provider')  # 'youtube' or 'twitch'

    create_missing = data.get('create_missing', False)
    provider_map = {'google': 'youtube', 'twitch': 'twitch'}
    synced = []

    for identity in identities:
        supabase_provider = identity.get('provider', '')
        db_provider = provider_map.get(supabase_provider)
        if not db_provider:
            continue

        provider_id = identity.get('id', '')
        identity_data = identity.get('identity_data', {})

        if db_provider == 'twitch':
            # Supabase Twitch mapping (verified):
            #   nickname / slug = display name (unicode, e.g. 山葵冰角)
            #   name / full_name = login name (ASCII, e.g. wasabi_pingkak)
            display_name = (identity_data.get('nickname')
                            or identity_data.get('slug')
                            or identity_data.get('name', ''))
            twitch_login = (identity_data.get('name')
                            or identity_data.get('full_name', ''))
        else:
            # Prefer YouTube channel title over Google account name
            if channel_display_name:
                display_name = channel_display_name
            else:
                display_name = (identity_data.get('full_name')
                                or identity_data.get('name')
                                or identity_data.get('preferred_username', ''))
            twitch_login = None

        # Use YouTube channel avatar if provided by frontend.
        # For youtube provider WITHOUT explicit YT avatar, skip identity_data
        # fallback — identity_data contains the Google account avatar, not
        # the YouTube channel avatar, and we don't want to overwrite a
        # previously-stored correct YT avatar with a Google one.
        if db_provider == avatar_for_provider and avatar_url_input:
            avatar_url = avatar_url_input
        elif db_provider == 'youtube':
            avatar_url = None  # don't use Google avatar for youtube provider
        else:
            avatar_url = (identity_data.get('avatar_url')
                          or identity_data.get('picture', ''))

        channel_url = None
        if db_provider == 'twitch' and twitch_login:
            channel_url = f'https://twitch.tv/{twitch_login}'
        elif db_provider == 'youtube' and provider_for_url == 'youtube':
            channel_url = channel_url_input

        account = OAuthAccount.query.filter_by(
            provider=db_provider, provider_account_id=provider_id
        ).first()

        if account:
            # Only update if this account belongs to the current user
            if str(account.user_id) != str(g.current_user_id):
                continue
            # For YouTube accounts, only update display name when the
            # frontend explicitly provides a channel_display_name (which
            # requires a valid provider_token from a fresh OAuth redirect).
            # Without it, display_name falls back to the Google account
            # nickname from identity_data, which would incorrectly
            # overwrite the YouTube channel name on every page refresh.
            if display_name and (db_provider != 'youtube' or channel_display_name):
                account.provider_display_name = display_name
            if avatar_url:
                account.provider_avatar_url = avatar_url
            if channel_url:
                account.channel_url = channel_url
            # Store provider token for later refresh
            if provider_token and token_provider == db_provider:
                account.access_token = provider_token
        elif create_missing:
            # Only create new accounts on fresh OAuth redirect,
            # not on page refresh (prevents re-creating unlinked accounts).
            # When token_provider is set, only create accounts the user
            # actually authenticated with (skip auto-linked providers).
            if token_provider and token_provider != db_provider:
                continue

            # Check blacklist before creating account
            blocked = Blacklist.query.filter_by(
                identifier_type=db_provider,
                identifier_value=provider_id,
            ).first()
            if blocked:
                return jsonify({
                    'error': 'account_banned',
                    'message': '此帳號已被停用，如有疑問請聯繫管理員',
                }), 403

            account = OAuthAccount(
                user_id=g.current_user_id,
                provider=db_provider,
                provider_account_id=provider_id,
                provider_display_name=display_name or None,
                provider_avatar_url=avatar_url or None,
                channel_url=channel_url,
                access_token=(provider_token
                              if provider_token and token_provider == db_provider
                              else None),
            )
            db.session.add(account)
        else:
            continue

        synced.append(account)

    try:
        db.session.commit()
    except IntegrityError:
        # Race condition: concurrent syncUser calls inserting same account
        db.session.rollback()
        synced = OAuthAccount.query.filter_by(
            user_id=g.current_user_id
        ).all()

    # Subscribe new Twitch accounts to EventSub (non-blocking)
    for account in synced:
        if (account.provider == 'twitch' and account.provider_account_id
                and account.created_at and
                (datetime.now(timezone.utc) - account.created_at).total_seconds() < 30):
            try:
                from .livestream import subscribe_twitch_user
                subscribe_twitch_user(account.provider_account_id)
            except Exception as e:
                log.warning('Failed to subscribe Twitch EventSub for %s: %s',
                            account.provider_account_id, e)

    # Sync avatar_url from primary platform account
    user = db.session.get(User, g.current_user_id)
    if user and user.primary_platform:
        primary_account = OAuthAccount.query.filter_by(
            user_id=g.current_user_id, provider=user.primary_platform
        ).first()
        if primary_account and primary_account.provider_avatar_url:
            if user.avatar_url != primary_account.provider_avatar_url:
                user.avatar_url = primary_account.provider_avatar_url
                db.session.commit()
                invalidate_tree_cache()

    return jsonify([a.to_dict() for a in synced])


@users_bp.route('/me/oauth-accounts/<account_id>/refresh', methods=['POST'])
@login_required
def refresh_oauth_account(account_id):
    account = db.session.get(OAuthAccount, account_id)
    if not account or str(account.user_id) != str(g.current_user_id):
        return jsonify({'error': 'Account not found'}), 404

    if not account.access_token:
        return jsonify({'error': '請重新登入以取得授權'}), 401

    try:
        if account.provider == 'youtube':
            resp = requests.get(
                'https://www.googleapis.com/youtube/v3/channels',
                params={'part': 'snippet', 'mine': 'true'},
                headers={'Authorization': f'Bearer {account.access_token}'},
                timeout=10,
            )
            if resp.status_code == 401:
                account.access_token = None
                db.session.commit()
                return jsonify({'error': '授權已過期，請重新登入'}), 401
            resp.raise_for_status()
            ch = resp.json().get('items', [None])[0]
            if ch:
                snippet = ch.get('snippet', {})
                account.provider_display_name = snippet.get('title') or account.provider_display_name
                avatar = snippet.get('thumbnails', {}).get('default', {}).get('url')
                if avatar:
                    account.provider_avatar_url = avatar
                account.channel_url = f"https://www.youtube.com/channel/{ch['id']}"

        elif account.provider == 'twitch':
            twitch_client_id = os.environ.get('TWITCH_CLIENT_ID')
            if not twitch_client_id:
                return jsonify({'error': 'Twitch 同步尚未設定，請聯繫管理員'}), 500
            resp = requests.get(
                'https://api.twitch.tv/helix/users',
                headers={
                    'Authorization': f'Bearer {account.access_token}',
                    'Client-Id': twitch_client_id,
                },
                timeout=10,
            )
            if resp.status_code == 401:
                account.access_token = None
                db.session.commit()
                return jsonify({'error': '授權已過期，請重新登入'}), 401
            resp.raise_for_status()
            users = resp.json().get('data', [])
            if users:
                u = users[0]
                account.provider_display_name = u.get('display_name') or account.provider_display_name
                if u.get('profile_image_url'):
                    account.provider_avatar_url = u['profile_image_url']
                if u.get('login'):
                    account.channel_url = f"https://twitch.tv/{u['login']}"
        else:
            return jsonify({'error': 'Unsupported provider'}), 400

        # Sync user avatar if this is the primary platform
        user = db.session.get(User, g.current_user_id)
        if user and user.primary_platform == account.provider:
            if account.provider_avatar_url:
                user.avatar_url = account.provider_avatar_url

        db.session.commit()
        invalidate_tree_cache()
        return jsonify(account.to_dict())

    except requests.RequestException as e:
        log.error('OAuth account sync failed: %s', e)
        return jsonify({'error': '同步失敗，請稍後再試'}), 502


@users_bp.route('/me/oauth-accounts/<account_id>', methods=['PATCH'])
@login_required
def update_oauth_account(account_id):
    account = db.session.get(OAuthAccount, account_id)
    if not account or str(account.user_id) != str(g.current_user_id):
        return jsonify({'error': 'Account not found'}), 404

    data = request.get_json() or {}
    if 'show_on_profile' in data:
        account.show_on_profile = bool(data['show_on_profile'])
    if 'channel_url' in data:
        account.channel_url = data['channel_url'] or None

    db.session.commit()
    return jsonify(account.to_dict())


@users_bp.route('/me/oauth-accounts/<account_id>', methods=['DELETE'])
@login_required
def delete_oauth_account(account_id):
    account = db.session.get(OAuthAccount, account_id)
    if not account or str(account.user_id) != str(g.current_user_id):
        return jsonify({'error': 'Account not found'}), 404

    count = OAuthAccount.query.filter_by(
        user_id=g.current_user_id
    ).count()
    if count <= 1:
        return jsonify({'error': '無法解除最後一個綁定帳號'}), 400

    deleted_provider = account.provider
    deleted_provider_id = account.provider_account_id

    # Clean up EventSub + live_streams for Twitch accounts
    if deleted_provider == 'twitch' and deleted_provider_id:
        try:
            from .livestream import unsubscribe_twitch_user
            unsubscribe_twitch_user(deleted_provider_id)
        except Exception as e:
            log.warning('Failed to unsubscribe Twitch EventSub for %s: %s',
                        deleted_provider_id, e)
    from ..models import LiveStream
    LiveStream.query.filter_by(
        user_id=g.current_user_id, provider=deleted_provider
    ).delete()

    db.session.delete(account)

    # If deleting the primary platform account, switch to remaining account
    user = db.session.get(User, g.current_user_id)
    if user and user.primary_platform == deleted_provider:
        remaining = OAuthAccount.query.filter_by(
            user_id=g.current_user_id
        ).filter(OAuthAccount.id != account_id).first()
        if remaining:
            user.primary_platform = remaining.provider
            if remaining.provider_avatar_url:
                user.avatar_url = remaining.provider_avatar_url
        else:
            user.primary_platform = None

    db.session.commit()
    return jsonify({'ok': True, 'user': user.to_dict() if user else None})
