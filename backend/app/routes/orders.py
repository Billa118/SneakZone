from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app import db, limiter
from app.models import Coupon, Order, OrderItem, Product, ProductVariant
from app.models.order import ORDER_STATUSES, generate_order_ref
from app.utils.auth_helpers import get_current_user, login_required
from app.utils.validators import is_valid_email, is_valid_mobile, is_valid_pin, require_fields

orders_bp = Blueprint("orders", __name__)


def _optional_user():
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            from app.models import User

            return User.query.get(int(identity))
    except Exception:
        return None
    return None


def _estimate_delivery(pin: str, method: str):
    days = 3 if pin.startswith(("11", "40", "56", "60", "70", "12")) else 5
    if method == "express":
        days = max(2, days - 1)
    return datetime.now(timezone.utc) + timedelta(days=days), days


@orders_bp.get("/delivery-options")
def delivery_options():
    pin = (request.args.get("pin") or "").strip()
    if pin and not is_valid_pin(pin):
        return jsonify({"error": "Invalid PIN code"}), 400
    standard_days = 5
    express_days = 3
    if pin and pin.startswith(("11", "40", "56", "60", "70", "12")):
        standard_days = 3
        express_days = 2
    fee = current_app.config["STANDARD_DELIVERY_FEE"]
    return jsonify(
        {
            "options": [
                {
                    "id": "standard",
                    "name": "Standard Delivery",
                    "fee": fee,
                    "estimatedDays": standard_days,
                    "note": "Estimated based on demo rules",
                },
                {
                    "id": "express",
                    "name": "Express Delivery",
                    "fee": fee + 100,
                    "estimatedDays": express_days,
                    "note": "Estimated based on demo rules",
                },
            ],
            "freeDeliveryThreshold": current_app.config["FREE_DELIVERY_THRESHOLD"],
        }
    )


@orders_bp.post("/quote")
def quote_order():
    """Recalculate totals from server prices — never trust client totals."""
    data = request.get_json(silent=True) or {}
    items = data.get("items") or []
    coupon_code = (data.get("couponCode") or "").strip().upper()
    delivery_method = data.get("deliveryMethod") or "standard"

    if not items:
        return jsonify({"error": "Cart is empty"}), 400

    line_items = []
    subtotal = 0
    product_discount = 0
    errors = []

    for raw in items:
        variant_id = raw.get("variantId")
        quantity = int(raw.get("quantity") or 0)
        if not variant_id or quantity < 1:
            errors.append("Each item needs a valid variant and quantity")
            continue
        variant = ProductVariant.query.get(variant_id)
        if not variant:
            errors.append(f"Variant {variant_id} not found")
            continue
        product = variant.product
        if not product or not product.is_active:
            errors.append(f"Product unavailable for variant {variant_id}")
            continue
        if variant.stock < quantity:
            errors.append(
                f"{product.name} size {variant.size}: only {variant.stock} in stock"
            )
            continue
        unit = product.price
        line_total = unit * quantity
        subtotal += line_total
        if product.original_price and product.original_price > product.price:
            product_discount += (product.original_price - product.price) * quantity
        line_items.append(
            {
                "variantId": variant.id,
                "productId": product.id,
                "name": product.name,
                "brand": product.brand,
                "size": variant.size,
                "color": variant.color,
                "imageUrl": product.image_url,
                "unitPrice": unit,
                "quantity": quantity,
                "lineTotal": line_total,
                "stock": variant.stock,
            }
        )

    if errors:
        return jsonify({"error": "Unable to quote order", "details": errors}), 400

    coupon_discount = 0
    coupon_info = None
    if coupon_code:
        coupon = Coupon.query.filter_by(code=coupon_code).first()
        if not coupon:
            return jsonify({"error": "Invalid coupon code"}), 400
        ok, err = coupon.is_valid(subtotal)
        if not ok:
            return jsonify({"error": err}), 400
        coupon_discount = coupon.calculate_discount(subtotal)
        coupon_info = {"code": coupon.code, "discount": coupon_discount, "isDemo": coupon.is_demo}

    threshold = current_app.config["FREE_DELIVERY_THRESHOLD"]
    base_fee = current_app.config["STANDARD_DELIVERY_FEE"]
    delivery_fee = 0 if subtotal >= threshold else base_fee
    if delivery_method == "express":
        delivery_fee = (0 if subtotal >= threshold else base_fee) + 100

    total = max(0, subtotal - coupon_discount + delivery_fee)
    return jsonify(
        {
            "items": line_items,
            "subtotal": subtotal,
            "productDiscount": product_discount,
            "coupon": coupon_info,
            "couponDiscount": coupon_discount,
            "deliveryFee": delivery_fee,
            "deliveryMethod": delivery_method,
            "total": total,
            "freeDeliveryThreshold": threshold,
            "note": "Totals calculated on the server from current catalogue prices.",
        }
    )


