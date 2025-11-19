from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
import io
from datetime import datetime

from app.database import get_db
from app.models import Transaction
from categorizer import TransactionCategorizer

router = APIRouter(prefix="/transactions", tags=["transactions"])

# Initialize TF-IDF categorizer
categorizer = TransactionCategorizer()


@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
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
        required_columns = ['Date', 'Description', 'Amount']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {', '.join(required_columns)}"
            )

        transactions_added = 0
        transactions_categorized = 0

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
                date=datetime.strptime(str(row['Date']), '%d/%m/%Y').date(),
                merchant=row.get('Description'),
                category=category,
                amount=float(row['Amount']),
                card="American Express"
            )
            db.add(transaction)
            transactions_added += 1

        db.commit()

        return {
            "message": "CSV uploaded successfully",
            "transactions_added": transactions_added,
            "transactions_auto_categorized": transactions_categorized
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")


@router.get("")
def get_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all transactions"""
    transactions = db.query(Transaction).offset(skip).limit(limit).all()
    return transactions


@router.post("")
def add_transaction(transaction: dict, db: Session = Depends(get_db)):
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


@router.delete("")
def delete_all_transactions(db: Session = Depends(get_db)):
    """Delete all transactions"""
    db.query(Transaction).delete()
    db.commit()
    return {"message": "All transactions deleted"}


@router.patch("/categorize")
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
