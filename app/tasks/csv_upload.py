import asyncio
from datetime import datetime
from pathlib import Path
from sqlalchemy import update

import pandas as pd
import redis as redis_lib

from app.celery_app import celery_app
from app.config import config
from app.database import SessionLocal
from app.models import Transaction
from app.services.qwen_categoriser import find_similar_transaction, batch_categorise_with_llm, categorise_transaction

PROC = config["processing"]
REDIS_URL = config["redis"]["url"]


def get_redis():
    return redis_lib.from_url(REDIS_URL)


def _update_job(r, job_id: str, **kwargs):
    r.hset(f"job:{job_id}", mapping={k: str(v) for k, v in kwargs.items()})
    r.expire(f"job:{job_id}", PROC["job_ttl"])


def _check_complete(r, job_id: str):
    job = r.hgetall(f"job:{job_id}")
    orchestrator_done = job.get(b"orchestrator_done", b"0") == b"1"
    llm_queued = int(job.get(b"llm_queued", b"0"))
    llm_done = int(job.get(b"llm_done", b"0"))
    failed = int(job.get(b"failed", b"0"))
    if orchestrator_done and (llm_done + failed) >= llm_queued:
        _update_job(r, job_id, status="complete")


@celery_app.task
def categorise_single(transaction_id: int, merchant: str, amount: float):
    """Categorise a single transaction and update it in DB."""
    db = SessionLocal()
    try:
        category = asyncio.run(categorise_transaction(merchant, amount, db))
        db.execute(
            update(Transaction)
            .where(Transaction.id == transaction_id)
            .values(category=category)
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task
def batch_categorise(job_id: str, rows: list):
    """Save transactions immediately as 'Other', then update category via LLM."""
    r = get_redis()
    db = SessionLocal()
    try:
        # Save all rows immediately so nothing is lost if LLM fails
        txn_ids = []
        for row in rows:
            txn = Transaction(
                date=datetime.strptime(row["date"], "%d/%m/%Y").date(),
                merchant=row["merchant"],
                category="Other",
                amount=row["amount"],
                card=row.get("card", ""),
            )
            db.add(txn)
            db.flush()
            txn_ids.append((row["idx"], txn.id))
        db.commit()

        # Now categorise and update
        categories = asyncio.run(batch_categorise_with_llm(rows))

        id_map = {idx: txn_id for idx, txn_id in txn_ids}
        for row in rows:
            category = categories.get(str(row["idx"]), "Other")
            if category != "Other":
                db.execute(
                    update(Transaction)
                    .where(Transaction.id == id_map[row["idx"]])
                    .values(category=category)
                )
        db.commit()

        r.hincrby(f"job:{job_id}", "llm_done", len(rows))
        _check_complete(r, job_id)

    except Exception as e:
        db.rollback()
        r.hincrby(f"job:{job_id}", "failed", len(rows))
        _check_complete(r, job_id)
        raise

    finally:
        db.close()
        r.close()


@celery_app.task
def process_csv(job_id: str, file_path: str, total: int):
    """Orchestrator: reads CSV in chunks, applies rules, queues LLM batch tasks."""
    r = get_redis()
    db = SessionLocal()
    pending_batch = []
    rule_count = 0
    llm_queued = 0
    idx = 0

    try:
        for chunk in pd.read_csv(file_path, chunksize=PROC["chunk_size"]):
            for row in chunk.itertuples():
                idx += 1
                merchant = str(row.Description)
                amount = float(row.Amount)
                date_str = str(row.Date)
                card = str(getattr(row, "Card", ""))

                category = find_similar_transaction(merchant, db)

                if category:
                    db.add(Transaction(
                        date=datetime.strptime(date_str, "%d/%m/%Y").date(),
                        merchant=merchant,
                        category=category,
                        amount=amount,
                        card=card,
                    ))
                    db.commit()
                    rule_count += 1
                    r.hset(f"job:{job_id}", "rule_categorised", rule_count)
                else:
                    pending_batch.append({
                        "idx": idx,
                        "date": date_str,
                        "merchant": merchant,
                        "amount": amount,
                        "card": card,
                    })

                if len(pending_batch) >= PROC["llm_batch_size"]:
                    batch_categorise.delay(job_id, pending_batch.copy())
                    llm_queued += len(pending_batch)
                    r.hset(f"job:{job_id}", "llm_queued", llm_queued)
                    pending_batch = []

        # Flush remaining
        if pending_batch:
            batch_categorise.delay(job_id, pending_batch)
            llm_queued += len(pending_batch)
            r.hset(f"job:{job_id}", "llm_queued", llm_queued)

        _update_job(r, job_id, total=total, orchestrator_done=1)
        _check_complete(r, job_id)

    except Exception as e:
        _update_job(r, job_id, status="failed", error=str(e))
        raise

    finally:
        db.close()
        r.close()
        Path(file_path).unlink(missing_ok=True)
