import asyncio
import os
from dotenv import load_dotenv
from app.services.qwen_categoriser import categorise_transaction, normalize_transaction, find_similar_transaction
from app.database import SessionLocal


async def test_categorizer():
    """Test the categorizer with sample transactions."""
    # Load environment variables
    load_dotenv()

    db = SessionLocal()

    test_transactions = [
        {"merchant": "Woolworths Pty Ltd", "amount": 45.50},
        {"merchant": "Shell Petrol - AU", "amount": 80.00},
        {"merchant": "Netflix Inc.", "amount": 15.99},
        {"merchant": "Uber * Ride", "amount": 22.50},
    ]

    try:
        for txn in test_transactions:
            print(f"\n{'='*60}")
            print(f"Testing: {txn['merchant']} - ${txn['amount']}")
            normalized = normalize_transaction(txn["merchant"])
            print(f"Normalized: {normalized}")

            # Check if exists in DB first
            db_category = find_similar_transaction(txn["merchant"], db)
            if db_category:
                print(f"Found in DB: {db_category}")
            else:
                print("Not found in DB - will use web search + LLM")
            print(f"{'='*60}")

            # Categorize (checks DB first, then uses LLM if needed)
            category = await categorise_transaction(
                txn["merchant"],
                txn["amount"],
                db
            )
            print(f"\nFinal Category: {category}")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(test_categorizer())
