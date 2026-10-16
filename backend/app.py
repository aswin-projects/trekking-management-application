import os
from flask import Flask, render_template
from flask_login import LoginManager
from flask_cors import CORS

from config import Config
from extensions import db, login_manager, cache, celery

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_SRC = os.path.join(BASE_DIR, "..", "frontend", "src")


def create_app():
    app = Flask(
        __name__,
        template_folder=FRONTEND_SRC,
        static_folder=FRONTEND_SRC,
        static_url_path="/assets",
    )
    app.config.from_object(Config)

    os.makedirs(os.path.join(BASE_DIR, "instance"), exist_ok=True)

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = None  # API-only auth, no redirect
    cache.init_app(app)
    CORS(app, supports_credentials=True)

    celery.conf.update(
        broker_url=app.config["CELERY_BROKER_URL"],
        result_backend=app.config["CELERY_RESULT_BACKEND"],
    )

    from models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    @login_manager.unauthorized_handler
    def unauthorized():
        from flask import jsonify

        return jsonify({"error": "Authentication required"}), 401

    # Register route blueprints
    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.staff import staff_bp
    from routes.user import user_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(staff_bp, url_prefix="/api/staff")
    app.register_blueprint(user_bp, url_prefix="/api")

    @app.route("/")
    @app.route("/<path:path>")
    def index(path=None):
        return render_template("index.html")

    with app.app_context():
        db.create_all()
        seed_admin()

    return app


def seed_admin():
    """Programmatically ensure a default admin account exists."""
    from models import User

    if not User.query.filter_by(role="admin").first():
        admin = User(
            name="System Admin",
            email="admin@tma.local",
            role="admin",
            is_active_flag=True,
        )
        admin.set_password("Admin@123")
        db.session.add(admin)
        db.session.commit()
        print("Seeded default admin -> email: admin@tma.local  password: Admin@123")


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
