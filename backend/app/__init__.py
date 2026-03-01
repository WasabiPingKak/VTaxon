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

    CORS(app)
    db.init_app(app)

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.users import users_bp
    from .routes.species import species_bp
    from .routes.traits import traits_bp
    from .routes.kinship import kinship_bp
    from .routes.taxonomy import taxonomy_bp
    from .routes.breeds import breeds_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(species_bp, url_prefix='/api/species')
    app.register_blueprint(traits_bp, url_prefix='/api/traits')
    app.register_blueprint(kinship_bp, url_prefix='/api/kinship')
    app.register_blueprint(taxonomy_bp, url_prefix='/api/taxonomy')
    app.register_blueprint(breeds_bp, url_prefix='/api/breeds')

    @app.route('/health')
    def health():
        try:
            db.session.execute(db.text('SELECT 1'))
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {e}'
        return jsonify({'status': 'ok', 'database': db_status})

    return app
