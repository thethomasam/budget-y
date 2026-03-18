from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
import asyncio
import pandas as pd
import io
from datetime import datetime

from app.database import get_db
from app.models import Transaction
from app.services.qwen_categoriser import categorise_transaction

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a CSV file with transactions
    Expected columns: Date, Description, Amount
    Optional columns: category
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

        # Validate required columns
        required_columns = ['Date', 'Description', 'Amount']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {', '.join(required_columns)}"
            )

        rows = list(df.iterrows())

        # Gather all categorization calls concurrently
        async def resolve_category(row):
            category = row.get('category', None)
            if pd.isna(category) or category == '':
                return await categorise_transaction(row.get("Description"), float(row["Amount"]), db), True
            return category, False

        results = await asyncio.gather(*[resolve_category(row) for _, row in rows])

        transactions_added = 0
        transactions_categorized = sum(1 for _, auto in results if auto)
        for (_, row), (category, _) in zip(rows, results):
            transaction = Transaction(
                date=datetime.strptime(str(row['Date']), '%d/%m/%Y').date(),
                merchant=row.get("Description"),
                category=category,
                amount=float(row["Amount"]),
                card="American Express"
            )
            db.add(transaction)
            transactions_added += 1

        db.commit()

        return {
            "message": "CSV uploaded successfully",
            "transactions_added": transactions_added,
            "transactions_categorized": transactions_categorized
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")


@router.get("")
def get_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all transactions"""
    transactions = db.query(Transaction).offset(skip).limit(limit).all()
    return transactions


@router.post("")
async def add_transaction(merchant: str, amount: float, card: str, category: Optional[str] = None, db: Session = Depends(get_db)):
    """Add a single transaction to the database with automatic categorization"""
    try:
        if not category:
            category = await categorise_transaction(merchant, amount, db)

        new_transaction = Transaction(
            date=datetime.now().date(),
            merchant=merchant,
            category=category,
            amount=amount,
            card=card
        )

        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction)

        return {
            "message": "Transaction added successfully",
            "id": new_transaction.id,
            "category": category,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error adding transaction: {str(e)}")


@router.delete("")
def delete_all_transactions(db: Session = Depends(get_db)):
    """Delete all transactions"""
    db.query(Transaction).delete()
    db.commit()
    return {"message": "All transactions deleted"}

