import os

from flask import Flask, jsonify
from flask_cors import CORS

from .config import config
from .extensions import db


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # CORS: restrict origins based on ALLOWED_ORIGINS config
    allowed = app.config.get('ALLOWED_ORIGINS', '*')
    if allowed and allowed != '*':
        origins = [o.strip() for o in allowed.split(',')]
        CORS(app, origins=origins)
    else:
        CORS(app)

    # DB Schema isolation: set PostgreSQL search_path for staging
    db_schema = app.config.get('DB_SCHEMA', '')
    if db_schema:
        engine_opts = app.config.get('SQLALCHEMY_ENGINE_OPTIONS', {})
        connect_args = engine_opts.get('connect_args', {})
        connect_args['options'] = f'-c search_path={db_schema}'
        engine_opts['connect_args'] = connect_args
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = engine_opts

    db.init_app(app)

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.users import users_bp
    from .routes.species import species_bp
    from .routes.traits import traits_bp
    from .routes.taxonomy import taxonomy_bp
    from .routes.breeds import breeds_bp
    from .routes.fictional import fictional_bp
    from .routes.reports import reports_bp
    from .routes.seo import seo_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(species_bp, url_prefix='/api/species')
    app.register_blueprint(traits_bp, url_prefix='/api/traits')
    app.register_blueprint(taxonomy_bp, url_prefix='/api/taxonomy')
    app.register_blueprint(breeds_bp, url_prefix='/api/breeds')
    app.register_blueprint(fictional_bp, url_prefix='/api/fictional-species')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(seo_bp, url_prefix='/api')

    @app.route('/api/health')
    @app.route('/health')
    def health():
        try:
            db.session.execute(db.text('SELECT 1'))
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {e}'
        return jsonify({
            'status': 'ok',
            'database': db_status,
            'environment': config_name,
        })

    return app
