from flask import Blueprint, jsonify, request

from app import db
from app.models import Address
from app.utils.auth_helpers import get_current_user, login_required
from app.utils.validators import is_valid_email, is_valid_mobile, is_valid_pin, require_fields

addresses_bp = Blueprint("addresses", __name__)


@addresses_bp.get("/")
@login_required
def list_addresses():
    user = get_current_user()
    items = Address.query.filter_by(user_id=user.id).order_by(Address.is_default.desc()).all()
    return jsonify({"addresses": [a.to_dict() for a in items]})


@addresses_bp.post("/")
@login_required
def create_address():
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    missing = require_fields(
        data, ["fullName", "mobile", "pinCode", "state", "city", "house", "street"]
    )
    if missing:
        return jsonify({"error": "Missing required fields", "fields": missing}), 400
    if not is_valid_mobile(data["mobile"]):
        return jsonify({"error": "Invalid mobile number"}), 400
    if not is_valid_pin(data["pinCode"]):
        return jsonify({"error": "Invalid PIN code"}), 400
    email = (data.get("email") or "").strip()
    if email and not is_valid_email(email):
        return jsonify({"error": "Invalid email"}), 400

    if data.get("isDefault"):
        Address.query.filter_by(user_id=user.id).update({"is_default": False})

    addr = Address(
        user_id=user.id,
        full_name=data["fullName"].strip(),
        mobile=data["mobile"].strip(),
        email=email or user.email,
        pin_code=data["pinCode"].strip(),
        state=data["state"].strip(),
        city=data["city"].strip(),
        house=data["house"].strip(),
        street=data["street"].strip(),
        landmark=(data.get("landmark") or "").strip() or None,
        address_type=(data.get("addressType") or "").strip() or None,
        is_default=bool(data.get("isDefault")),
    )
    db.session.add(addr)
    db.session.commit()
    return jsonify({"address": addr.to_dict()}), 201


@addresses_bp.delete("/<int:address_id>")
@login_required
def delete_address(address_id):
    user = get_current_user()
    addr = Address.query.filter_by(id=address_id, user_id=user.id).first()
    if not addr:
        return jsonify({"error": "Address not found"}), 404
    db.session.delete(addr)
    db.session.commit()
    return jsonify({"message": "Address deleted"})
