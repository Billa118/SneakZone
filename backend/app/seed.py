"""Seed sample catalogue data. All products are clearly labeled as demo samples."""

from datetime import datetime, timedelta, timezone

from app import db
from app.config import Config
from app.models import (
    Category,
    Coupon,
    Order,
    OrderItem,
    Product,
    ProductImage,
    ProductVariant,
    Review,
    User,
)


# Royalty-free style Unsplash sneaker photos (demo assets, not branded merch)
IMG = {
    "runner1": "https://images.unsplash.com/photo-1542291026-7eec480c2dd7?w=800&q=80",
    "runner2": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80",
    "lifestyle1": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80",
    "lifestyle2": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
    "white1": "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80",
    "white2": "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80",
    "black1": "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80",
    "black2": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    "kids1": "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80",
    "sports1": "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80",
    "sports2": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80",
    "orange1": "https://images.unsplash.com/photo-1605348532760-6753d2c43364?w=800&q=80",
    "cat_men": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80",
    "cat_women": "https://images.unsplash.com/photo-1515957654101-5ca3d0c9e2d4?w=600&q=80",
    "cat_kids": "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=600&q=80",
    "cat_run": "https://images.unsplash.com/photo-1542291026-7eec480c2dd7?w=600&q=80",
    "cat_sports": "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&q=80",
    "cat_life": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80",
    "hero": "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1400&q=80",
}


SIZES_ADULT = ["6", "7", "8", "9", "10", "11"]
SIZES_KIDS = ["1", "2", "3", "4", "5"]


def _slugify(text: str) -> str:
    return (
        text.lower()
        .replace("&", "and")
        .replace(" ", "-")
        .replace("'", "")
        .replace(".", "")
    )


