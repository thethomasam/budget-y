from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
import pandas as pd
import io
from datetime import datetime

from celery import group
from celery.result import GroupResult

from app.database import get_db
from app.models import Transaction
from app.services.qwen_categoriser import categorise_transaction
from app.tasks.csv_upload import categorise_row

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

    required_columns = ["Date", "Description", "Amount"]
    if not all(col in df.columns for col in required_columns):
        raise HTTPException(status_code=400, detail=f"CSV must contain columns: {', '.join(required_columns)}")

    tasks = group(
        categorise_row.s(
            row["Date"],
            row["Description"],
            float(row["Amount"]),
            row.get("category") if pd.notna(row.get("category")) else None,
        )
        for _, row in df.iterrows()
    )
    result = tasks.apply_async()
    result.save()

    return {"group_id": result.id, "total": len(df), "status": "queued"}


@router.get("/upload-csv/{group_id}")
def get_upload_status(group_id: str):
    result = GroupResult.restore(group_id, app=categorise_row.app)
    if not result:
        raise HTTPException(status_code=404, detail="Upload job not found")

    total = len(result.results)
    completed = sum(1 for r in result.results if r.successful())
    failed = sum(1 for r in result.results if r.failed())

    if result.ready():
        return {"group_id": group_id, "status": "complete", "total": total, "completed": completed, "failed": failed}
    return {"group_id": group_id, "status": "processing", "total": total, "completed": completed, "failed": failed}


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

