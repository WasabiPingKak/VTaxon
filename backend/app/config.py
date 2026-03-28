import os


class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False

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


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")

    @classmethod
    def init_app(cls, app):
        origins = app.config.get("ALLOWED_ORIGINS", "")
        if not origins:
            raise RuntimeError(
                "ALLOWED_ORIGINS must be set in production. "
                "Example: ALLOWED_ORIGINS=https://vtaxon.com,https://vtaxon.web.app"
            )


class StagingConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    DB_SCHEMA = os.environ.get("DB_SCHEMA", "staging")


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "staging": StagingConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}
