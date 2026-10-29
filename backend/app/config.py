import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-insecure-change-me")
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///sneakzone.db")
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    CORS_ORIGINS = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if o.strip()
    ]
    SEED_ON_START = os.getenv("SEED_ON_START", "false").lower() == "true"
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@sneakzone.local")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "ChangeMeAdmin123!")
    PAYMENT_MODE = os.getenv("PAYMENT_MODE", "demo")
    FREE_DELIVERY_THRESHOLD = int(os.getenv("FREE_DELIVERY_THRESHOLD", "2999"))
    STANDARD_DELIVERY_FEE = int(os.getenv("STANDARD_DELIVERY_FEE", "99"))
