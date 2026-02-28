from flask import Blueprint, g, jsonify, request
from sqlalchemy.exc import IntegrityError

from ..auth import login_required
from ..extensions import db
from ..models import OAuthAccount, User

users_bp = Blueprint('users', __name__)


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
    allowed = {'display_name', 'organization', 'country_flags',
               'social_links', 'primary_platform'}

    ALLOWED_SNS_KEYS = {
        'twitter', 'threads', 'instagram', 'bluesky',
        'discord', 'facebook', 'marshmallow',
    }

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
            display_name = (identity_data.get('full_name')
                            or identity_data.get('name')
                            or identity_data.get('preferred_username', ''))
            twitch_login = None

        # Use YouTube channel avatar if provided, otherwise fall back to
        # identity_data (which for Google is the Google account avatar)
        if db_provider == avatar_for_provider and avatar_url_input:
            avatar_url = avatar_url_input
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
            if display_name:
                account.provider_display_name = display_name
            if avatar_url:
                account.provider_avatar_url = avatar_url
            if channel_url:
                account.channel_url = channel_url
        elif create_missing:
            # Only create new accounts on fresh OAuth redirect,
            # not on page refresh (prevents re-creating unlinked accounts)
            account = OAuthAccount(
                user_id=g.current_user_id,
                provider=db_provider,
                provider_account_id=provider_id,
                provider_display_name=display_name or None,
                provider_avatar_url=avatar_url or None,
                channel_url=channel_url,
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

    return jsonify([a.to_dict() for a in synced])


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
