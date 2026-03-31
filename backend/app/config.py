import os

from flask import Flask


class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 5,
        "max_overflow": 5,
        "pool_timeout": 30,
        "pool_recycle": 1800,
    }

    # Supabase
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

    # Twitch EventSub
    TWITCH_CLIENT_ID = os.environ.get("TWITCH_CLIENT_ID", "")
    TWITCH_CLIENT_SECRET = os.environ.get("TWITCH_CLIENT_SECRET", "")
    TWITCH_WEBHOOK_SECRET = os.environ.get("TWITCH_WEBHOOK_SECRET", "")
    WEBHOOK_BASE_URL = os.environ.get("WEBHOOK_BASE_URL", "")

    # YouTube PubSubHubbub
    YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")

    # Cron authentication
    CRON_SECRET = os.environ.get("CRON_SECRET", "")

    # CORS — default empty (no wildcard); CI/CD sets explicit whitelist
    ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "")

    # DB schema (empty = default public schema)
    DB_SCHEMA = os.environ.get("DB_SCHEMA", "")


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///dev.db")
    DB_SCHEMA = os.environ.get("DB_SCHEMA", "staging")


def _check_required_env(app: Flask, required: list[str]) -> None:
    """Validate that required env vars are set; raise RuntimeError if any missing."""
    missing = [key for key in required if not app.config.get(key)]
    if missing:
        raise RuntimeError(
            f"Missing required config: {', '.join(missing)}. Set them as environment variables before starting the app."
        )


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")

    # Env vars required for production to function correctly
    REQUIRED_ENV = [
        "SQLALCHEMY_DATABASE_URI",
        "ALLOWED_ORIGINS",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "CRON_SECRET",
    ]

    @classmethod
    def init_app(cls, app: Flask) -> None:
        _check_required_env(app, cls.REQUIRED_ENV)


class StagingConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    DB_SCHEMA = os.environ.get("DB_SCHEMA", "staging")

    REQUIRED_ENV = [
        "SQLALCHEMY_DATABASE_URI",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "CRON_SECRET",
    ]

    @classmethod
    def init_app(cls, app: Flask) -> None:
        _check_required_env(app, cls.REQUIRED_ENV)


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_ENGINE_OPTIONS = {}
    RATELIMIT_ENABLED = False


config: dict[str, type[Config]] = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "staging": StagingConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}
