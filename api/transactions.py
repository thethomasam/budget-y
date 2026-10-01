import difflib
import re
from datetime import date as date_type

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy.orm import Session

from categorizer import categorize_merchant
from csv_parsers import CsvParseError, parse_csv, parse_date
from database import SessionLocal, get_db
from ingest_queue import enqueue, get_job, set_progress
from location_trie import MerchantCleaner
from models import Category, Transaction

router = APIRouter(tags=["transactions"])
_cleaner = MerchantCleaner.default()


def _coerce_amount(value):
    # Accept "42.50", "$1,234.56", or a number; convert to float.
    if isinstance(value, str):
        value = value.strip().lstrip("$").replace(",", "")
        if not value:
            raise ValueError("amount must not be empty")
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"amount must be a valid number, got {value!r}")


def _resolve_category(name: str | None, db: Session) -> Category | None:
    if name is None:
        return None
    category = db.query(Category).filter(Category.name == name).first()
    if category is None:
        raise HTTPException(status_code=422, detail=f"Unknown category: {name!r}")
    return category


class TransactionIn(BaseModel):
    amount: float
    merchant: str
    card: str = ""  # last 4 digits only — never store a full card number
    date: date_type | None = None  # defaults to today
    category: str | None = None  # defaults to auto-categorization

    @field_validator("amount", mode="before")
    @classmethod
    def coerce_amount(cls, value):
        return _coerce_amount(value)


class TransactionUpdate(BaseModel):
    amount: float | None = None
    merchant: str | None = None
    card: str | None = None
    category: str | None = None

    @field_validator("amount", mode="before")
    @classmethod
    def coerce_amount(cls, value):
        return None if value is None else _coerce_amount(value)


class CategoryUpdate(BaseModel):
    category: str | None = None


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    amount: float
    merchant: str
    card: str
    date: date_type
    description: str
    category: str | None = None

    @field_validator("category", mode="before")
    @classmethod
    def category_name(cls, value):
        return value.name if isinstance(value, Category) else value


@router.get("/transaction", response_model=list[TransactionOut])
def list_transactions(db: Session = Depends(get_db)):
    return db.query(Transaction).all()


@router.post("/transaction", response_model=TransactionOut, status_code=201)
def add_transaction(payload: TransactionIn, db: Session = Depends(get_db)):
    merchant = re.sub(r"\s+", " ", payload.merchant).strip()
    if not merchant:
        raise HTTPException(status_code=422, detail="merchant must not be empty")
    row_date = payload.date or date_type.today()
    category = (
        _resolve_category(payload.category, db)
        if payload.category
        else categorize_merchant(merchant, db)
    )
    transaction = Transaction(
        amount=payload.amount,
        merchant=merchant,
        card=payload.card,
        date=row_date,
        description=f"{merchant} on {row_date.isoformat()}",
        category=category,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


class DuplicateTransaction(BaseModel):
    amount: float
    merchant: str
    date: date_type


class IngestResult(BaseModel):
    created: list[TransactionOut]
    duplicates: list[DuplicateTransaction]


class IngestJobOut(BaseModel):
    job_id: str
    status: str


def _signature(amount: float, merchant: str, row_date: date_type) -> tuple:
    # Round amount to the cent -- float equality on parsed CSV values is
    # otherwise brittle, and bank exports don't carry sub-cent precision.
    return (round(amount, 2), merchant.lower(), row_date)


def _ingest_rows(job_id: str, rows: list[dict]) -> IngestResult:
    db = SessionLocal()
    try:
        existing = {
            _signature(amount, merchant, row_date)
            for amount, merchant, row_date in db.query(
                Transaction.amount, Transaction.merchant, Transaction.date
            ).all()
        }

        created = []
        duplicates = []
        for i, row in enumerate(rows):
            try:
                amount = _coerce_amount(row["amount"])
                merchant = re.sub(r"\s+", " ", row["merchant"]).strip()
                row_date = parse_date(row["date"]) if row.get("date") else date_type.today()

                # Duplicate of a transaction already in the DB, or of an
                # earlier row in this same CSV (e.g. the file was uploaded
                # twice).
                signature = _signature(amount, merchant, row_date)
                if signature in existing:
                    duplicates.append(
                        DuplicateTransaction(amount=amount, merchant=merchant, date=row_date)
                    )
                    continue
                existing.add(signature)

                transaction = Transaction(
                    amount=amount,
                    merchant=merchant,
                    card=row.get("card", ""),
                    date=row_date,
                    description=row.get("description") or f"{merchant} on {row_date.isoformat()}",
                    category=categorize_merchant(merchant, db),
                )
                db.add(transaction)
                created.append(transaction)
            finally:
                set_progress(job_id, i + 1)

        db.commit()
        for transaction in created:
            db.refresh(transaction)
        return IngestResult(created=created, duplicates=duplicates)
    finally:
        db.close()


@router.post("/transaction/csv", response_model=IngestJobOut, status_code=202)
def ingest_transactions_csv(file: UploadFile = File(...)):
    content = file.file.read().decode("utf-8-sig")
    try:
        rows = parse_csv(content)
        for row in rows:
            _coerce_amount(row["amount"])
            if row.get("date"):
                parse_date(row["date"])
    except (CsvParseError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    job_id = enqueue(lambda job_id: _ingest_rows(job_id, rows), total=len(rows))
    return IngestJobOut(job_id=job_id, status="pending")


@router.get("/transaction/csv/{job_id}", response_model=None)
def get_ingest_job(job_id: str):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/transaction/{transaction_id}", response_model=TransactionOut)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.get(Transaction, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


def _clean_for_match(merchant: str) -> str:
    """Business name with the trailing location AND any numeric tokens (store
    numbers, terminal IDs) stripped, so "COLES 0471 PROSPECT" and
    "COLES 4948 GREENACRES" both normalize to "coles" instead of comparing
    as different store numbers."""
    business_name, _ = _cleaner.clean(merchant)
    tokens = [t for t in business_name.split() if not t.isdigit()]
    return " ".join(tokens).lower()


@router.get("/transaction/{transaction_id}/similar", response_model=list[TransactionOut])
def find_similar_transactions(transaction_id: int, db: Session = Depends(get_db)):
    """Other transactions whose merchant name fuzzy-matches this one"""
    transaction = db.get(Transaction, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    target_key = _clean_for_match(transaction.merchant)

    others = db.query(Transaction).filter(Transaction.id != transaction_id).all()
    by_cleaned_name: dict[str, list[Transaction]] = {}
    for t in others:
        by_cleaned_name.setdefault(_clean_for_match(t.merchant), []).append(t)
        
    matching_names = difflib.get_close_matches(target_key, by_cleaned_name.keys(), n=15, cutoff=0.6)
    return [t for name in matching_names for t in by_cleaned_name[name]]


@router.patch("/transaction/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    transaction_id: int, payload: TransactionUpdate, db: Session = Depends(get_db)
):
    transaction = db.get(Transaction, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    updates = payload.model_dump(exclude_unset=True)
    if "category" in updates:
        transaction.category = _resolve_category(updates.pop("category"), db)
    for field, value in updates.items():
        setattr(transaction, field, value)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.patch("/transaction/{transaction_id}/category", response_model=TransactionOut)
def update_transaction_category(
    transaction_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)
):
    transaction = db.get(Transaction, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    transaction.category = _resolve_category(payload.category, db)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/transaction/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.get(Transaction, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(transaction)
    db.commit()


@router.delete("/transaction", status_code=204)
def delete_all_transactions(db: Session = Depends(get_db)):
    db.query(Transaction).delete()
    db.commit()
