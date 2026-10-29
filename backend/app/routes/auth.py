from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)

from app import db, limiter
from app.models import User
from app.utils.auth_helpers import login_required, get_current_user
from app.utils.validators import is_valid_email, is_valid_mobile, require_fields

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
@limiter.limit("10 per minute")
def register():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["email", "password", "fullName"])
    if missing:
        return jsonify({"error": "Missing required fields", "fields": missing}), 400

    email = data["email"].strip().lower()
    password = data["password"]
    full_name = data["fullName"].strip()
    mobile = (data.get("mobile") or "").strip() or None

    if not is_valid_email(email):
        return jsonify({"error": "Invalid email address"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    if mobile and not is_valid_mobile(mobile):
        return jsonify({"error": "Invalid Indian mobile number"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(email=email, full_name=full_name, mobile=mobile, role="customer")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    access = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    refresh = create_refresh_token(identity=str(user.id), additional_claims={"role": user.role})
    return (
        jsonify(
            {
                "message": "Registered successfully",
                "user": user.to_dict(),
                "accessToken": access,
                "refreshToken": refresh,
            }
        ),
        201,
    )


@auth_bp.post("/login")
@limiter.limit("20 per minute")
def login():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["email", "password"])
    if missing:
        return jsonify({"error": "Missing required fields", "fields": missing}), 400

    email = data["email"].strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401
    if not user.is_active:
        return jsonify({"error": "Account is inactive"}), 403

    access = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    refresh = create_refresh_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify(
        {
            "message": "Logged in",
            "user": user.to_dict(),
            "accessToken": access,
            "refreshToken": refresh,
        }
    )


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
@limiter.limit("30 per minute")
def refresh():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    if not user or not user.is_active:
        return jsonify({"error": "Invalid user"}), 401
    access = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"accessToken": access})


@auth_bp.get("/me")
@login_required
def me():
    user = get_current_user()
    return jsonify({"user": user.to_dict()})


@auth_bp.patch("/me")
@login_required
def update_me():
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    if "fullName" in data and data["fullName"].strip():
        user.full_name = data["fullName"].strip()
    if "mobile" in data:
        mobile = (data["mobile"] or "").strip()
        if mobile and not is_valid_mobile(mobile):
            return jsonify({"error": "Invalid Indian mobile number"}), 400
        user.mobile = mobile or None
    db.session.commit()
    return jsonify({"user": user.to_dict()})


@auth_bp.post("/change-password")
@login_required
@limiter.limit("5 per minute")
def change_password():
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["currentPassword", "newPassword"])
    if missing:
        return jsonify({"error": "Missing required fields", "fields": missing}), 400
    if not user.check_password(data["currentPassword"]):
        return jsonify({"error": "Current password is incorrect"}), 400
    if len(data["newPassword"]) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400
    user.set_password(data["newPassword"])
    db.session.commit()
    return jsonify({"message": "Password updated"})
