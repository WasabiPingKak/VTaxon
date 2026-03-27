"""Unit tests for app.auth — JWT verification, JWKS caching, decorators."""

import time
from unittest.mock import MagicMock, patch

import jwt as pyjwt
from cryptography.hazmat.primitives.asymmetric import ec

from app.auth import (
    _get_jwks,
    _get_signing_key,
    _jwks_cache,
    admin_required,
    get_current_user,
    login_required,
)
from app.models import AuthIdAlias, User

# ---------------------------------------------------------------------------
# Helpers: generate a real ES256 key pair for test JWTs
# ---------------------------------------------------------------------------

def _make_es256_keypair():
    """Generate a fresh ES256 private/public key pair."""
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    return private_key, public_key


def _make_jwk(public_key, kid='test-kid-1'):
    """Convert an EC public key to a JWK dict (as Supabase would serve)."""
    from jwt.algorithms import ECAlgorithm
    jwk = ECAlgorithm.to_jwk(public_key, as_dict=True)
    jwk['kid'] = kid
    jwk['use'] = 'sig'
    jwk['alg'] = 'ES256'
    return jwk


def _sign_jwt(private_key, kid='test-kid-1', sub='user-uuid-123',
              aud='authenticated', exp_offset=3600):
    """Create a signed ES256 JWT mimicking Supabase format."""
    now = int(time.time())
    payload = {'sub': sub, 'aud': aud, 'iat': now, 'exp': now + exp_offset}
    return pyjwt.encode(payload, private_key, algorithm='ES256',
                        headers={'kid': kid})


# ---------------------------------------------------------------------------
# _get_jwks
# ---------------------------------------------------------------------------

class TestGetJwks:

    def setup_method(self):
        _jwks_cache['keys'] = None
        _jwks_cache['fetched_at'] = 0

    def test_fetches_and_caches(self, app):
        """First call should fetch from Supabase and populate cache."""
        private, public = _make_es256_keypair()
        jwk = _make_jwk(public)

        with app.app_context():
            with patch('app.auth.requests.get') as mock_get:
                mock_get.return_value = MagicMock(
                    status_code=200,
                    json=lambda: {'keys': [jwk]},
                    raise_for_status=lambda: None,
                )
                keys = _get_jwks()
                assert keys == [jwk]
                assert _jwks_cache['keys'] == [jwk]
                mock_get.assert_called_once()

    def test_returns_cache_within_ttl(self, app):
        """Second call within TTL should use cache, not fetch again."""
        _jwks_cache['keys'] = [{'kid': 'cached'}]
        _jwks_cache['fetched_at'] = time.monotonic()

        with app.app_context():
            with patch('app.auth.requests.get') as mock_get:
                keys = _get_jwks()
                assert keys == [{'kid': 'cached'}]
                mock_get.assert_not_called()

    def test_force_refresh_ignores_cache(self, app):
        """force_refresh=True should fetch even when cache is valid."""
        _jwks_cache['keys'] = [{'kid': 'old'}]
        _jwks_cache['fetched_at'] = time.monotonic()
        new_jwk = {'kid': 'new'}

        with app.app_context():
            with patch('app.auth.requests.get') as mock_get:
                mock_get.return_value = MagicMock(
                    status_code=200,
                    json=lambda: {'keys': [new_jwk]},
                    raise_for_status=lambda: None,
                )
                keys = _get_jwks(force_refresh=True)
                assert keys == [new_jwk]
                mock_get.assert_called_once()

    def test_returns_stale_cache_on_network_error(self, app):
        """If fetch fails, return stale cache."""
        _jwks_cache['keys'] = [{'kid': 'stale'}]
        _jwks_cache['fetched_at'] = 0  # expired

        with app.app_context():
            with patch('app.auth.requests.get', side_effect=Exception('timeout')):
                keys = _get_jwks()
                assert keys == [{'kid': 'stale'}]


# ---------------------------------------------------------------------------
# _get_signing_key
# ---------------------------------------------------------------------------

