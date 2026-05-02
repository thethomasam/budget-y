"""
Integration test for the categoriser using a small slice of activity-8.csv.

Requires the Docker stack to be running (Ollama + DB).

Run from project root:
    python tests/test_categoriser_activity8.py

Results are saved to tests/categoriser_results_activity8.csv
"""
import sys
import asyncio
import csv
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import config
import app.services.qwen_categoriser as categoriser

# Patch LLM URL for running outside Docker (ollama hostname doesn't resolve locally)
categoriser.LLM_CONFIG["url"] = "http://localhost:11434/api/generate"

from app.services.qwen_categoriser import (
    find_similar_transaction,
    batch_categorise_with_llm,
    normalize_transaction,
)

SAMPLE_SIZE = 10
CSV_PATH = Path(__file__).parent.parent / "activity-8.csv"
RESULTS_PATH = Path(__file__).parent / "categoriser_results_activity8.csv"

DB_PATH = config["database"]["path"]
engine = create_engine(f"sqlite:///{DB_PATH}")
Session = sessionmaker(bind=engine)


async def categorise_with_tracking(merchant: str, amount: float, db) -> dict:
    """Run categorisation and record which method resolved the category."""
    start = time.perf_counter()
    normalized = normalize_transaction(merchant)

    # Path 1: DB fuzzy match
    category = find_similar_transaction(normalized, db)
    if category:
        return {
            "merchant": merchant,
            "normalized": normalized,
            "amount": amount,
            "category": category,
            "method": "db_match",
            "duration_s": round(time.perf_counter() - start, 3),
        }

    # Path 2: Web search + LLM
    result = await batch_categorise_with_llm([{"idx": 1, "merchant": normalized, "amount": amount}])
    category = result.get("1", "Other")
    method = "web+llm" if category != "Other" else "web+llm(other)"

    return {
        "merchant": merchant,
        "normalized": normalized,
        "amount": amount,
        "category": category,
        "method": method,
        "duration_s": round(time.perf_counter() - start, 3),
    }


async def main():
    df = pd.read_csv(CSV_PATH).head(SAMPLE_SIZE)
    print(f"Testing {len(df)} rows from {CSV_PATH.name}\n")

    db = Session()
    results = []

    try:
        for _, row in df.iterrows():
            merchant = str(row.get("Description", "")).strip()
            amount = float(row.get("Amount", 0))
            print(f"  -> {merchant} (${amount})")

            result = await categorise_with_tracking(merchant, amount, db)
            results.append(result)

            print(f"     category : {result['category']}")
            print(f"     method   : {result['method']}")
            print(f"     time     : {result['duration_s']}s\n")
    finally:
        db.close()

    # Save results
    with open(RESULTS_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["merchant", "normalized", "amount", "category", "method", "duration_s"])
        writer.writeheader()
        writer.writerows(results)

    print(f"Results saved to {RESULTS_PATH}")

    # Summary
    method_counts = {}
    for r in results:
        method_counts[r["method"]] = method_counts.get(r["method"], 0) + 1

    print("\nSummary:")
    for method, count in sorted(method_counts.items()):
        print(f"  {method}: {count}")
    avg_time = sum(r["duration_s"] for r in results) / len(results)
    print(f"  avg time: {avg_time:.2f}s")


if __name__ == "__main__":
    asyncio.run(main())
