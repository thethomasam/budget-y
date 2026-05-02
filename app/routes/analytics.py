from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Transaction, User
from app.config import config
from app.services.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


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
        func.strftime('%Y-%m', Transaction.date).label('month'),
        func.sum(func.abs(Transaction.amount)).label('total')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.category.isnot(None),
        Transaction.category != ""
    ).group_by(Transaction.category, 'month').order_by('month').all()

    months_set = sorted(set(r.month for r in results))
    categories_set = sorted(set(r.category for r in results))
    lookup = {(r.category, r.month): float(r.total) for r in results}
    months_labels = [datetime.strptime(m, '%Y-%m').strftime('%b %Y') for m in months_set]
    categories_data = [
        {"name": cat, "monthly": [lookup.get((cat, m), 0) for m in months_set]}
        for cat in categories_set
    ]
    categories_data.sort(key=lambda c: sum(c["monthly"]), reverse=True)

    return {"months": months_labels, "categories": categories_data}


@router.get("/monthly-savings")
def get_monthly_savings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    monthly_budget = config["frontend"]["monthly_budget"]
    twelve_months_ago = datetime.now().date() - timedelta(days=365)

    results = db.query(
        func.strftime('%Y-%m', Transaction.date).label('month'),
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= twelve_months_ago,
        Transaction.amount > 0
    ).group_by('month').order_by('month').all()

    return {"monthly_savings": [
        {"month": datetime.strptime(r.month, '%Y-%m').strftime('%b'), "year": datetime.strptime(r.month, '%Y-%m').year, "amount": monthly_budget - float(r.total)}
        for r in results
    ]}


@router.get("/monthly-expenses")
def get_monthly_expenses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    twelve_months_ago = datetime.now().date() - timedelta(days=365)

    results = db.query(
        func.strftime('%Y-%m', Transaction.date).label('month'),
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= twelve_months_ago,
        Transaction.amount > 0
    ).group_by('month').order_by('month').all()

    return {"monthly_expenses": [
        {"month": datetime.strptime(r.month, '%Y-%m').strftime('%b'), "year": datetime.strptime(r.month, '%Y-%m').year, "amount": float(r.total)}
        for r in results
    ]}
