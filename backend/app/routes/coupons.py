from flask import Blueprint, jsonify, request

from app.models import Coupon

coupons_bp = Blueprint("coupons", __name__)


@coupons_bp.post("/validate")
def validate_coupon():
    data = request.get_json(silent=True) or {}
    code = (data.get("code") or "").strip().upper()
    subtotal = int(data.get("subtotal") or 0)
    if not code:
        return jsonify({"error": "Coupon code is required"}), 400
    coupon = Coupon.query.filter_by(code=code).first()
    if not coupon:
        return jsonify({"error": "Invalid coupon code"}), 404
    ok, err = coupon.is_valid(subtotal)
    if not ok:
        return jsonify({"error": err}), 400
    discount = coupon.calculate_discount(subtotal)
    return jsonify(
        {
            "valid": True,
            "code": coupon.code,
            "discount": discount,
            "description": coupon.description,
            "isDemo": coupon.is_demo,
            "note": "Demo coupon — discounts recalculated on the server at checkout.",
        }
    )
