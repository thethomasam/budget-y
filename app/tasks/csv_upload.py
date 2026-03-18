import asyncio
from datetime import datetime

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import Transaction
from app.services.qwen_categoriser import categorise_transaction


@celery_app.task
def categorise_row(date_str: str, merchant: str, amount: float, category: str = None):
    db = SessionLocal()
    try:
        if not category:
            category = asyncio.run(categorise_transaction(merchant, amount, db))

        db.add(Transaction(
            date=datetime.strptime(date_str, "%d/%m/%Y").date(),
            merchant=merchant,
            category=category,
            amount=amount,
            card="American Express",
        ))
        db.commit()
        return {"merchant": merchant, "category": category}

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