class TestGetSigningKey:

    def setup_method(self):
        _jwks_cache['keys'] = None
        _jwks_cache['fetched_at'] = 0

    def test_returns_key_matching_kid(self, app):
        """Should return the public key matching the JWT's kid."""
        private, public = _make_es256_keypair()
        jwk = _make_jwk(public, kid='kid-abc')
        token = _sign_jwt(private, kid='kid-abc')

        _jwks_cache['keys'] = [jwk]
        _jwks_cache['fetched_at'] = time.monotonic()

        with app.app_context():
            key = _get_signing_key(token)
            assert key is not None

    def test_returns_none_for_invalid_token(self, app):
        """Should return None for garbage token."""
        _jwks_cache['keys'] = [{'kid': 'x'}]
        _jwks_cache['fetched_at'] = time.monotonic()

        with app.app_context():
            key = _get_signing_key('not-a-jwt')
            assert key is None

    def test_returns_none_when_no_keys(self, app):
        """Should return None when JWKS is empty."""
        _jwks_cache['keys'] = None
        _jwks_cache['fetched_at'] = 0

        with app.app_context():
            with patch('app.auth.requests.get', side_effect=Exception('fail')):
                key = _get_signing_key('x.y.z')
                assert key is None


# ---------------------------------------------------------------------------
# get_current_user
# ---------------------------------------------------------------------------

class TestGetCurrentUser:

    def setup_method(self):
        _jwks_cache['keys'] = None
        _jwks_cache['fetched_at'] = 0

    def test_valid_jwt_returns_sub(self, app):
        """A properly signed JWT should return the user ID (sub claim)."""
        private, public = _make_es256_keypair()
        jwk = _make_jwk(public)
        token = _sign_jwt(private, sub='my-user-id')

        _jwks_cache['keys'] = [jwk]
        _jwks_cache['fetched_at'] = time.monotonic()

        with app.test_request_context(
            headers={'Authorization': f'Bearer {token}'}
        ):
            user_id = get_current_user()
            assert user_id == 'my-user-id'

    def test_missing_auth_header_returns_none(self, app):
        """No Authorization header → None."""
        with app.test_request_context():
            assert get_current_user() is None

    def test_non_bearer_header_returns_none(self, app):
        """Authorization header without 'Bearer ' prefix → None."""
        with app.test_request_context(
            headers={'Authorization': 'Basic abc123'}
        ):
            assert get_current_user() is None

    def test_expired_jwt_returns_none(self, app):
        """An expired JWT should fail verification → None."""
        private, public = _make_es256_keypair()
        jwk = _make_jwk(public)
        token = _sign_jwt(private, exp_offset=-3600)  # already expired

        _jwks_cache['keys'] = [jwk]
        _jwks_cache['fetched_at'] = time.monotonic()

        with app.test_request_context(
            headers={'Authorization': f'Bearer {token}'}
        ):
            # After first fail, it will force-refresh JWKS and retry.
            # Both attempts should fail because the token is expired.
            with patch('app.auth._get_jwks') as mock_jwks:
                mock_jwks.return_value = [jwk]
                assert get_current_user() is None

    def test_wrong_audience_returns_none(self, app):
        """JWT with wrong audience → None."""
        private, public = _make_es256_keypair()
        jwk = _make_jwk(public)
        token = _sign_jwt(private, aud='wrong-audience')

        _jwks_cache['keys'] = [jwk]
        _jwks_cache['fetched_at'] = time.monotonic()

        with app.test_request_context(
            headers={'Authorization': f'Bearer {token}'}
        ):
            with patch('app.auth._get_jwks') as mock_jwks:
                mock_jwks.return_value = [jwk]
                assert get_current_user() is None

    def test_key_rotation_retry(self, app):
        """If first verify fails (wrong key), should refresh JWKS and retry."""
        old_priv, old_pub = _make_es256_keypair()
        new_priv, new_pub = _make_es256_keypair()
        # Both JWKs share the same kid — simulates Supabase rotating the key
        # material while keeping the same kid identifier.
        old_jwk = _make_jwk(old_pub, kid='shared-kid')
        new_jwk = _make_jwk(new_pub, kid='shared-kid')
        token = _sign_jwt(new_priv, kid='shared-kid', sub='rotated-user')

        # Start with stale cache (old key — same kid, wrong key material)
        _jwks_cache['keys'] = [old_jwk]
        _jwks_cache['fetched_at'] = time.monotonic()

        with app.test_request_context(
            headers={'Authorization': f'Bearer {token}'}
        ):
            # First verify attempt uses old key → InvalidSignatureError
            # Then _get_jwks(force_refresh=True) fetches new key → retry succeeds
            with patch('app.auth.requests.get') as mock_get:
                mock_get.return_value = MagicMock(
                    status_code=200,
                    json=lambda: {'keys': [new_jwk]},
                    raise_for_status=lambda: None,
                )
                user_id = get_current_user()
                assert user_id == 'rotated-user'


