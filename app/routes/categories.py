from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Transaction
from app.schemas import CategoryUpdate, BulkCategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.patch("/transactions/{transaction_id}")
def update_transaction_category(
    transaction_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update the category of a specific transaction"""
    try:
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()

        if not transaction:
            raise HTTPException(status_code=404, detail=f"Transaction with id {transaction_id} not found")

        old_category = transaction.category
        transaction.category = category_update.category
        db.commit()
        db.refresh(transaction)

        return {
            "message": "Transaction category updated successfully",
            "transaction_id": transaction_id,
            "old_category": old_category,
            "new_category": transaction.category
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error updating transaction: {str(e)}")


@router.patch("/transactions/bulk-update")
def bulk_update_categories(
    bulk_update: BulkCategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update the category for multiple transactions at once"""
    try:
        if not bulk_update.transaction_ids:
            raise HTTPException(status_code=400, detail="No transaction IDs provided")

        # Find all matching transactions
        transactions = db.query(Transaction).filter(
            Transaction.id.in_(bulk_update.transaction_ids)
        ).all()

        if not transactions:
            raise HTTPException(status_code=404, detail="No matching transactions found")

        # Update all transactions
        updated_count = 0
        for transaction in transactions:
            transaction.category = bulk_update.category
            updated_count += 1

        db.commit()

        return {
            "message": "Transactions updated successfully",
            "transactions_updated": updated_count,
            "new_category": bulk_update.category,
            "transaction_ids": bulk_update.transaction_ids
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error bulk updating transactions: {str(e)}")