def seed_database():
    if Product.query.first():
        seed_demo_order()
        return

    categories = [
        ("Men", "men", IMG["cat_men"], "Sneakers designed for men"),
        ("Women", "women", IMG["cat_women"], "Sneakers designed for women"),
        ("Kids", "kids", IMG["cat_kids"], "Comfortable kicks for kids"),
        ("Running", "running", IMG["cat_run"], "Performance running footwear"),
        ("Sports", "sports", IMG["cat_sports"], "Training and court sports"),
        ("Lifestyle", "lifestyle", IMG["cat_life"], "Everyday lifestyle sneakers"),
    ]
    cat_map = {}
    for name, slug, image, desc in categories:
        c = Category(name=name, slug=slug, image_url=image, description=desc)
        db.session.add(c)
        cat_map[slug] = c
    db.session.flush()

    products_data = [
        {
            "name": "Aero Sprint Runner",
            "brand": "StrideLab",
            "category": "running",
            "gender": "men",
            "description": "Demo sample. Lightweight cushioned runner built for daily miles and city streets. Not affiliated with any major brand.",
            "material": "Mesh upper, foam midsole, rubber outsole",
            "specifications": "Drop: 8mm | Weight: ~260g | Closure: lace-up",
            "price": 4999,
            "original_price": 6999,
            "image": IMG["runner1"],
            "extra_images": [IMG["runner2"], IMG["sports2"]],
            "colors": "Black,Red",
            "tags": "trending,bestseller",
            "rating": 4.5,
            "reviews": 128,
            "sizes": SIZES_ADULT,
        },
        {
            "name": "Cloudstep Everyday",
            "brand": "UrbanForm",
            "category": "lifestyle",
            "gender": "unisex",
            "description": "Demo sample. Soft everyday sneaker with a clean silhouette for work-to-weekend wear.",
            "material": "Knit upper, EVA midsole",
            "specifications": "Slip-resistant sole | Removable insole",
            "price": 3499,
            "original_price": 4499,
            "image": IMG["lifestyle1"],
            "extra_images": [IMG["white1"]],
            "colors": "White,Grey",
            "tags": "trending,new",
            "rating": 4.3,
            "reviews": 86,
            "sizes": SIZES_ADULT,
        },
        {
            "name": "Pulse Court Pro",
            "brand": "CourtPeak",
            "category": "sports",
            "gender": "men",
            "description": "Demo sample. Lateral support and grippy outsole for indoor training sessions.",
            "material": "Synthetic leather overlays, rubber cupsole",
            "specifications": "Court grip pattern | Ankle collar padding",
            "price": 5599,
            "original_price": 6599,
            "image": IMG["sports1"],
            "extra_images": [IMG["black1"]],
            "colors": "Navy,White",
            "tags": "bestseller",
            "rating": 4.6,
            "reviews": 203,
            "sizes": SIZES_ADULT,
        },
        {
            "name": "Velvet Walk Low",
            "brand": "Maison Lane",
            "category": "women",
            "gender": "women",
            "description": "Demo sample. Minimal low-top with soft lining and a refined off-white finish.",
            "material": "Suede-touch upper, rubber outsole",
            "specifications": "Memory foam sockliner | Narrow-to-regular fit",
            "price": 4299,
            "original_price": 5299,
            "image": IMG["white2"],
            "extra_images": [IMG["lifestyle2"]],
            "colors": "Cream,Blush",
            "tags": "trending,new",
            "rating": 4.4,
            "reviews": 94,
            "sizes": SIZES_ADULT,
        },
        {
            "name": "Night Trail Flex",
            "brand": "StrideLab",
            "category": "running",
            "gender": "unisex",
            "description": "Demo sample. Reflective accents and responsive foam for evening training runs.",
            "material": "Engineered mesh, plate-assisted foam",
            "specifications": "Reflective hits | Rock plate feel (demo)",
            "price": 6499,
            "original_price": 7999,
            "image": IMG["black2"],
            "extra_images": [IMG["runner2"]],
            "colors": "Black,Orange",
            "tags": "new,trending",
            "rating": 4.7,
            "reviews": 61,
            "sizes": SIZES_ADULT,
        },
        {
            "name": "Junior Bounce",
            "brand": "PlayKick",
            "category": "kids",
            "gender": "kids",
            "description": "Demo sample. Durable kids sneaker with easy-on straps and bright colourways.",
            "material": "Textile upper, flexible rubber sole",
            "specifications": "Machine-washable upper (gentle) | Hook-and-loop option",
            "price": 1999,
            "original_price": 2499,
            "image": IMG["kids1"],
            "extra_images": [IMG["orange1"]],
            "colors": "Blue,Yellow",
            "tags": "bestseller",
            "rating": 4.2,
            "reviews": 47,
            "sizes": SIZES_KIDS,
        },
        {
            "name": "Metro Classic High",
            "brand": "UrbanForm",
            "category": "lifestyle",
            "gender": "men",
            "description": "Demo sample. High-top silhouette with padded collar for all-day comfort.",
            "material": "Canvas upper, vulcanized rubber",
            "specifications": "High ankle support | Classic lace system",
            "price": 3799,
            "original_price": None,
            "image": IMG["black1"],
            "extra_images": [IMG["lifestyle2"]],
            "colors": "Black,White",
            "tags": "trending",
            "rating": 4.1,
            "reviews": 112,
            "sizes": SIZES_ADULT,
        },
        {
            "name": "Aura Soft Walk",
            "brand": "Maison Lane",
            "category": "women",
            "gender": "women",
            "description": "Demo sample. Feather-light trainer with breathable knit for warm-weather walks.",
            "material": "Breathable knit, soft foam",
            "specifications": "Sock-like fit | Flexible tread",
            "price": 3899,
            "original_price": 4799,
            "image": IMG["lifestyle2"],
            "extra_images": [IMG["white1"]],
            "colors": "Lilac,White",
            "tags": "new",
            "rating": 4.5,
            "reviews": 73,
            "sizes": SIZES_ADULT,
        },
        {
            "name": "Forge Training X",
            "brand": "CourtPeak",
            "category": "sports",
            "gender": "unisex",
            "description": "Demo sample. Stable platform for gym floors and short HIIT sessions.",
            "material": "Reinforced overlays, dense foam",
            "specifications": "Wide base | Toe bumper",
            "price": 5299,
            "original_price": 6299,
            "image": IMG["orange1"],
            "extra_images": [IMG["sports2"]],
            "colors": "Orange,Grey",
            "tags": "bestseller,trending",
            "rating": 4.6,
            "reviews": 155,
            "sizes": SIZES_ADULT,
        },
        {
            "name": "Street Loom Retro",
            "brand": "FormEra",
            "category": "men",
            "gender": "men",
            "description": "Demo sample. Retro runner aesthetic with modern cushioning — sample product only.",
            "material": "Nylon and suede panels, EVA foam",
            "specifications": "Heritage shape | Contrast stitching",
            "price": 4599,
            "original_price": 5499,
            "image": IMG["runner2"],
            "extra_images": [IMG["sports1"]],
            "colors": "Green,Cream",
            "tags": "new,trending",
            "rating": 4.3,
            "reviews": 89,
            "sizes": SIZES_ADULT,
        },
        {
            "name": "Petite Dash",
            "brand": "PlayKick",
            "category": "kids",
            "gender": "kids",
            "description": "Demo sample. Lightweight kids runner for school and playtime.",
            "material": "Mesh, soft foam midsole",
            "specifications": "Reflective heel | Easy lace",
            "price": 1799,
            "original_price": 2199,
            "image": IMG["sports2"],
            "extra_images": [IMG["kids1"]],
            "colors": "Pink,Teal",
            "tags": "new",
            "rating": 4.0,
            "reviews": 33,
            "sizes": SIZES_KIDS,
        },
        {
            "name": "Horizon Pace Elite",
            "brand": "StrideLab",
            "category": "running",
            "gender": "women",
            "description": "Demo sample. Speed-oriented trainer with a snug midfoot wrap for tempo days.",
            "material": "Technical mesh, dual-density foam",
            "specifications": "Tempo-ready feel | Heel lock padding",
            "price": 6999,
            "original_price": 8499,
            "image": IMG["white1"],
            "extra_images": [IMG["runner1"], IMG["black2"]],
            "colors": "White,Mint",
            "tags": "bestseller,new",
            "rating": 4.8,
            "reviews": 210,
            "sizes": SIZES_ADULT,
        },
        {
            "name": "Canvas Weekend Slip",
            "brand": "FormEra",
            "category": "lifestyle",
            "gender": "unisex",
            "description": "Demo sample. Easy slip-on lifestyle shoe for weekend errands.",
            "material": "Canvas, elastic gore",
            "specifications": "No-tie design | Flexible sole",
            "price": 2499,
            "original_price": 2999,
            "image": IMG["lifestyle1"],
            "extra_images": [IMG["cat_life"]],
            "colors": "Beige,Navy",
            "tags": "trending",
            "rating": 4.0,
            "reviews": 58,
            "sizes": SIZES_ADULT,
        },
        {
            "name": "Summit Court Low",
            "brand": "CourtPeak",
            "category": "sports",
            "gender": "men",
            "description": "Demo sample. Low-cut court shoe with durable overlays for outdoor courts.",
            "material": "Synthetic leather, rubber outsole",
            "specifications": "Abrasion-resistant toe | Lateral wrap",
            "price": 4899,
            "original_price": 5899,
            "image": IMG["sports1"],
            "extra_images": [IMG["black1"]],
            "colors": "White,Black",
            "tags": "bestseller",
            "rating": 4.4,
            "reviews": 141,
            "sizes": SIZES_ADULT,
        },
    ]

    for pdata in products_data:
        product = Product(
            name=pdata["name"],
            slug=_slugify(f"{pdata['brand']}-{pdata['name']}"),
            brand=pdata["brand"],
            category_id=cat_map[pdata["category"]].id,
            description=pdata["description"],
            material=pdata["material"],
            specifications=pdata["specifications"],
            price=pdata["price"],
            original_price=pdata["original_price"],
            image_url=pdata["image"],
            colors=pdata["colors"],
            gender=pdata["gender"],
            tags=pdata["tags"],
            is_active=True,
            is_demo=True,
            demo_rating=pdata["rating"],
            demo_review_count=pdata["reviews"],
        )
        db.session.add(product)
        db.session.flush()

        db.session.add(
            ProductImage(
                product_id=product.id,
                url=pdata["image"],
                alt=f"{pdata['name']} primary (demo)",
                sort_order=0,
            )
        )
        for idx, url in enumerate(pdata.get("extra_images", []), start=1):
            db.session.add(
                ProductImage(
                    product_id=product.id,
                    url=url,
                    alt=f"{pdata['name']} view {idx} (demo)",
                    sort_order=idx,
                )
            )

        primary_color = pdata["colors"].split(",")[0].strip()
        for size in pdata["sizes"]:
            for color in [c.strip() for c in pdata["colors"].split(",")]:
                stock = 12 if color == primary_color else 6
                if size in ("11", "5") and color != primary_color:
                    stock = 0
                sku = f"SZ-{product.id}-{size}-{color[:3].upper()}"
                db.session.add(
                    ProductVariant(
                        product_id=product.id,
                        size=size,
                        color=color,
                        stock=stock,
                        sku=sku,
                    )
                )

        db.session.add(
            Review(
                product_id=product.id,
                author_name="Demo Shopper",
                rating=int(pdata["rating"]),
                title="Sample review",
                body="This is sample demo content for design preview and is not a verified customer review.",
                is_demo=True,
            )
        )

    coupons = [
        Coupon(
            code="SNEAK10",
            description="Demo 10% off orders over ₹1999",
            discount_type="percent",
            discount_value=10,
            min_order_amount=1999,
            max_discount=800,
            is_active=True,
            is_demo=True,
            usage_limit=1000,
        ),
        Coupon(
            code="FLAT300",
            description="Demo ₹300 off orders over ₹2499",
            discount_type="fixed",
            discount_value=300,
            min_order_amount=2499,
            is_active=True,
            is_demo=True,
            usage_limit=500,
            expires_at=datetime.now(timezone.utc) + timedelta(days=90),
        ),
        Coupon(
            code="WELCOME50",
            description="Demo ₹50 off — small welcome coupon",
            discount_type="fixed",
            discount_value=50,
            min_order_amount=999,
            is_active=True,
            is_demo=True,
        ),
    ]
    for c in coupons:
        db.session.add(c)

    admin = User(
        email=Config.ADMIN_EMAIL.lower(),
        full_name="SNEAKZONE Admin",
        mobile="9999999999",
        role="admin",
        is_active=True,
    )
    admin.set_password(Config.ADMIN_PASSWORD)
    db.session.add(admin)

    demo_customer = User(
        email="customer@sneakzone.local",
        full_name="Demo Customer",
        mobile="9876543210",
        role="customer",
        is_active=True,
    )
    demo_customer.set_password("Customer123!")
    db.session.add(demo_customer)

    db.session.commit()
    seed_demo_order()


