import asyncio
import os
from datetime import date as date_type

import httpx
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine, get_db
from models import Transaction

REMOTE_LEDGER_URL = os.environ.get("REMOTE_LEDGER_URL", "https://api.samsllama.com").rstrip("/")
SYNC_INTERVAL_SECONDS = int(os.environ.get("SYNC_INTERVAL_SECONDS", "300"))

# Create tables on startup. For real migrations, use Alembic instead.
Base.metadata.create_all(bind=engine)

app = FastAPI()


class TransactionIn(BaseModel):
    amount: float
    merchant: str
    card: str  # last 4 digits only — never store a full card number

    @field_validator("amount", mode="before")
    @classmethod
    def coerce_amount(cls, value):
        # Accept "42.50", "$1,234.56", or a number; convert to float.
        if isinstance(value, str):
            value = value.strip().lstrip("$").replace(",", "")
            if not value:
                raise ValueError("amount must not be empty")
        try:
            return float(value)
        except (TypeError, ValueError):
            raise ValueError(f"amount must be a valid number, got {value!r}")


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    amount: float
    merchant: str
    card: str
    date: date_type
    description: str


@app.get("/transaction", response_model=list[TransactionOut])
def list_transactions(db: Session = Depends(get_db)):
    return db.query(Transaction).all()


@app.post("/transaction", response_model=TransactionOut, status_code=201)
def add_transaction(payload: TransactionIn, db: Session = Depends(get_db)):
    today = date_type.today()
    transaction = Transaction(
        **payload.model_dump(),
        date=today,
        description=f"{payload.merchant} on {today.isoformat()}",
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@app.get("/transaction/{transaction_id}", response_model=TransactionOut)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.get(Transaction, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@app.delete("/transaction/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.get(Transaction, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(transaction)
    db.commit()


@app.delete("/transaction", status_code=204)
def delete_all_transactions(db: Session = Depends(get_db)):
    db.query(Transaction).delete()
    db.commit()


def sync_from_remote():
    response = httpx.get(f"{REMOTE_LEDGER_URL}/transaction", timeout=10.0)
    response.raise_for_status()
    remote_transactions = response.json()
    if not remote_transactions:
        return

    db = SessionLocal()
    try:
        for item in remote_transactions:
            db.add(Transaction(
                amount=item["amount"],
                merchant=item["merchant"],
                card=item["card"],
                date=date_type.fromisoformat(item["date"]),
                description=item["description"],
            ))
        db.commit()
    finally:
        db.close()

    # Clear the remote ledger now that its transactions are stored locally.
    httpx.delete(f"{REMOTE_LEDGER_URL}/transaction", timeout=10.0).raise_for_status()


async def sync_loop():
    while True:
        try:
            sync_from_remote()
        except Exception as e:
            print(f"remote sync failed: {e}")
        await asyncio.sleep(SYNC_INTERVAL_SECONDS)


@app.on_event("startup")
async def start_sync_loop():
    asyncio.create_task(sync_loop())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
