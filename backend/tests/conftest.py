"""Shared fixtures for backend unit tests."""

import uuid
from contextlib import contextmanager
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
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture()
def client(app):
    """A Flask test client."""
    return app.test_client()


@pytest.fixture()
def db_session(app):
    """Per-test DB session with automatic rollback."""
    with app.app_context():
        _db.session.begin_nested()
        yield _db.session
        _db.session.rollback()


@pytest.fixture()
def sample_user(db_session):
    """A regular user persisted in the DB."""
    user = User(id=str(uuid.uuid4()), display_name="TestUser", role="user")
    db_session.add(user)
    db_session.flush()
    return user


@pytest.fixture()
def admin_user(db_session):
    """An admin user persisted in the DB."""
    user = User(id=str(uuid.uuid4()), display_name="AdminUser", role="admin")
    db_session.add(user)
    db_session.flush()
    return user


@pytest.fixture()
def mock_auth():
    """Context manager that patches get_current_user to return a given user_id."""

    @contextmanager
    def _mock(user_id):
        with patch("app.auth.get_current_user", return_value=user_id):
            yield

    return _mock
