#!/usr/bin/env python3
"""Remove transactions where merchant contains 'thank you' (case-insensitive)."""

import sqlite3
import sys

DB_PATH = "./budgety.db"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("SELECT id, merchant, amount, date FROM transactions WHERE LOWER(merchant) LIKE '%thank you%'")
rows = cur.fetchall()

if not rows:
    print("No 'thank you' transactions found.")
    conn.close()
    sys.exit(0)

print(f"Found {len(rows)} transaction(s) to delete:")
for row in rows:
    print(f"  id={row[0]}  date={row[3]}  merchant={row[1]}  amount={row[2]}")

confirm = input("\nDelete these? [y/N] ").strip().lower()
if confirm == "y":
    cur.execute("DELETE FROM transactions WHERE LOWER(merchant) LIKE '%thank you%'")
    conn.commit()
    print(f"Deleted {cur.rowcount} transaction(s).")
else:
    print("Aborted.")

conn.close()
