"""Shared fixtures for backend unit tests."""

import pytest

from app import create_app
from app.extensions import db as _db


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
