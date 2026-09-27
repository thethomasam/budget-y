import re
from datetime import date as date_type

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy.orm import Session

from categorizer import categorize_merchant
from csv_parsers import CsvParseError, parse_csv, parse_date
from database import get_db
from models import Category, Transaction

router = APIRouter(tags=["transactions"])


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
    card: str  # last 4 digits only — never store a full card number

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
    today = date_type.today()
    transaction = Transaction(
        **payload.model_dump(),
        date=today,
        description=f"{payload.merchant} on {today.isoformat()}",
        category=categorize_merchant(payload.merchant, db),
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.post("/transaction/csv", response_model=list[TransactionOut], status_code=201)
def ingest_transactions_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Plain `def`, not `async def`: categorize_merchant makes blocking network calls
    # (web search + Ollama) per row, which would otherwise block the whole event
    # loop -- FastAPI runs sync `def` routes in a thread pool instead.
    content = file.file.read().decode("utf-8-sig")
    try:
        rows = parse_csv(content)
    except CsvParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    created = []
    for row in rows:
        try:
            amount = _coerce_amount(row["amount"])
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        merchant = re.sub(r"\s+", " ", row["merchant"]).strip()
        try:
            row_date = parse_date(row["date"]) if row.get("date") else date_type.today()
        except CsvParseError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
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

    db.commit()
    for transaction in created:
        db.refresh(transaction)
    return created


@router.get("/transaction/{transaction_id}", response_model=TransactionOut)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.get(Transaction, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


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
