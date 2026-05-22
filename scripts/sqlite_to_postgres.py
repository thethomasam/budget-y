#!/usr/bin/env python3
"""
Migrate data from budgety.db (SQLite) to a PostgreSQL / Supabase database.

Usage:
    DATABASE_URL=postgresql://user:pass@host:5432/db python scripts/sqlite_to_postgres.py
    DATABASE_URL=postgresql://... python scripts/sqlite_to_postgres.py --sqlite path/to/budgety.db
    DATABASE_URL=postgresql://... python scripts/sqlite_to_postgres.py --dry-run
"""
import argparse
import os
import sqlite3
import sys
from datetime import date

import psycopg2
import psycopg2.extras


def parse_args():
    p = argparse.ArgumentParser(description="Migrate SQLite → PostgreSQL")
    p.add_argument("--sqlite", default="budgety.db", help="Path to budgety.db")
    p.add_argument("--dry-run", action="store_true", help="Read SQLite but don't write to Postgres")
    return p.parse_args()


def connect_sqlite(path):
    if not os.path.exists(path):
        print(f"ERROR: SQLite file not found: {path}", file=sys.stderr)
        sys.exit(1)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def connect_postgres():
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL environment variable is not set.", file=sys.stderr)
        sys.exit(1)
    return psycopg2.connect(url)


def migrate_users(sqlite_cur, pg_cur, dry_run):
    sqlite_cur.execute("SELECT id, username, hashed_password, api_key FROM users ORDER BY id")
    rows = sqlite_cur.fetchall()
    print(f"  users: {len(rows)} rows")

    if dry_run or not rows:
        return

    psycopg2.extras.execute_values(
        pg_cur,
        """
        INSERT INTO users (id, username, hashed_password, api_key)
        VALUES %s
        ON CONFLICT (id) DO UPDATE
            SET username        = EXCLUDED.username,
                hashed_password = EXCLUDED.hashed_password,
                api_key         = EXCLUDED.api_key
        """,
        [(r["id"], r["username"], r["hashed_password"], r["api_key"]) for r in rows],
    )
    # Keep the sequence in sync so new inserts don't collide
    pg_cur.execute("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))")


def migrate_transactions(sqlite_cur, pg_cur, dry_run):
    sqlite_cur.execute(
        "SELECT id, date, merchant, category, amount, card, user_id FROM transactions ORDER BY id"
    )
    rows = sqlite_cur.fetchall()
    print(f"  transactions: {len(rows)} rows")

    if dry_run or not rows:
        return

    def parse_date(val):
        if val is None:
            return None
        if isinstance(val, date):
            return val
        # SQLite stores dates as strings
        for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
            try:
                from datetime import datetime
                return datetime.strptime(str(val), fmt).date()
            except ValueError:
                continue
        raise ValueError(f"Unrecognised date format: {val!r}")

    psycopg2.extras.execute_values(
        pg_cur,
        """
        INSERT INTO transactions (id, date, merchant, category, amount, card, user_id)
        VALUES %s
        ON CONFLICT (id) DO UPDATE
            SET date      = EXCLUDED.date,
                merchant  = EXCLUDED.merchant,
                category  = EXCLUDED.category,
                amount    = EXCLUDED.amount,
                card      = EXCLUDED.card,
                user_id   = EXCLUDED.user_id
        """,
        [
            (
                r["id"],
                parse_date(r["date"]),
                r["merchant"],
                r["category"],
                r["amount"],
                r["card"],
                r["user_id"],
            )
            for r in rows
        ],
    )
    pg_cur.execute("SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions))")


def main():
    args = parse_args()

    print(f"Source:  {args.sqlite}")
    print(f"Target:  {os.environ.get('DATABASE_URL', '(not set)')}")
    if args.dry_run:
        print("Mode:    DRY RUN — nothing will be written\n")
    else:
        print("Mode:    LIVE\n")

    sqlite_conn = connect_sqlite(args.sqlite)
    sqlite_cur = sqlite_conn.cursor()

    if args.dry_run:
        print("Rows found in SQLite:")
        migrate_users(sqlite_cur, None, dry_run=True)
        migrate_transactions(sqlite_cur, None, dry_run=True)
        print("\nDry run complete — no changes made.")
        return

    pg_conn = connect_postgres()
    pg_cur = pg_conn.cursor()

    try:
        print("Migrating users …")
        migrate_users(sqlite_cur, pg_cur, dry_run=False)

        print("Migrating transactions …")
        migrate_transactions(sqlite_cur, pg_cur, dry_run=False)

        pg_conn.commit()
        print("\nDone. All data committed to PostgreSQL.")
    except Exception as e:
        pg_conn.rollback()
        print(f"\nERROR: {e}", file=sys.stderr)
        print("Transaction rolled back — no changes written.", file=sys.stderr)
        sys.exit(1)
    finally:
        sqlite_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    main()
