from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Transaction, User
from app.config import config
from app.services.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

_month = func.to_char(Transaction.date, 'YYYY-MM')


def _parse_month(month_str: str) -> datetime:
    return datetime.strptime(month_str, '%Y-%m')


@router.get("/category-breakdown")
def get_category_breakdown(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(
        Transaction.category,
        func.sum(func.abs(Transaction.amount)).label('total')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.category.isnot(None),
        Transaction.category != ""
    ).group_by(Transaction.category).all()

    breakdown = [{"category": r.category, "amount": float(r.total), "percentage": 0} for r in results]
    total = sum(item['amount'] for item in breakdown)
    if total > 0:
        for item in breakdown:
            item['percentage'] = round((item['amount'] / total) * 100, 1)

    return {"categories": breakdown, "total": total}


@router.get("/monthly-category-spend")
def get_monthly_category_spend(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(
        Transaction.category,
        _month.label('month'),
        func.sum(func.abs(Transaction.amount)).label('total')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.category.isnot(None),
        Transaction.category != ""
    ).group_by(Transaction.category, _month).order_by(_month).all()

    months_set = sorted(set(r.month for r in results))
    categories_set = sorted(set(r.category for r in results))
    lookup = {(r.category, r.month): float(r.total) for r in results}
    months_labels = [_parse_month(m).strftime('%b %Y') for m in months_set]
    categories_data = [
        {"name": cat, "monthly": [lookup.get((cat, m), 0) for m in months_set]}
        for cat in categories_set
    ]
    categories_data.sort(key=lambda c: sum(c["monthly"]), reverse=True)

    return {"months": months_labels, "categories": categories_data}


def _query_monthly_totals(db: Session, user_id: int) -> list:
    twelve_months_ago = datetime.now().date() - timedelta(days=365)
    return db.query(
        _month.label('month'),
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == user_id,
        Transaction.date >= twelve_months_ago,
        Transaction.amount > 0
    ).group_by(_month).order_by(_month).all()


@router.get("/monthly-savings")
def get_monthly_savings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    monthly_budget = config["frontend"]["monthly_budget"]
    results = _query_monthly_totals(db, current_user.id)
    return {"monthly_savings": [
        {"month": _parse_month(r.month).strftime('%b'), "year": _parse_month(r.month).year, "amount": monthly_budget - float(r.total)}
        for r in results
    ]}


@router.get("/monthly-expenses")
def get_monthly_expenses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = _query_monthly_totals(db, current_user.id)
    return {"monthly_expenses": [
        {"month": _parse_month(r.month).strftime('%b'), "year": _parse_month(r.month).year, "amount": float(r.total)}
        for r in results
    ]}
