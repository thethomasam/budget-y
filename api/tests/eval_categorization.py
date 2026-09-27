"""Accuracy evaluation for the merchant auto-categorizer (categorizer.categorize_merchant).

Runs the real production parsing (csv_parsers.parse_csv) and categorization
(categorizer.categorize_merchant) code against an isolated in-memory SQLite database,
seeded with hand-labeled ground truth for every distinct merchant in anz_labels.csv.
Safe to re-run anytime -- never touches the real database.

Usage:
    cd api
    OLLAMA_URL=http://localhost:11434 .venv/bin/python tests/eval_categorization.py

OLLAMA_URL must point somewhere reachable from wherever you run this (the .env
default, http://ollama:11434, only resolves inside the docker-compose network).
"""

import csv
import re
import sys
from collections import Counter
from datetime import date as date_type
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from categorizer import categorize_merchant
from csv_parsers import parse_csv, parse_date
from database import Base
from models import Category, Transaction
from transactions import _coerce_amount

DATA_DIR = Path(__file__).resolve().parent.parent.parent
CSV_FILES = ["ANZ-5.csv", "ANZ-6.csv", "ANZ-8.csv"]
LABELS_PATH = Path(__file__).resolve().parent / "anz_labels.csv"
CATEGORIES = ["dining", "fees", "grocery", "health", "income", "shopping", "transport"]


def load_labels() -> dict[str, str]:
    with open(LABELS_PATH, newline="") as f:
        return {row["merchant"]: row["category"] for row in csv.DictReader(f)}


def load_rows() -> list[dict]:
    rows = []
    for filename in CSV_FILES:
        content = (DATA_DIR / filename).read_text(encoding="utf-8-sig")
        for row in parse_csv(content):
            row["merchant"] = re.sub(r"\s+", " ", row["merchant"]).strip()
            rows.append(row)
    return rows


def main():
    labels = load_labels()
    rows = load_rows()

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()
    for name in CATEGORIES:
        db.add(Category(name=name))
    db.commit()

    results = []  # (merchant, expected, predicted)
    total = len(rows)
    for i, row in enumerate(rows, 1):
        merchant = row["merchant"]
        expected = labels.get(merchant)
        if expected is None:
            print(f"WARNING: no label for {merchant!r}, skipping")
            continue

        category = categorize_merchant(merchant, db)
        predicted = category.name if category else "none"
        mark = "OK  " if predicted == expected else "MISS"
        print(f"[{i}/{total}] {mark} {merchant[:50]:52} expected={expected:10} got={predicted}")

        try:
            amount = _coerce_amount(row["amount"])
        except ValueError:
            amount = 0.0
        row_date = parse_date(row["date"]) if row.get("date") else date_type.today()
        db.add(
            Transaction(
                amount=amount,
                merchant=merchant,
                card=row.get("card", ""),
                date=row_date,
                description=f"{merchant} on {row_date.isoformat()}",
                category=category,
            )
        )
        db.commit()
        results.append((merchant, expected, predicted))

    total = len(results)
    correct = sum(1 for _, e, p in results if e == p)
    wrong = [(m, e, p) for m, e, p in results if e != p]

    print(f"\n=== {correct}/{total} correct ({correct/total:.1%}) ===\n")

    print("Per-category breakdown (expected -> got counts):")
    for expected in sorted({e for _, e, _ in results}):
        subset = [p for _, e, p in results if e == expected]
        acc = subset.count(expected) / len(subset)
        print(f"  {expected:10} n={len(subset):3}  accuracy={acc:.0%}")

    if wrong:
        print(f"\n--- {len(wrong)} mismatches ---")
        for merchant, expected, predicted in wrong:
            print(f"  {merchant[:55]:57} expected={expected:10} got={predicted}")

    confusion = Counter((e, p) for _, e, p in wrong)
    if confusion:
        print("\n--- Most common confusions (expected -> got) ---")
        for (expected, predicted), count in confusion.most_common(10):
            print(f"  {expected} -> {predicted}: {count}")


if __name__ == "__main__":
    main()
