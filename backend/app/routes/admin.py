from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from app import db
from app.models import (
    Category,
    Coupon,
    Order,
    OrderItem,
    Product,
    ProductImage,
    ProductVariant,
    User,
)
from app.models.order import ORDER_STATUSES
from app.utils.auth_helpers import admin_required
from app.utils.validators import require_fields

admin_bp = Blueprint("admin", __name__)


def _slugify(text: str) -> str:
    return (
        text.lower()
        .replace("&", "and")
        .replace(" ", "-")
        .replace("'", "")
        .replace(".", "")
    )


@admin_bp.get("/dashboard")
@admin_required
def dashboard():
    order_count = Order.query.count()
    product_count = Product.query.filter_by(is_active=True).count()
    customer_count = User.query.filter_by(role="customer").count()
    revenue = db.session.query(func.coalesce(func.sum(Order.total), 0)).scalar()
    recent = Order.query.order_by(Order.created_at.desc()).limit(8).all()
    by_status = (
        db.session.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
    )
    return jsonify(
        {
            "stats": {
                "orders": order_count,
                "products": product_count,
                "customers": customer_count,
                "revenue": int(revenue or 0),
            },
            "ordersByStatus": {s: c for s, c in by_status},
            "recentOrders": [o.to_dict() for o in recent],
            "note": "Summaries calculated from stored orders only.",
        }
    )


@admin_bp.get("/products")
@admin_required
def admin_products():
    products = Product.query.order_by(Product.id.desc()).all()
    return jsonify({"products": [p.to_dict(detail=True) for p in products]})


@admin_bp.post("/products")
@admin_required
def create_product():
    data = request.get_json(silent=True) or {}
    missing = require_fields(
        data, ["name", "brand", "categoryId", "description", "price", "imageUrl"]
    )
    if missing:
        return jsonify({"error": "Missing required fields", "fields": missing}), 400

    category = Category.query.get(data["categoryId"])
    if not category:
        return jsonify({"error": "Category not found"}), 400

    slug_base = _slugify(f"{data['brand']}-{data['name']}")
    slug = slug_base
    i = 1
    while Product.query.filter_by(slug=slug).first():
        slug = f"{slug_base}-{i}"
        i += 1

    product = Product(
        name=data["name"].strip(),
        slug=slug,
        brand=data["brand"].strip(),
        category_id=category.id,
        description=data["description"].strip(),
        material=(data.get("material") or "").strip() or None,
        specifications=(data.get("specifications") or "").strip() or None,
        price=int(data["price"]),
        original_price=int(data["originalPrice"]) if data.get("originalPrice") else None,
        image_url=data["imageUrl"].strip(),
        colors=",".join(data.get("colors") or [])
        if isinstance(data.get("colors"), list)
        else (data.get("colors") or None),
        gender=(data.get("gender") or "").strip() or None,
        tags=",".join(data.get("tags") or [])
        if isinstance(data.get("tags"), list)
        else (data.get("tags") or None),
        is_active=bool(data.get("isActive", True)),
        is_demo=bool(data.get("isDemo", True)),
        demo_rating=data.get("rating"),
        demo_review_count=data.get("reviewCount"),
    )
    db.session.add(product)
    db.session.flush()

    db.session.add(
        ProductImage(
            product_id=product.id,
            url=product.image_url,
            alt=product.name,
            sort_order=0,
        )
    )
    for idx, url in enumerate(data.get("images") or [], start=1):
        if url and url != product.image_url:
            db.session.add(
                ProductImage(product_id=product.id, url=url, alt=product.name, sort_order=idx)
            )

    for v in data.get("variants") or []:
        size = str(v.get("size", "")).strip()
        color = str(v.get("color", "")).strip()
        stock = int(v.get("stock") or 0)
        if not size or not color:
            continue
        sku = v.get("sku") or f"SZ-{product.id}-{size}-{color[:3].upper()}"
        db.session.add(
            ProductVariant(
                product_id=product.id, size=size, color=color, stock=stock, sku=sku
            )
        )

    db.session.commit()
    return jsonify({"product": product.to_dict(detail=True)}), 201


@admin_bp.put("/products/<int:product_id>")
@admin_required
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    data = request.get_json(silent=True) or {}

    for field, attr in [
        ("name", "name"),
        ("brand", "brand"),
        ("description", "description"),
        ("material", "material"),
        ("specifications", "specifications"),
        ("imageUrl", "image_url"),
        ("gender", "gender"),
    ]:
        if field in data and data[field] is not None:
            setattr(product, attr, str(data[field]).strip())

    if "price" in data:
        product.price = int(data["price"])
    if "originalPrice" in data:
        product.original_price = int(data["originalPrice"]) if data["originalPrice"] else None
    if "categoryId" in data:
        if not Category.query.get(data["categoryId"]):
            return jsonify({"error": "Category not found"}), 400
        product.category_id = data["categoryId"]
    if "colors" in data:
        product.colors = (
            ",".join(data["colors"]) if isinstance(data["colors"], list) else data["colors"]
        )
    if "tags" in data:
        product.tags = (
            ",".join(data["tags"]) if isinstance(data["tags"], list) else data["tags"]
        )
    if "isActive" in data:
        product.is_active = bool(data["isActive"])
    if "rating" in data:
        product.demo_rating = data["rating"]
    if "reviewCount" in data:
        product.demo_review_count = data["reviewCount"]

    if "variants" in data and isinstance(data["variants"], list):
        for v in data["variants"]:
            if v.get("id"):
                variant = ProductVariant.query.filter_by(
                    id=v["id"], product_id=product.id
                ).first()
                if variant:
                    if "stock" in v:
                        variant.stock = int(v["stock"])
                    if "size" in v:
                        variant.size = str(v["size"])
                    if "color" in v:
                        variant.color = str(v["color"])
            else:
                size = str(v.get("size", "")).strip()
                color = str(v.get("color", "")).strip()
                if size and color:
                    sku = v.get("sku") or f"SZ-{product.id}-{size}-{color[:3].upper()}"
                    db.session.add(
                        ProductVariant(
                            product_id=product.id,
                            size=size,
                            color=color,
                            stock=int(v.get("stock") or 0),
                            sku=sku,
                        )
                    )

    db.session.commit()
    return jsonify({"product": product.to_dict(detail=True)})


