"""Shared fixtures for backend unit tests."""

import uuid
from unittest.mock import patch

import pytest

from app import create_app
from app.extensions import db as _db
from app.models import User


@pytest.fixture(scope="session")
def app():
    """Create a Flask application configured for testing."""
    app = create_app("testing")
    app.config["SUPABASE_URL"] = "https://fake.supabase.co"
    app.config["SUPABASE_JWT_SECRET"] = "test-secret"  # pragma: allowlist secret
    # Disable rate limiting in tests
    from app.limiter import limiter

    limiter.enabled = False
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture()
def client(app):
    """A Flask test client."""
    return app.test_client()


@pytest.fixture(autouse=True)
def _clean_tables(app):
    """Truncate all tables after each test for proper isolation."""
    yield
    with app.app_context():
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()


@pytest.fixture()
def db_session(app):
    """Per-test DB session."""
    with app.app_context():
        yield _db.session


# ── Auth helpers for route tests ──


@pytest.fixture()
def mock_auth():
    """Return a context manager that mocks get_current_user to return user_id.

    Usage:
        with mock_auth('user-123'):
            resp = client.post('/api/traits', ...)
    """

    def _mock(user_id):
        return patch("app.auth.get_current_user", return_value=user_id)

    return _mock


@pytest.fixture()
def sample_user(db_session):
    """Create a regular user and return it."""
    uid = f"user-{uuid.uuid4().hex[:8]}"
    user = User(id=uid, display_name="TestUser", role="user")
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture()
def admin_user(db_session):
    """Create an admin user and return it."""
    uid = f"admin-{uuid.uuid4().hex[:8]}"
    user = User(id=uid, display_name="AdminUser", role="admin")
    db_session.add(user)
    db_session.commit()
    return user