# ---------------------------------------------------------------------------
# login_required decorator
# ---------------------------------------------------------------------------

class TestLoginRequired:

    def test_returns_401_without_jwt(self, app):
        """Unauthenticated request → 401."""
        @login_required
        def protected():
            return 'ok'

        with app.test_request_context():
            resp, status = protected()
            assert status == 401
            assert resp.json['error'] == 'Authentication required'

    def test_sets_current_user_id(self, app, db_session):
        """Authenticated request → g.current_user_id is set."""
        from flask import g
        private, public = _make_es256_keypair()
        jwk = _make_jwk(public)
        token = _sign_jwt(private, sub='user-abc')

        _jwks_cache['keys'] = [jwk]
        _jwks_cache['fetched_at'] = time.monotonic()

        @login_required
        def protected():
            return g.current_user_id

        with app.test_request_context(
            headers={'Authorization': f'Bearer {token}'}
        ):
            result = protected()
            assert result == 'user-abc'

    def test_resolves_alias(self, app, db_session):
        """If auth_id has an alias, g.current_user_id should be the aliased user."""
        from flask import g
        private, public = _make_es256_keypair()
        jwk = _make_jwk(public)
        token = _sign_jwt(private, sub='auth-id-secondary')

        _jwks_cache['keys'] = [jwk]
        _jwks_cache['fetched_at'] = time.monotonic()

        # Create alias mapping
        alias = AuthIdAlias(auth_id='auth-id-secondary', user_id='primary-user-id')
        db_session.add(alias)
        db_session.flush()

        @login_required
        def protected():
            return {'raw': g.raw_auth_id, 'resolved': g.current_user_id}

        with app.test_request_context(
            headers={'Authorization': f'Bearer {token}'}
        ):
            result = protected()
            assert result['raw'] == 'auth-id-secondary'
            assert result['resolved'] == 'primary-user-id'


# ---------------------------------------------------------------------------
# admin_required decorator
# ---------------------------------------------------------------------------

class TestAdminRequired:

    def test_returns_403_for_non_admin(self, app, db_session):
        """Regular user → 403."""
        private, public = _make_es256_keypair()
        jwk = _make_jwk(public)
        user = User(id='user-normal', display_name='Test', role='user')
        db_session.add(user)
        db_session.flush()
        token = _sign_jwt(private, sub='user-normal')

        _jwks_cache['keys'] = [jwk]
        _jwks_cache['fetched_at'] = time.monotonic()

        @admin_required
        def admin_only():
            return 'ok'

        with app.test_request_context(
            headers={'Authorization': f'Bearer {token}'}
        ):
            resp, status = admin_only()
            assert status == 403

    def test_passes_for_admin(self, app, db_session):
        """Admin user → function executes."""
        from flask import g
        private, public = _make_es256_keypair()
        jwk = _make_jwk(public)
        user = User(id='user-admin', display_name='Admin', role='admin')
        db_session.add(user)
        db_session.flush()
        token = _sign_jwt(private, sub='user-admin')

        _jwks_cache['keys'] = [jwk]
        _jwks_cache['fetched_at'] = time.monotonic()

        @admin_required
        def admin_only():
            return 'admin-ok'

        with app.test_request_context(
            headers={'Authorization': f'Bearer {token}'}
        ):
            result = admin_only()
            assert result == 'admin-ok'
            assert g.current_user.role == 'admin'

    def test_returns_403_for_nonexistent_user(self, app, db_session):
        """JWT sub points to non-existent user → 403."""
        private, public = _make_es256_keypair()
        jwk = _make_jwk(public)
        token = _sign_jwt(private, sub='ghost-user')

        _jwks_cache['keys'] = [jwk]
        _jwks_cache['fetched_at'] = time.monotonic()

        @admin_required
        def admin_only():
            return 'ok'

        with app.test_request_context(
            headers={'Authorization': f'Bearer {token}'}
        ):
            resp, status = admin_only()
            assert status == 403
