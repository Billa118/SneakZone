from datetime import datetime, timezone
import secrets

from app import db


def utcnow():
    return datetime.now(timezone.utc)


ORDER_STATUSES = [
    "confirmed",
    "processing",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
]


def generate_order_ref():
    return f"SZ-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}"


class Coupon(db.Model):
    __tablename__ = "coupons"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(40), unique=True, nullable=False, index=True)
    description = db.Column(db.String(200), nullable=True)
    discount_type = db.Column(db.String(20), nullable=False)  # percent | fixed
    discount_value = db.Column(db.Integer, nullable=False)
    min_order_amount = db.Column(db.Integer, default=0)
    max_discount = db.Column(db.Integer, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    is_demo = db.Column(db.Boolean, default=True)
    usage_limit = db.Column(db.Integer, nullable=True)
    used_count = db.Column(db.Integer, default=0)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    def is_valid(self, subtotal: int):
        if not self.is_active:
            return False, "Coupon is inactive"
        if self.expires_at and self.expires_at.replace(tzinfo=timezone.utc) < utcnow():
            return False, "Coupon has expired"
        if self.usage_limit is not None and self.used_count >= self.usage_limit:
            return False, "Coupon usage limit reached"
        if subtotal < self.min_order_amount:
            return False, f"Minimum order amount is ₹{self.min_order_amount}"
        return True, None

    def calculate_discount(self, subtotal: int) -> int:
        ok, _ = self.is_valid(subtotal)
        if not ok:
            return 0
        if self.discount_type == "percent":
            discount = int(subtotal * self.discount_value / 100)
            if self.max_discount is not None:
                discount = min(discount, self.max_discount)
            return discount
        return min(self.discount_value, subtotal)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "description": self.description,
            "discountType": self.discount_type,
            "discountValue": self.discount_value,
            "minOrderAmount": self.min_order_amount,
            "maxDiscount": self.max_discount,
            "isActive": self.is_active,
            "isDemo": self.is_demo,
            "usageLimit": self.usage_limit,
            "usedCount": self.used_count,
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
        }


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    order_ref = db.Column(db.String(40), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    guest_email = db.Column(db.String(255), nullable=True)

    # Snapshot of delivery address
    full_name = db.Column(db.String(120), nullable=False)
    mobile = db.Column(db.String(15), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    pin_code = db.Column(db.String(6), nullable=False)
    state = db.Column(db.String(80), nullable=False)
    city = db.Column(db.String(80), nullable=False)
    house = db.Column(db.String(200), nullable=False)
    street = db.Column(db.String(200), nullable=False)
    landmark = db.Column(db.String(200), nullable=True)
    address_type = db.Column(db.String(40), nullable=True)

    delivery_method = db.Column(db.String(40), nullable=False, default="standard")
    estimated_delivery = db.Column(db.DateTime, nullable=True)
    payment_method = db.Column(db.String(40), nullable=False)  # upi | card | cod
    payment_status = db.Column(db.String(40), nullable=False, default="pending")
    # pending | demo_recorded | failed | paid
    is_demo_order = db.Column(db.Boolean, default=True, nullable=False)
    payment_note = db.Column(db.String(300), nullable=True)

    coupon_code = db.Column(db.String(40), nullable=True)
    subtotal = db.Column(db.Integer, nullable=False)
    product_discount = db.Column(db.Integer, default=0)
    coupon_discount = db.Column(db.Integer, default=0)
    delivery_fee = db.Column(db.Integer, default=0)
    total = db.Column(db.Integer, nullable=False)

    status = db.Column(db.String(40), nullable=False, default="confirmed", index=True)
    status_updated_at = db.Column(db.DateTime, default=utcnow)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False, index=True)

    user = db.relationship("User", back_populates="orders")
    items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    def tracking_timeline(self):
        status_order = [
            ("confirmed", "Order Confirmed"),
            ("processing", "Processing"),
            ("packed", "Packed"),
            ("shipped", "Shipped"),
            ("out_for_delivery", "Out for Delivery"),
            ("delivered", "Delivered"),
        ]
        if self.status == "cancelled":
            return [
                {
                    "key": "confirmed",
                    "label": "Order Confirmed",
                    "completed": True,
                    "current": False,
                },
                {
                    "key": "cancelled",
                    "label": "Cancelled",
                    "completed": True,
                    "current": True,
                },
            ]

        current_idx = next(
            (i for i, (k, _) in enumerate(status_order) if k == self.status), 0
        )
        timeline = []
        for i, (key, label) in enumerate(status_order):
            timeline.append(
                {
                    "key": key,
                    "label": label,
                    "completed": i <= current_idx,
                    "current": i == current_idx,
                }
            )
        return timeline

    def to_dict(self, detail=False):
        data = {
            "id": self.id,
            "orderRef": self.order_ref,
            "status": self.status,
            "paymentMethod": self.payment_method,
            "paymentStatus": self.payment_status,
            "isDemoOrder": self.is_demo_order,
            "paymentNote": self.payment_note,
            "deliveryMethod": self.delivery_method,
            "deliveryMethodLabel": {
                "open_box": "Open Box Delivery",
                "express": "Express Delivery",
            }.get(self.delivery_method, "Standard Delivery"),
            "paymentMethodLabel": {
                "cod": "Cash on Delivery (COD)",
                "upi": "UPI",
                "card": "Credit / debit card",
            }.get(self.payment_method, self.payment_method.upper()),
            "estimatedDelivery": (
                self.estimated_delivery.isoformat() if self.estimated_delivery else None
            ),
            "estimatedDeliveryNote": (
                "Scheduled delivery date"
                if self.delivery_method == "open_box"
                else "Estimated delivery date (demo rules)"
            ),
            "subtotal": self.subtotal,
            "productDiscount": self.product_discount,
            "couponCode": self.coupon_code,
            "couponDiscount": self.coupon_discount,
            "deliveryFee": self.delivery_fee,
            "total": self.total,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "itemCount": len(self.items),
        }
        if detail:
            data.update(
                {
                    "fullName": self.full_name,
                    "mobile": self.mobile,
                    "email": self.email,
                    "address": {
                        "pinCode": self.pin_code,
                        "state": self.state,
                        "city": self.city,
                        "house": self.house,
                        "street": self.street,
                        "landmark": self.landmark,
                        "addressType": self.address_type,
                    },
                    "items": [i.to_dict() for i in self.items],
                    "timeline": self.tracking_timeline(),
                }
            )
        return data


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)
    variant_id = db.Column(db.Integer, db.ForeignKey("product_variants.id"), nullable=True)
    product_name = db.Column(db.String(200), nullable=False)
    brand = db.Column(db.String(100), nullable=False)
    size = db.Column(db.String(10), nullable=False)
    color = db.Column(db.String(40), nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    unit_price = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    line_total = db.Column(db.Integer, nullable=False)

    order = db.relationship("Order", back_populates="items")

    def to_dict(self):
        return {
            "id": self.id,
            "productId": self.product_id,
            "variantId": self.variant_id,
            "productName": self.product_name,
            "brand": self.brand,
            "size": self.size,
            "color": self.color,
            "imageUrl": self.image_url,
            "unitPrice": self.unit_price,
            "quantity": self.quantity,
            "lineTotal": self.line_total,
        }