def seed_demo_order():
    """Create or refresh Aditya's realistic, trackable COD demo order."""
    order_ref = "1730900772"
    order = Order.query.filter_by(order_ref=order_ref).first()
    legacy_order = Order.query.filter_by(order_ref="SZ-20261025-DEMO01").first()
    if not order:
        order = legacy_order
    elif legacy_order and legacy_order.id != order.id:
        db.session.delete(legacy_order)

    product = Product.query.filter_by(name="Summit Court Low").first()
    variant = (
        ProductVariant.query.filter_by(product_id=product.id, size="9", color="Black").first()
        if product
        else None
    )
    if not product or not variant:
        return

    customer = User.query.filter_by(email="customer@sneakzone.local").first()
    if not customer:
        customer = User(
            email="customer@sneakzone.local",
            full_name="Aditya",
            mobile="9876543210",
            role="customer",
            is_active=True,
        )
        customer.set_password("Customer123!")
        db.session.add(customer)
    else:
        customer.full_name = "Aditya"
        customer.set_password("Customer123!")
    db.session.flush()

    order_date = datetime(2026, 10, 25, 10, 30, tzinfo=timezone.utc)
    delivery_date = datetime(2026, 10, 31, 18, 0, tzinfo=timezone.utc)
    order_values = {
        "order_ref": order_ref,
        "user_id": customer.id,
        "guest_email": None,
        "full_name": "Aditya",
        "mobile": "9876543210",
        "email": customer.email,
        "pin_code": "421301",
        "state": "Maharashtra",
        "city": "Kalyan",
        "house": "Durgadi Chowk",
        "street": "Kalyan Near Durgadi Fort",
        "landmark": "Durgadi Fort",
        "address_type": "home",
        "delivery_method": "open_box",
        "estimated_delivery": delivery_date,
        "payment_method": "cod",
        "payment_status": "pending",
        "is_demo_order": True,
        "payment_note": (
            "Cash on Delivery — ₹4,990 due at delivery. Open Box Delivery is enabled; "
            "inspect the package before accepting."
        ),
        "subtotal": 4990,
        "product_discount": 0,
        "coupon_discount": 0,
        "delivery_fee": 0,
        "total": 4990,
        "status": "out_for_delivery",
        "created_at": order_date,
        "status_updated_at": datetime(2026, 10, 29, 9, 0, tzinfo=timezone.utc),
    }
    if not order:
        order = Order(**order_values)
        db.session.add(order)
    else:
        for field, value in order_values.items():
            setattr(order, field, value)
    db.session.flush()

    item = order.items[0] if order.items else None
    if not item:
        item = OrderItem(order_id=order.id)
        db.session.add(item)
        variant.stock = max(0, variant.stock - 1)
    for field, value in {
        "product_id": product.id,
        "variant_id": variant.id,
        "product_name": "Rush Shoes Kl",
        "brand": "Rk Enterprise",
        "size": variant.size,
        "color": "Black",
        "image_url": IMG["black1"],
        "unit_price": 4990,
        "quantity": 1,
        "line_total": 4990,
    }.items():
        setattr(item, field, value)
    for extra_item in order.items[1:]:
        db.session.delete(extra_item)

    db.session.commit()
