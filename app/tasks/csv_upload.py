import asyncio
import concurrent.futures
from datetime import datetime
from pathlib import Path
from typing import Optional
from sqlalchemy import update

import pandas as pd
import redis as redis_lib

from app.celery_app import celery_app
from app.config import config, REDIS_URL
from app.database import SessionLocal
from app.models import Transaction
from app.services.qwen_categoriser import find_similar_transaction, categorise_transaction, batch_categorise_with_llm

QUEUE = config["processing"]


def get_redis():
    return redis_lib.from_url(REDIS_URL)


def _update_job(r, job_id: str, **kwargs):
    r.hset(f"job:{job_id}", mapping={k: str(v) for k, v in kwargs.items()})
    r.expire(f"job:{job_id}", QUEUE["job_ttl"])


def _save_category(db, transaction_id: int, category: str):
    db.execute(
        update(Transaction)
        .where(Transaction.id == transaction_id)
        .values(category=category)
    )
    db.commit()


@celery_app.task
def categorise_single(transaction_id: int, merchant: str, amount: float, job_id: Optional[str] = None):
    """Categorise a single transaction (used for manual adds). If job_id provided, updates Redis progress."""
    r = get_redis() if job_id else None
    db = SessionLocal()
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            category = find_similar_transaction(merchant, db) or pool.submit(
                asyncio.run, categorise_transaction(merchant, amount, db)
            ).result()
        _save_category(db, transaction_id, category)
        if r:
            r.hincrby(f"job:{job_id}", "done", 1)
    except Exception:
        db.rollback()
        if r:
            r.hincrby(f"job:{job_id}", "failed", 1)
        raise
    finally:
        if r:
            job = r.hgetall(f"job:{job_id}")
            total = int(job.get(b"total", b"0"))
            done = int(job.get(b"done", b"0"))
            failed = int(job.get(b"failed", b"0"))
            if total > 0 and (done + failed) >= total:
                _update_job(r, job_id, status="complete")
            r.close()
        db.close()


@celery_app.task
def process_csv(job_id: str, file_path: str, total: int, user_id: int):
    """Save all rows, fuzzy-match known merchants, then batch-LLM the rest."""
    r = get_redis()
    db = SessionLocal()
    try:
        # Phase 1: persist all rows as "Other"
        pending = []
        for chunk in pd.read_csv(file_path, chunksize=QUEUE["chunk_size"]):
            for row in chunk.itertuples():
                merchant = str(row.Description)
                amount = abs(float(row.Amount))
                txn = Transaction(
                    date=datetime.strptime(str(row.Date), "%d/%m/%Y").date(),
                    merchant=merchant,
                    category="Other",
                    amount=amount,
                    card=str(getattr(row, "Card", "")),
                    user_id=user_id,
                )
                db.add(txn)
                db.flush()
                pending.append((txn.id, merchant, amount))
            db.commit()

        # Phase 2: fuzzy-match against existing categorised transactions
        to_llm = []
        for txn_id, merchant, amount in pending:
            category = find_similar_transaction(merchant, db)
            if category:
                _save_category(db, txn_id, category)
                r.hincrby(f"job:{job_id}", "done", 1)
            else:
                to_llm.append({"idx": txn_id, "merchant": merchant, "amount": amount})

        # Phase 3: batch LLM for unmatched transactions
        batch_size = QUEUE["llm_batch_size"]
        for i in range(0, len(to_llm), batch_size):
            batch = to_llm[i:i + batch_size]
            results = asyncio.run(batch_categorise_with_llm(batch))
            for item in batch:
                category = results.get(str(item["idx"]), "Other")
                _save_category(db, item["idx"], category)
                r.hincrby(f"job:{job_id}", "done", 1)

        _update_job(r, job_id, status="complete")
    except Exception as e:
        db.rollback()
        _update_job(r, job_id, status="failed", error=str(e))
        raise
    finally:
        db.close()
        r.close()
        Path(file_path).unlink(missing_ok=True)
