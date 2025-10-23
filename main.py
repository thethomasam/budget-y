from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import io
from datetime import datetime, date

from database import DATABASE_URL, engine, Base, get_db, Transaction
app = FastAPI(title="Budgety API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Budgety API"}


@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...),db: Session = Depends(get_db)):
    """
    Upload a CSV file with transactions.
    Expected columns: date, category, amount, card, merchant 
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

        try:
            for _, row in df.iterrows():
                transaction = Transaction(
                    date = datetime.strptime(str(row['Date']), '%d/%m/%Y').date(),
                    merchant = row.get('Description'),
                    category = row.get('category', None),
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
            "transactions_added": transactions_added
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")




@app.get("/transactions")
def get_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all transactions"""
    transactions = db.query(Transaction).offset(skip).limit(limit).all()
    return transactions


@app.post("/transactions")
def add_transactions(transaction: dict, db: Session = Depends(get_db)):
    """Add a single transaction to the database"""
    try:
      
        # Create new transaction
        new_transaction = Transaction(
            date=datetime.now().date(),
            merchant=transaction.get('merchant'),
            category=transaction.get('category'),
            amount=float(transaction['amount']),
            card=transaction.get('card')
        )

        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction)

        return {
            "message": "Transaction added successfully",
            "id": new_transaction.id,
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
