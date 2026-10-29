"""Vercel entrypoint for the Flask API service."""

from app import create_app

app = create_app()