"""
Legacy database file - imports from the new app structure.
For new development, use app/database.py and app/models/ directly.
"""
from app.database import DATABASE_URL, engine, Base, get_db
from app.models import Transaction

__all__ = ["DATABASE_URL", "engine", "Base", "get_db", "Transaction"]

# Create tables
Base.metadata.create_all(bind=engine)