@orders_bp.post("/")
@limiter.limit("10 per minute")
def create_order():
    data = request.get_json(silent=True) or {}
    missing = require_fields(
        data,
        [
            "fullName",
            "mobile",
            "email",
            "pinCode",
            "state",
            "city",
            "house",
            "street",
            "paymentMethod",
            "items",
        ],
    )
    if missing:
        return jsonify({"error": "Missing required fields", "fields": missing}), 400

    if not is_valid_mobile(data["mobile"]):
        return jsonify({"error": "Enter a valid 10-digit Indian mobile number"}), 400
    if not is_valid_pin(data["pinCode"]):
        return jsonify({"error": "Enter a valid 6-digit PIN code"}), 400
    if not is_valid_email(data["email"]):
        return jsonify({"error": "Enter a valid email address"}), 400

    payment_method = data["paymentMethod"]
    if payment_method not in ("upi", "card", "cod"):
        return jsonify({"error": "Invalid payment method"}), 400

    # Never accept raw card/UPI secrets
    forbidden = ["cardNumber", "cvv", "upiPin", "password", "cardCvv", "expiry"]
    for key in forbidden:
        if key in data and data[key]:
            return (
                jsonify(
                    {
                        "error": "Do not send card numbers, CVVs, or UPI PINs. Use a payment gateway."
                    }
                ),
                400,
            )

    delivery_method = data.get("deliveryMethod") or "standard"
    quote_payload = {
        "items": data["items"],
        "couponCode": data.get("couponCode"),
        "deliveryMethod": delivery_method,
    }
    # Reuse quote logic inline
    with current_app.test_request_context(json=quote_payload):
        pass

    items = data["items"]
    coupon_code = (data.get("couponCode") or "").strip().upper() or None

    line_rows = []
    subtotal = 0
    product_discount = 0
    variants_to_decrement = []

    for raw in items:
        variant_id = raw.get("variantId")
        quantity = int(raw.get("quantity") or 0)
        if not variant_id or quantity < 1:
            return jsonify({"error": "Invalid cart items"}), 400
        variant = ProductVariant.query.get(variant_id)
        if not variant or not variant.product or not variant.product.is_active:
            return jsonify({"error": "One or more products are unavailable"}), 400
        if variant.stock < quantity:
            return (
                jsonify(
                    {
                        "error": f"Insufficient stock for {variant.product.name} size {variant.size}"
                    }
                ),
                400,
            )
        product = variant.product
        unit = product.price
        line_total = unit * quantity
        subtotal += line_total
        if product.original_price and product.original_price > product.price:
            product_discount += (product.original_price - product.price) * quantity
        line_rows.append((product, variant, quantity, unit, line_total))
        variants_to_decrement.append((variant, quantity))

    coupon_discount = 0
    if coupon_code:
        coupon = Coupon.query.filter_by(code=coupon_code).first()
        if not coupon:
            return jsonify({"error": "Invalid coupon code"}), 400
        ok, err = coupon.is_valid(subtotal)
        if not ok:
            return jsonify({"error": err}), 400
        coupon_discount = coupon.calculate_discount(subtotal)
        coupon.used_count += 1

    threshold = current_app.config["FREE_DELIVERY_THRESHOLD"]
    base_fee = current_app.config["STANDARD_DELIVERY_FEE"]
    delivery_fee = 0 if subtotal >= threshold else base_fee
    if delivery_method == "express":
        delivery_fee = (0 if subtotal >= threshold else base_fee) + 100

    total = max(0, subtotal - coupon_discount + delivery_fee)
    eta, _ = _estimate_delivery(data["pinCode"].strip(), delivery_method)

    payment_mode = current_app.config["PAYMENT_MODE"]
    is_demo = payment_mode == "demo"
    if payment_method == "cod":
        payment_status = "pending"
        payment_note = "Cash on Delivery selected. Amount due on delivery."
    elif is_demo:
        payment_status = "demo_recorded"
        payment_note = (
            "DEMO PAYMENT — No real payment was processed. "
            "Configure a payment gateway for production."
        )
    else:
        return (
            jsonify(
                {
                    "error": "Payment gateway is not configured. Use demo mode or COD.",
                }
            ),
            503,
        )

    user = _optional_user()

    order = Order(
        order_ref=generate_order_ref(),
        user_id=user.id if user else None,
        guest_email=None if user else data["email"].strip().lower(),
        full_name=data["fullName"].strip(),
        mobile=data["mobile"].strip(),
        email=data["email"].strip().lower(),
        pin_code=data["pinCode"].strip(),
        state=data["state"].strip(),
        city=data["city"].strip(),
        house=data["house"].strip(),
        street=data["street"].strip(),
        landmark=(data.get("landmark") or "").strip() or None,
        address_type=(data.get("addressType") or "").strip() or None,
        delivery_method=delivery_method,
        estimated_delivery=eta,
        payment_method=payment_method,
        payment_status=payment_status,
        is_demo_order=is_demo or payment_method == "cod",
        payment_note=payment_note,
        coupon_code=coupon_code,
        subtotal=subtotal,
        product_discount=product_discount,
        coupon_discount=coupon_discount,
        delivery_fee=delivery_fee,
        total=total,
        status="confirmed",
    )
    db.session.add(order)
    db.session.flush()

    for product, variant, quantity, unit, line_total in line_rows:
        db.session.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                variant_id=variant.id,
                product_name=product.name,
                brand=product.brand,
                size=variant.size,
                color=variant.color,
                image_url=product.image_url,
                unit_price=unit,
                quantity=quantity,
                line_total=line_total,
            )
        )
        variant.stock -= quantity

    db.session.commit()
    return (
        jsonify(
            {
                "message": "Order placed",
                "order": order.to_dict(detail=True),
            }
        ),
        201,
    )


