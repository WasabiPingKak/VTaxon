from flask import Flask
from .config import config
from .extensions import db


def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)

    @app.route('/health')
    def health():
        return {'status': 'ok'}

    return app
