import io
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import pandas as pd
import redis as redis_lib
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import config
from app.database import get_db
from app.models import Transaction
from app.schemas.transaction import TransactionCreate
from app.services.qwen_categoriser import categorise_transaction
from app.tasks.csv_upload import process_csv, categorise_single

router = APIRouter(prefix="/transactions", tags=["transactions"])

PROC = config["processing"]
REDIS_URL = config["redis"]["url"]


@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    contents = await file.read()

    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    required_columns = ["Date", "Description", "Amount"]
    if not all(col in df.columns for col in required_columns):
        raise HTTPException(status_code=400, detail=f"CSV must contain columns: {', '.join(required_columns)}")

    # Save file to disk
    upload_dir = Path(PROC["upload_dir"])
    upload_dir.mkdir(parents=True, exist_ok=True)
    job_id = str(uuid.uuid4())
    file_path = upload_dir / f"{job_id}.csv"
    file_path.write_bytes(contents)

    # Initialise job status in Redis
    r = redis_lib.from_url(REDIS_URL)
    r.hset(f"job:{job_id}", mapping={
        "total": len(df),
        "status": "processing",
        "rule_categorised": 0,
        "llm_queued": 0,
        "llm_done": 0,
        "failed": 0,
        "orchestrator_done": 0,
    })
    r.expire(f"job:{job_id}", PROC["job_ttl"])
    r.close()

    process_csv.delay(job_id, str(file_path), len(df))

    return {"job_id": job_id, "total": len(df), "status": "queued"}


@router.get("/upload-csv/{job_id}")
def get_upload_status(job_id: str):
    r = redis_lib.from_url(REDIS_URL)
    job = r.hgetall(f"job:{job_id}")
    r.close()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job_id,
        "status": job.get(b"status", b"unknown").decode(),
        "total": int(job.get(b"total", b"0")),
        "rule_categorised": int(job.get(b"rule_categorised", b"0")),
        "llm_done": int(job.get(b"llm_done", b"0")),
        "llm_queued": int(job.get(b"llm_queued", b"0")),
        "failed": int(job.get(b"failed", b"0")),
    }


@router.get("")
def get_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all transactions"""
    return db.query(Transaction).offset(skip).limit(limit).all()


@router.post("")
async def add_transaction(body: TransactionCreate, db: Session = Depends(get_db)):
    """Add a single transaction with automatic categorization"""
    if not body.merchant:
        raise HTTPException(status_code=400, detail="Merchant is required")
    if body.amount is None:
        raise HTTPException(status_code=400, detail="Amount is required")
    if body.amount == 0:
        raise HTTPException(status_code=400, detail="Amount cannot be zero")
    try:
        new_transaction = Transaction(
            date=datetime.now().date(),
            merchant=body.merchant,
            category=body.category or None,
            amount=float(body.amount),
            card=body.card,
        )
        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction)

        if not body.category:
            categorise_single.delay(new_transaction.id, body.merchant, float(body.amount))

        return {"message": "Transaction added successfully", "id": new_transaction.id, "status": "categorising"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error adding transaction: {str(e)}")


@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Delete a single transaction by ID"""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted"}


@router.delete("")
def delete_all_transactions(db: Session = Depends(get_db)):
    """Delete all transactions"""
    db.query(Transaction).delete()
    db.commit()
    return {"message": "All transactions deleted"}