@orders_bp.get("/mine")
@login_required
def my_orders():
    user = get_current_user()
    orders = Order.query.filter_by(user_id=user.id).order_by(Order.created_at.desc()).all()
    return jsonify({"orders": [o.to_dict(detail=True) for o in orders]})


@orders_bp.get("/track/<order_ref>")
def track_order(order_ref):
    order = Order.query.filter_by(order_ref=order_ref.upper()).first()
    if not order:
        # also try as-is
        order = Order.query.filter_by(order_ref=order_ref).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404

    # Allow owner or provide email verification for guests
    user = _optional_user()
    email = (request.args.get("email") or "").strip().lower()
    if user and order.user_id == user.id:
        pass
    elif user and user.is_admin:
        pass
    elif email and email == order.email.lower():
        pass
    elif not order.user_id and not email:
        # For demo: allow tracking by ref alone but mark limited
        pass
    elif order.user_id and (not user or order.user_id != user.id):
        if not email or email != order.email.lower():
            return jsonify({"error": "Provide the order email to track this order"}), 403

    return jsonify({"order": order.to_dict(detail=True)})


@orders_bp.get("/<int:order_id>")
@login_required
def get_order(order_id):
    user = get_current_user()
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order.user_id != user.id and not user.is_admin:
        return jsonify({"error": "Not authorized"}), 403
    return jsonify({"order": order.to_dict(detail=True)})
