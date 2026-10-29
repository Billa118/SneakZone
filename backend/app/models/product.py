from datetime import datetime, timezone

from app import db


def utcnow():
    return datetime.now(timezone.utc)


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)
    image_url = db.Column(db.String(500), nullable=True)
    description = db.Column(db.String(300), nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    products = db.relationship("Product", back_populates="category", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "imageUrl": self.image_url,
            "description": self.description,
        }


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    slug = db.Column(db.String(220), unique=True, nullable=False, index=True)
    brand = db.Column(db.String(100), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    description = db.Column(db.Text, nullable=False)
    material = db.Column(db.String(200), nullable=True)
    specifications = db.Column(db.Text, nullable=True)
    price = db.Column(db.Integer, nullable=False)  # INR paise? No — store INR rupees as int
    original_price = db.Column(db.Integer, nullable=True)
    image_url = db.Column(db.String(500), nullable=False)
    colors = db.Column(db.String(300), nullable=True)  # comma-separated
    gender = db.Column(db.String(20), nullable=True)  # men | women | kids | unisex
    tags = db.Column(db.String(300), nullable=True)  # trending,new,bestseller
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)
    is_demo = db.Column(db.Boolean, default=True, nullable=False)
    demo_rating = db.Column(db.Float, nullable=True)
    demo_review_count = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    category = db.relationship("Category", back_populates="products")
    variants = db.relationship(
        "ProductVariant", back_populates="product", cascade="all, delete-orphan"
    )
    images = db.relationship(
        "ProductImage", back_populates="product", cascade="all, delete-orphan"
    )
    reviews = db.relationship("Review", back_populates="product", lazy="dynamic")

    def discount_percent(self):
        if self.original_price and self.original_price > self.price:
            return round(((self.original_price - self.price) / self.original_price) * 100)
        return 0

    def color_list(self):
        if not self.colors:
            return []
        return [c.strip() for c in self.colors.split(",") if c.strip()]

    def tag_list(self):
        if not self.tags:
            return []
        return [t.strip() for t in self.tags.split(",") if t.strip()]

    def total_stock(self):
        return sum(v.stock for v in self.variants)

    def to_dict(self, detail=False):
        data = {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "brand": self.brand,
            "category": self.category.to_dict() if self.category else None,
            "price": self.price,
            "originalPrice": self.original_price,
            "discountPercent": self.discount_percent(),
            "imageUrl": self.image_url,
            "colors": self.color_list(),
            "gender": self.gender,
            "tags": self.tag_list(),
            "isActive": self.is_active,
            "isDemo": self.is_demo,
            "rating": self.demo_rating,
            "reviewCount": self.demo_review_count,
            "ratingNote": "Sample demo rating" if self.is_demo and self.demo_rating else None,
            "stock": self.total_stock(),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
        if detail:
            data.update(
                {
                    "description": self.description,
                    "material": self.material,
                    "specifications": self.specifications,
                    "variants": [v.to_dict() for v in self.variants],
                    "images": [img.to_dict() for img in sorted(self.images, key=lambda i: i.sort_order)],
                }
            )
            if not data["images"]:
                data["images"] = [{"id": 0, "url": self.image_url, "alt": self.name, "sortOrder": 0}]
        return data


class ProductVariant(db.Model):
    __tablename__ = "product_variants"
    __table_args__ = (
        db.UniqueConstraint("product_id", "size", "color", name="uq_product_size_color"),
    )

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    size = db.Column(db.String(10), nullable=False)
    color = db.Column(db.String(40), nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)
    sku = db.Column(db.String(80), unique=True, nullable=False)

    product = db.relationship("Product", back_populates="variants")

    def to_dict(self):
        return {
            "id": self.id,
            "size": self.size,
            "color": self.color,
            "stock": self.stock,
            "sku": self.sku,
            "available": self.stock > 0,
        }


class ProductImage(db.Model):
    __tablename__ = "product_images"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    url = db.Column(db.String(500), nullable=False)
    alt = db.Column(db.String(200), nullable=True)
    sort_order = db.Column(db.Integer, default=0)

    product = db.relationship("Product", back_populates="images")

    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url,
            "alt": self.alt,
            "sortOrder": self.sort_order,
        }
