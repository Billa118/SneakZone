from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from app import db


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    mobile = db.Column(db.String(15), nullable=True)
    role = db.Column(db.String(20), nullable=False, default="customer")  # customer | admin
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    addresses = db.relationship("Address", back_populates="user", cascade="all, delete-orphan")
    wishlist_items = db.relationship(
        "WishlistItem", back_populates="user", cascade="all, delete-orphan"
    )
    orders = db.relationship("Order", back_populates="user", lazy="dynamic")
    reviews = db.relationship("Review", back_populates="user", lazy="dynamic")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    def to_dict(self, include_email=True):
        data = {
            "id": self.id,
            "fullName": self.full_name,
            "mobile": self.mobile,
            "role": self.role,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
        if include_email:
            data["email"] = self.email
        return data


class Address(db.Model):
    __tablename__ = "addresses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    full_name = db.Column(db.String(120), nullable=False)
    mobile = db.Column(db.String(15), nullable=False)
    email = db.Column(db.String(255), nullable=True)
    pin_code = db.Column(db.String(6), nullable=False)
    state = db.Column(db.String(80), nullable=False)
    city = db.Column(db.String(80), nullable=False)
    house = db.Column(db.String(200), nullable=False)
    street = db.Column(db.String(200), nullable=False)
    landmark = db.Column(db.String(200), nullable=True)
    address_type = db.Column(db.String(40), nullable=True)  # home | work | other
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    user = db.relationship("User", back_populates="addresses")

    def to_dict(self):
        return {
            "id": self.id,
            "fullName": self.full_name,
            "mobile": self.mobile,
            "email": self.email,
            "pinCode": self.pin_code,
            "state": self.state,
            "city": self.city,
            "house": self.house,
            "street": self.street,
            "landmark": self.landmark,
            "addressType": self.address_type,
            "isDefault": self.is_default,
        }
