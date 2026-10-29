from flask import Blueprint, jsonify, request
from sqlalchemy import or_

from app.models import Category, Product, ProductVariant

products_bp = Blueprint("products", __name__)


def _apply_filters(query):
    args = request.args
    search = (args.get("search") or args.get("q") or "").strip()
    category = (args.get("category") or "").strip()
    brand = (args.get("brand") or "").strip()
    gender = (args.get("gender") or "").strip()
    color = (args.get("color") or "").strip()
    size = (args.get("size") or "").strip()
    tag = (args.get("tag") or "").strip()
    min_price = args.get("minPrice", type=int)
    max_price = args.get("maxPrice", type=int)
    min_discount = args.get("minDiscount", type=int)
    min_rating = args.get("minRating", type=float)
    sort = (args.get("sort") or "featured").strip()

    query = query.filter(Product.is_active.is_(True))

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(like),
                Product.brand.ilike(like),
                Product.description.ilike(like),
                Product.tags.ilike(like),
            )
        )

    if category:
        query = query.join(Category).filter(
            or_(Category.slug == category.lower(), Category.name.ilike(category))
        )

    if brand:
        brands = [b.strip() for b in brand.split(",") if b.strip()]
        if brands:
            query = query.filter(or_(*[Product.brand.ilike(b) for b in brands]))

    if gender:
        query = query.filter(
            or_(Product.gender == gender.lower(), Product.gender == "unisex")
        )

    if color:
        query = query.filter(Product.colors.ilike(f"%{color}%"))

    if size:
        query = query.filter(
            Product.variants.any(
                (ProductVariant.size == size) & (ProductVariant.stock > 0)
            )
        )

    if tag:
        query = query.filter(Product.tags.ilike(f"%{tag}%"))

    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    if min_discount is not None and min_discount > 0:
        # original_price must exist and discount >= threshold
        products = query.all()
        ids = [p.id for p in products if p.discount_percent() >= min_discount]
        query = Product.query.filter(Product.id.in_(ids)) if ids else Product.query.filter(False)

    if min_rating is not None:
        query = query.filter(Product.demo_rating >= min_rating)

    if sort == "newest":
        query = query.order_by(Product.created_at.desc())
    elif sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "rating":
        query = query.order_by(Product.demo_rating.desc())
    else:
        query = query.order_by(Product.id.asc())

    return query


@products_bp.get("/")
def list_products():
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("perPage", 12, type=int), 48)
    query = _apply_filters(Product.query)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify(
        {
            "products": [p.to_dict() for p in pagination.items],
            "pagination": {
                "page": pagination.page,
                "perPage": pagination.per_page,
                "total": pagination.total,
                "pages": pagination.pages,
                "hasNext": pagination.has_next,
                "hasPrev": pagination.has_prev,
            },
        }
    )


@products_bp.get("/filters/meta")
def filters_meta():
    products = Product.query.filter_by(is_active=True).all()
    brands = sorted({p.brand for p in products})
    colors = sorted({c for p in products for c in p.color_list()})
    sizes = sorted(
        {
            v.size
            for p in products
            for v in p.variants
            if v.stock > 0
        },
        key=lambda s: float(s) if s.replace(".", "", 1).isdigit() else s,
    )
    categories = [c.to_dict() for c in Category.query.filter_by(is_active=True).all()]
    prices = [p.price for p in products] or [0]
    return jsonify(
        {
            "brands": brands,
            "colors": colors,
            "sizes": sizes,
            "categories": categories,
            "priceRange": {"min": min(prices), "max": max(prices)},
        }
    )


@products_bp.get("/categories")
def list_categories():
    cats = Category.query.filter_by(is_active=True).all()
    return jsonify({"categories": [c.to_dict() for c in cats]})


@products_bp.get("/featured")
def featured():
    tag = request.args.get("tag", "trending")
    limit = min(request.args.get("limit", 8, type=int), 20)
    products = (
        Product.query.filter(Product.is_active.is_(True), Product.tags.ilike(f"%{tag}%"))
        .order_by(Product.demo_rating.desc())
        .limit(limit)
        .all()
    )
    if len(products) < limit:
        extra = (
            Product.query.filter(
                Product.is_active.is_(True),
                ~Product.id.in_([p.id for p in products] or [0]),
            )
            .limit(limit - len(products))
            .all()
        )
        products.extend(extra)
    return jsonify({"products": [p.to_dict() for p in products]})


@products_bp.get("/<int:product_id>")
def product_detail(product_id):
    product = Product.query.get(product_id)
    if not product or not product.is_active:
        return jsonify({"error": "Product not found"}), 404
    return jsonify({"product": product.to_dict(detail=True)})


@products_bp.get("/slug/<slug>")
def product_by_slug(slug):
    product = Product.query.filter_by(slug=slug, is_active=True).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify({"product": product.to_dict(detail=True)})


@products_bp.get("/delivery-estimate")
def delivery_estimate():
    pin = (request.args.get("pin") or "").strip()
    from app.utils.validators import is_valid_pin
    from datetime import datetime, timedelta, timezone

    if not is_valid_pin(pin):
        return jsonify({"error": "Enter a valid 6-digit Indian PIN code"}), 400

    # Demo rule: metro-ish PINs faster
    days = 3 if pin.startswith(("11", "40", "56", "60", "70", "12")) else 5
    eta = datetime.now(timezone.utc) + timedelta(days=days)
    return jsonify(
        {
            "pinCode": pin,
            "estimatedDays": days,
            "estimatedDate": eta.date().isoformat(),
            "note": "Estimated delivery based on demo rules — not live courier data.",
            "available": True,
        }
    )


@products_bp.get("/related/<int:product_id>")
def related(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"products": []})
    related_products = (
        Product.query.filter(
            Product.is_active.is_(True),
            Product.category_id == product.category_id,
            Product.id != product.id,
        )
        .limit(4)
        .all()
    )
    return jsonify({"products": [p.to_dict() for p in related_products]})
