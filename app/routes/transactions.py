import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import pandas as pd
import redis as redis_lib
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import config, REDIS_URL
from app.database import get_db
from app.models import Transaction
from app.schemas.transaction import TransactionCreate
from app.services.csv_parser import CSVParser
from app.tasks.csv_upload import process_csv, categorise_single

router = APIRouter(prefix="/transactions", tags=["transactions"])

QUEUE = config["processing"]


@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    contents = await file.read()

    try:
        parsed = CSVParser.parse(contents.decode("utf-8"))
    except (ValueError, UnicodeDecodeError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not parsed:
        raise HTTPException(status_code=400, detail="No valid transactions found in file")

    upload_dir = Path(QUEUE["upload_dir"])
    upload_dir.mkdir(parents=True, exist_ok=True)
    job_id = str(uuid.uuid4())
    file_path = upload_dir / f"{job_id}.csv"
    pd.DataFrame([{"Date": t.date, "Description": t.merchant, "Amount": t.amount} for t in parsed]).to_csv(file_path, index=False)

    total = len(parsed)
    r = redis_lib.from_url(REDIS_URL)
    r.hset(f"job:{job_id}", mapping={"total": total, "status": "processing", "done": 0, "failed": 0})
    r.expire(f"job:{job_id}", QUEUE["job_ttl"])
    r.close()

    process_csv.delay(job_id, str(file_path), total, None)

    return {"job_id": job_id, "total": total, "status": "queued"}


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
        "done": int(job.get(b"done", b"0")),
        "failed": int(job.get(b"failed", b"0")),
    }


@router.get("")
def get_transactions(skip: int = 0, limit: int = 5000, db: Session = Depends(get_db)):
    return db.query(Transaction).order_by(Transaction.date.desc()).offset(skip).limit(limit).all()


@router.post("")
async def add_transaction(body: TransactionCreate, db: Session = Depends(get_db)):
    if not body.merchant:
        raise HTTPException(status_code=400, detail="Merchant is required")
    if body.amount is None:
        raise HTTPException(status_code=400, detail="Amount is required")
    if body.amount == 0:
        raise HTTPException(status_code=400, detail="Amount cannot be zero")
    try:
        txn = Transaction(
            date=datetime.now().date(),
            merchant=body.merchant,
            category=body.category or None,
            amount=float(body.amount),
            card=body.card,
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)

        if not body.category:
            categorise_single.delay(txn.id, body.merchant, float(body.amount))

        return {"message": "Transaction added successfully", "id": txn.id, "status": "categorising"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error adding transaction: {str(e)}")


@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(txn)
    db.commit()
    return {"message": "Transaction deleted"}


@router.delete("")
def delete_all_transactions(db: Session = Depends(get_db)):
    db.query(Transaction).delete()
    db.commit()
    return {"message": "All transactions deleted"}
