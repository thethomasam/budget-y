from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Transaction

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/category-breakdown")
def get_category_breakdown(db: Session = Depends(get_db)):
    """Get spending breakdown by category"""
    # Query to get sum of amounts grouped by category
    results = db.query(
        Transaction.category,
        func.sum(func.abs(Transaction.amount)).label('total')
    ).filter(
        Transaction.category.isnot(None),
        Transaction.category != ""
    ).group_by(Transaction.category).all()

    # Format results
    breakdown = [
        {
            "category": result.category,
            "amount": float(result.total),
            "percentage": 0  # Will calculate after getting total
        }
        for result in results
    ]

    # Calculate percentages
    total = sum(item['amount'] for item in breakdown)
    if total > 0:
        for item in breakdown:
            item['percentage'] = round((item['amount'] / total) * 100, 1)

    return {
        "categories": breakdown,
        "total": total
    }


@router.get("/monthly-category-spend")
def get_monthly_category_spend(db: Session = Depends(get_db)):
    """Get monthly spending broken down by category for all time"""
    results = db.query(
        Transaction.category,
        func.strftime('%Y-%m', Transaction.date).label('month'),
        func.sum(func.abs(Transaction.amount)).label('total')
    ).filter(
        Transaction.category.isnot(None),
        Transaction.category != ""
    ).group_by(Transaction.category, 'month').order_by('month').all()

    months_set = sorted(set(r.month for r in results))
    categories_set = sorted(set(r.category for r in results))

    lookup = {(r.category, r.month): float(r.total) for r in results}

    months_labels = [datetime.strptime(m, '%Y-%m').strftime('%b %Y') for m in months_set]

    categories_data = [
        {
            "name": cat,
            "monthly": [lookup.get((cat, m), 0) for m in months_set]
        }
        for cat in categories_set
    ]

    # Sort categories by total spend descending
    categories_data.sort(key=lambda c: sum(c["monthly"]), reverse=True)

    return {"months": months_labels, "categories": categories_data}


@router.get("/monthly-expenses")
def get_monthly_expenses(db: Session = Depends(get_db)):
    """Get monthly expense totals for the last 12 months"""
    # Get data for last 12 months
    twelve_months_ago = datetime.now().date() - timedelta(days=365)

    results = db.query(
        func.strftime('%Y-%m', Transaction.date).label('month'),
        func.sum(func.abs(Transaction.amount)).label('total')
    ).filter(
        Transaction.date >= twelve_months_ago
    ).group_by('month').order_by('month').all()

    # Format results with month names
    monthly_data = []
    for result in results:
        month_date = datetime.strptime(result.month, '%Y-%m')
        monthly_data.append({
            "month": month_date.strftime('%b'),
            "year": month_date.year,
            "amount": float(result.total)
        })

    return {"monthly_expenses": monthly_data}
