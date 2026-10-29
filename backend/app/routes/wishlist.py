from flask import Blueprint, jsonify, request

from app import db
from app.models import Product, WishlistItem
from app.utils.auth_helpers import get_current_user, login_required

wishlist_bp = Blueprint("wishlist", __name__)


@wishlist_bp.get("/")
@login_required
def list_wishlist():
    user = get_current_user()
    items = (
        WishlistItem.query.filter_by(user_id=user.id)
        .order_by(WishlistItem.created_at.desc())
        .all()
    )
    return jsonify({"items": [i.to_dict() for i in items]})


@wishlist_bp.post("/")
@login_required
def add_wishlist():
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    product_id = data.get("productId")
    if not product_id:
        return jsonify({"error": "productId is required"}), 400
    product = Product.query.get(product_id)
    if not product or not product.is_active:
        return jsonify({"error": "Product not found"}), 404
    existing = WishlistItem.query.filter_by(user_id=user.id, product_id=product_id).first()
    if existing:
        return jsonify({"message": "Already in wishlist", "item": existing.to_dict()})
    item = WishlistItem(user_id=user.id, product_id=product_id)
    db.session.add(item)
    db.session.commit()
    return jsonify({"message": "Added to wishlist", "item": item.to_dict()}), 201


@wishlist_bp.delete("/<int:product_id>")
@login_required
def remove_wishlist(product_id):
    user = get_current_user()
    item = WishlistItem.query.filter_by(user_id=user.id, product_id=product_id).first()
    if not item:
        return jsonify({"error": "Item not in wishlist"}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Removed from wishlist"})
