import logging
import os
import uuid

from flask import Flask, g, jsonify, request
from flask_cors import CORS
from pythonjsonlogger import json as json_log
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix

from .config import config
from .extensions import db
from .limiter import limiter

logger = logging.getLogger(__name__)


def _setup_logging(app):
    """Configure JSON structured logging for all loggers."""

    class _RequestFormatter(json_log.JsonFormatter):
        def add_fields(self, log_record, record, message_dict):
            super().add_fields(log_record, record, message_dict)
            log_record["logger"] = record.name
            log_record["level"] = record.levelname
            # Attach request_id when inside a request context
            log_record["request_id"] = getattr(g, "request_id", None)

    handler = logging.StreamHandler()
    handler.setFormatter(_RequestFormatter("%(asctime)s %(level)s %(logger)s %(message)s"))

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.DEBUG if app.debug else logging.INFO)


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Trust proxy headers from Cloud Run load balancer
    # x_for=1: trust 1 level of X-Forwarded-For
    # x_proto=1: trust X-Forwarded-Proto
    # x_host=1: trust X-Forwarded-Host
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    # Structured logging (JSON to stdout — Cloud Run picks it up)
    _setup_logging(app)

    # Run config-specific init (e.g. ProductionConfig checks ALLOWED_ORIGINS)
    config_cls = config[config_name]
    if hasattr(config_cls, "init_app"):
        config_cls.init_app(app)

    # CORS: restrict origins based on ALLOWED_ORIGINS config
    allowed = app.config.get("ALLOWED_ORIGINS", "")
    if allowed:
        origins = [o.strip() for o in allowed.split(",") if o.strip()]
        CORS(app, origins=origins)
    elif config_name == "development":
        CORS(app)
    # else: no CORS (production without ALLOWED_ORIGINS blocked by init_app)

    # Rate limiting
    limiter.init_app(app)

    # DB Schema isolation: set PostgreSQL search_path for staging
    db_schema = app.config.get("DB_SCHEMA", "")
    if db_schema:
        engine_opts = app.config.get("SQLALCHEMY_ENGINE_OPTIONS", {})
        connect_args = engine_opts.get("connect_args", {})
        connect_args["options"] = f"-c search_path={db_schema}"
        engine_opts["connect_args"] = connect_args
        app.config["SQLALCHEMY_ENGINE_OPTIONS"] = engine_opts

    db.init_app(app)

    # Register blueprints
    from .routes.admin import admin_bp
    from .routes.auth import auth_bp
    from .routes.breeds import breeds_bp
    from .routes.directory import directory_bp
    from .routes.fictional import fictional_bp
    from .routes.livestream import livestream_bp
    from .routes.notifications import notifications_bp
    from .routes.oauth import oauth_bp
    from .routes.reports import reports_bp
    from .routes.seo import seo_bp
    from .routes.species import species_bp
    from .routes.ssr import ssr_bp
    from .routes.subscriptions import subscriptions_bp
    from .routes.taxonomy import taxonomy_bp
    from .routes.traits import traits_bp
    from .routes.users import users_bp
    from .routes.webhooks import webhooks_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(directory_bp, url_prefix="/api/users")
    app.register_blueprint(oauth_bp, url_prefix="/api/users")
    app.register_blueprint(species_bp, url_prefix="/api/species")
    app.register_blueprint(traits_bp, url_prefix="/api/traits")
    app.register_blueprint(taxonomy_bp, url_prefix="/api/taxonomy")
    app.register_blueprint(breeds_bp, url_prefix="/api/breeds")
    app.register_blueprint(fictional_bp, url_prefix="/api/fictional-species")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(livestream_bp, url_prefix="/api")
    app.register_blueprint(webhooks_bp, url_prefix="/api")
    app.register_blueprint(subscriptions_bp, url_prefix="/api")
    app.register_blueprint(seo_bp, url_prefix="/api")
    app.register_blueprint(ssr_bp, url_prefix="/vtuber")

    # OpenAPI / Swagger UI (via Flasgger)
    enable_swagger = os.environ.get("ENABLE_SWAGGER", "").lower() in ("true", "1")
    if app.config.get("ENABLE_SWAGGER", enable_swagger or config_name == "development"):
        from flasgger import Swagger

        from .swagger import SWAGGER_CONFIG, SWAGGER_TEMPLATE

        Swagger(app, template=SWAGGER_TEMPLATE, config=SWAGGER_CONFIG)

    # Assign a request_id for log correlation
    @app.before_request
    def assign_request_id():
        g.request_id = request.headers.get("X-Request-Id") or uuid.uuid4().hex[:12]

    # Security headers for all responses
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        if response.content_type and "text/html" in response.content_type:
            # SSR pages: permissive CSP matching Firebase Hosting config
            response.headers["X-Frame-Options"] = "SAMEORIGIN"
        else:
            # API responses: restrictive CSP
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        return response

    # ------------------------------------------------------------------
    # Global error handlers
    # ------------------------------------------------------------------
    @app.errorhandler(HTTPException)
    def handle_http_exception(exc):
        """Return JSON instead of HTML for HTTP errors (404, 405, etc.)."""
        return jsonify({"error": exc.description}), exc.code

    @app.errorhandler(SQLAlchemyError)
    def handle_db_error(exc):
        """Catch unhandled database errors — log and return 500."""
        db.session.rollback()
        logger.exception("Unhandled database error")
        return jsonify({"error": "資料庫操作失敗，請稍後再試"}), 500

    @app.errorhandler(Exception)
    def handle_unexpected_error(exc):
        """Last-resort handler for anything not caught above."""
        logger.exception("Unhandled exception")
        return jsonify({"error": "伺服器內部錯誤"}), 500

    # ------------------------------------------------------------------
    # Health check
    # ------------------------------------------------------------------
    @app.route("/api/health")
    @app.route("/health")
    def health():
        """健康檢查（含資料庫連線狀態）。
        ---
        tags:
          - Health
        responses:
          200:
            description: 服務狀態
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: ok
                database:
                  type: string
                  enum: [connected, error]
        """
        try:
            db.session.execute(db.text("SELECT 1"))
            db_status = "connected"
        except SQLAlchemyError as e:
            app.logger.error("Health check DB error: %s", e)
            db_status = "error"
        return jsonify(
            {
                "status": "ok",
                "database": db_status,
            }
        )

    return app
