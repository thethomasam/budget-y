from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

from database import DATABASE_URL, engine, SessionLocal, Base, get_db, Transaction
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
async def upload_csv(file: UploadFile = File(...)):
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
        required_columns = ['date', 'category', 'amount', 'card', 'merchant' ]
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {', '.join(required_columns)}"
            )

        db = SessionLocal()
        transactions_added = 0

        for _, row in df.iterrows():
            transaction = Transaction(
                date = datetime.strptime(str(row['date']), '%Y-%m-%d').date(),
                description = row['description'],
                category = row.get('category', None),
                amount = float(row['amount']),
                merchant = row.get('merchant'),
                card = row .get('card')
            )
            db.add(transaction)
            transactions_added += 1

        db.commit()
        db.close()

        return {
            "message": "CSV uploaded successfully",
            "transactions_added": transactions_added
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")




@app.get("/transactions")
def get_transactions(skip: int = 0, limit: int = 100):
    """Get all transactions"""
    db = SessionLocal()
    transactions = db.query(Transaction).offset(skip).limit(limit).all()
    db.close()
    return transactions



@app.delete("/transactions")
def delete_all_transactions():
    """Delete all transactions"""
    db = SessionLocal()
    db.query(Transaction).delete()
    db.commit()
    db.close()
    return {"message": "All transactions deleted"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
