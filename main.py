from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import io
from datetime import datetime, date

from database import DATABASE_URL, engine, Base, get_db, Transaction
from categorizer import TransactionCategorizer

app = FastAPI(title="Budgety API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize TF-IDF categorizer
categorizer = TransactionCategorizer()

# Pydantic models
class TransactionText(BaseModel):
    text: str

class CategorizeRequest(BaseModel):
    transactions: List[str]

@app.get("/")
def read_root():
    return {"message": "Welcome to Budgety API"}


@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...),db: Session = Depends(get_db)):
    """
    Upload a CSV file with transactions. Automatically categorizes transactions using TF-IDF.
    Expected columns: Date, Description, Amount
    Optional columns: category
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

        # Validate required columns
        required_columns = ['Date', 'Description', 'Amount' ]
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {', '.join(required_columns)}"
            )

        db = next(get_db())
        transactions_added = 0
        transactions_categorized = 0

        try:
            # Auto-categorize all descriptions at once (more efficient)
            descriptions = df['Description'].tolist()
            if categorizer.is_loaded():
                categories_results = categorizer.categorize_batch(descriptions)
            else:
                categories_results = [{"category": None, "confidence": 0.0}] * len(descriptions)

            for idx, row in df.iterrows():
                # Use existing category if provided, otherwise use TF-IDF prediction
                category = row.get('category', None)
                if pd.isna(category) or category == '':
                    category = categories_results[idx]['category']
                    if category != 'Other':  # Only count as categorized if not "Other"
                        transactions_categorized += 1

                transaction = Transaction(
                    date = datetime.strptime(str(row['Date']), '%d/%m/%Y').date(),
                    merchant = row.get('Description'),
                    category = category,
                    amount = float(row['Amount']),
                    card = "American Express"
                )
                db.add(transaction)
                transactions_added += 1

            db.commit()
        finally:
            db.close()

        return {
            "message": "CSV uploaded successfully",
            "transactions_added": transactions_added,
            "transactions_auto_categorized": transactions_categorized
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")




@app.get("/transactions")
def get_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all transactions"""
    transactions = db.query(Transaction).offset(skip).limit(limit).all()
    return transactions


@app.get("/analytics/category-breakdown")
def get_category_breakdown(db: Session = Depends(get_db)):
    """Get spending breakdown by category"""
    from sqlalchemy import func

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


@app.get("/analytics/monthly-expenses")
def get_monthly_expenses(db: Session = Depends(get_db)):
    """Get monthly expense totals for the last 12 months"""
    from sqlalchemy import func, extract
    from datetime import datetime, timedelta

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


@app.post("/transactions")
def add_transactions(transaction: dict, db: Session = Depends(get_db)):
    """Add a single transaction to the database with automatic categorization"""
    try:
        # Get category from request or auto-categorize using TF-IDF
        category = transaction.get('category')

        if not category and categorizer.is_loaded():
            # Auto-categorize based on merchant name
            merchant = transaction.get('merchant', '')
            if merchant:
                result = categorizer.categorize(merchant)
                category = result['category']

        # Create new transaction
        new_transaction = Transaction(
            date=datetime.now().date(),
            merchant=transaction.get('merchant'),
            category=category,
            amount=float(transaction['amount']),
            card=transaction.get('card')
        )

        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction)

        return {
            "message": "Transaction added successfully",
            "id": new_transaction.id,
            "category": category,
            "transaction": transaction
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error adding transaction: {str(e)}")

@app.delete("/transactions")
def delete_all_transactions(db: Session = Depends(get_db)):
    """Delete all transactions"""
    db.query(Transaction).delete()
    db.commit()
    return {"message": "All transactions deleted"}


@app.patch("/transactions/categorize")
def categorize_uncategorized_transactions(db: Session = Depends(get_db)):
    """
    Update all transactions with null/empty categories using auto-categorization.
    Returns count of transactions categorized.
    """
    try:
        # Query transactions with null or empty categories
        uncategorized = db.query(Transaction).filter(
            (Transaction.category == None) | (Transaction.category == "")
        ).all()

        if not uncategorized:
            return {
                "message": "No uncategorized transactions found",
                "transactions_categorized": 0
            }

        if not categorizer.is_loaded():
            raise HTTPException(
                status_code=503,
                detail="Categorization model not available"
            )

        # Batch categorize all merchants
        merchants = [t.merchant or "" for t in uncategorized]
        categories_results = categorizer.categorize_batch(merchants)

        # Update transactions
        transactions_updated = 0
        for transaction, result in zip(uncategorized, categories_results):
            transaction.category = result['category']
            transactions_updated += 1

        db.commit()

        return {
            "message": "Transactions categorized successfully",
            "transactions_categorized": transactions_updated,
            "categories_applied": list(set([r['category'] for r in categories_results]))
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error categorizing transactions: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
