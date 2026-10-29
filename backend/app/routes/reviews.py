from flask import Blueprint, jsonify, request

from app.models import Product, Review

reviews_bp = Blueprint("reviews", __name__)


@reviews_bp.get("/product/<int:product_id>")
def product_reviews(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    reviews = (
        Review.query.filter_by(product_id=product_id, is_approved=True)
        .order_by(Review.created_at.desc())
        .all()
    )
    return jsonify(
        {
            "reviews": [r.to_dict() for r in reviews],
            "note": "Some reviews may be sample demo content and are labeled as such.",
        }
    )


@reviews_bp.get("/homepage")
def homepage_reviews():
    """Sample homepage testimonials — clearly demo content."""
    samples = [
        {
            "id": "demo-1",
            "authorName": "Aisha K.",
            "rating": 5,
            "body": "Clean design and the size guide helped. Sample testimonial for the demo storefront.",
            "isDemo": True,
            "demoLabel": "Sample review (demo content)",
        },
        {
            "id": "demo-2",
            "authorName": "Rohan M.",
            "rating": 4,
            "body": "Checkout felt straightforward. This is sample content, not a verified purchase review.",
            "isDemo": True,
            "demoLabel": "Sample review (demo content)",
        },
        {
            "id": "demo-3",
            "authorName": "Neha S.",
            "rating": 5,
            "body": "Loved the product photography and filters. Demo review for UI preview only.",
            "isDemo": True,
            "demoLabel": "Sample review (demo content)",
        },
    ]
    return jsonify({"reviews": samples, "note": "Sample content for demonstration."})
