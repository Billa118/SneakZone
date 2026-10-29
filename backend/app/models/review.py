from datetime import datetime, timezone

from app import db


def utcnow():
    return datetime.now(timezone.utc)


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    author_name = db.Column(db.String(120), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=True)
    body = db.Column(db.Text, nullable=False)
    is_demo = db.Column(db.Boolean, default=True, nullable=False)
    is_approved = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    product = db.relationship("Product", back_populates="reviews")
    user = db.relationship("User", back_populates="reviews")

    def to_dict(self):
        return {
            "id": self.id,
            "productId": self.product_id,
            "authorName": self.author_name,
            "rating": self.rating,
            "title": self.title,
            "body": self.body,
            "isDemo": self.is_demo,
            "demoLabel": "Sample review (demo content)" if self.is_demo else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
