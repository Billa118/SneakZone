from datetime import datetime, timezone

from app import db


def utcnow():
    return datetime.now(timezone.utc)


class WishlistItem(db.Model):
    __tablename__ = "wishlist_items"
    __table_args__ = (
        db.UniqueConstraint("user_id", "product_id", name="uq_user_product_wishlist"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    user = db.relationship("User", back_populates="wishlist_items")
    product = db.relationship("Product")

    def to_dict(self):
        return {
            "id": self.id,
            "productId": self.product_id,
            "product": self.product.to_dict() if self.product else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
