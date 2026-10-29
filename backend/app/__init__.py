from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy

from app.config import Config

db = SQLAlchemy()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per hour"])


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    CORS(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)

    from app.routes.auth import auth_bp
    from app.routes.products import products_bp
    from app.routes.wishlist import wishlist_bp
    from app.routes.orders import orders_bp
    from app.routes.admin import admin_bp
    from app.routes.coupons import coupons_bp
    from app.routes.addresses import addresses_bp
    from app.routes.reviews import reviews_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(wishlist_bp, url_prefix="/api/wishlist")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(coupons_bp, url_prefix="/api/coupons")
    app.register_blueprint(addresses_bp, url_prefix="/api/addresses")
    app.register_blueprint(reviews_bp, url_prefix="/api/reviews")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "brand": "SNEAKZONE"})

    @app.get("/api/config/public")
    def public_config():
        return jsonify(
            {
                "paymentMode": app.config["PAYMENT_MODE"],
                "freeDeliveryThreshold": app.config["FREE_DELIVERY_THRESHOLD"],
                "standardDeliveryFee": app.config["STANDARD_DELIVERY_FEE"],
                "brand": {
                    "name": "SNEAKZONE",
                    "tagline": "Step into your style.",
                },
            }
        )

    @jwt.unauthorized_loader
    def unauthorized(reason):
        return jsonify({"error": "Authentication required", "detail": reason}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"error": "Invalid token", "detail": reason}), 401

    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired"}), 401

    with app.app_context():
        from app import models  # noqa: F401

        db.create_all()
        if app.config["SEED_ON_START"]:
            from app.seed import seed_database

            seed_database()

    return app