@admin_bp.delete("/products/<int:product_id>")
@admin_required
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    # Soft delete to preserve order history integrity
    product.is_active = False
    db.session.commit()
    return jsonify({"message": "Product deactivated"})


@admin_bp.get("/categories")
@admin_required
def admin_categories():
    cats = Category.query.order_by(Category.name).all()
    return jsonify({"categories": [c.to_dict() for c in cats]})


@admin_bp.post("/categories")
@admin_required
def create_category():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["name"])
    if missing:
        return jsonify({"error": "Name is required"}), 400
    name = data["name"].strip()
    slug = (data.get("slug") or _slugify(name)).strip()
    if Category.query.filter((Category.name == name) | (Category.slug == slug)).first():
        return jsonify({"error": "Category already exists"}), 409
    cat = Category(
        name=name,
        slug=slug,
        image_url=(data.get("imageUrl") or "").strip() or None,
        description=(data.get("description") or "").strip() or None,
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify({"category": cat.to_dict()}), 201


@admin_bp.get("/orders")
@admin_required
def admin_orders():
    status = request.args.get("status")
    q = (request.args.get("q") or "").strip()
    query = Order.query
    if status:
        query = query.filter_by(status=status)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Order.order_ref.ilike(like))
            | (Order.email.ilike(like))
            | (Order.mobile.ilike(like))
            | (Order.full_name.ilike(like))
        )
    orders = query.order_by(Order.created_at.desc()).limit(100).all()
    return jsonify({"orders": [o.to_dict(detail=True) for o in orders]})


@admin_bp.patch("/orders/<int:order_id>/status")
@admin_required
def update_order_status(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ORDER_STATUSES:
        return jsonify({"error": "Invalid status", "allowed": ORDER_STATUSES}), 400
    # Do not auto-jump to delivered without admin action — admin can set it intentionally
    order.status = status
    order.status_updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"order": order.to_dict(detail=True)})


@admin_bp.get("/coupons")
@admin_required
def admin_coupons():
    coupons = Coupon.query.order_by(Coupon.id.desc()).all()
    return jsonify({"coupons": [c.to_dict() for c in coupons]})


@admin_bp.post("/coupons")
@admin_required
def create_coupon():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["code", "discountType", "discountValue"])
    if missing:
        return jsonify({"error": "Missing required fields", "fields": missing}), 400
    code = data["code"].strip().upper()
    if Coupon.query.filter_by(code=code).first():
        return jsonify({"error": "Coupon code already exists"}), 409
    if data["discountType"] not in ("percent", "fixed"):
        return jsonify({"error": "discountType must be percent or fixed"}), 400
    coupon = Coupon(
        code=code,
        description=(data.get("description") or "").strip() or None,
        discount_type=data["discountType"],
        discount_value=int(data["discountValue"]),
        min_order_amount=int(data.get("minOrderAmount") or 0),
        max_discount=int(data["maxDiscount"]) if data.get("maxDiscount") else None,
        is_active=bool(data.get("isActive", True)),
        is_demo=bool(data.get("isDemo", True)),
        usage_limit=int(data["usageLimit"]) if data.get("usageLimit") else None,
    )
    db.session.add(coupon)
    db.session.commit()
    return jsonify({"coupon": coupon.to_dict()}), 201


@admin_bp.patch("/coupons/<int:coupon_id>")
@admin_required
def update_coupon(coupon_id):
    coupon = Coupon.query.get(coupon_id)
    if not coupon:
        return jsonify({"error": "Coupon not found"}), 404
    data = request.get_json(silent=True) or {}
    if "isActive" in data:
        coupon.is_active = bool(data["isActive"])
    if "description" in data:
        coupon.description = data["description"]
    if "discountValue" in data:
        coupon.discount_value = int(data["discountValue"])
    if "minOrderAmount" in data:
        coupon.min_order_amount = int(data["minOrderAmount"])
    db.session.commit()
    return jsonify({"coupon": coupon.to_dict()})


@admin_bp.get("/customers")
@admin_required
def admin_customers():
    users = User.query.filter_by(role="customer").order_by(User.created_at.desc()).all()
    return jsonify(
        {
            "customers": [
                {**u.to_dict(), "orderCount": u.orders.count()} for u in users
            ]
        }
    )
