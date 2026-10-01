"""A single background worker that ingests CSV rows one job at a time.

Categorizing a row makes blocking network calls (web search + Ollama), so
uploading a large CSV inline on the request would tie up the connection for
a long time. Queuing jobs keeps ingestion sequential.
"""

import queue
import threading
import uuid

_jobs = {}
_queue = queue.Queue()


def _worker():
    while True:
        job_id, fn = _queue.get()
        _jobs[job_id] = {"status": "processing", "processed": 0, "total": _jobs[job_id].get("total", 0)}
        try:
            result = fn(job_id)
            _jobs[job_id] = {**_jobs[job_id], "status": "done", "result": result}
        except Exception as exc:
            _jobs[job_id] = {**_jobs[job_id], "status": "error", "error": str(exc)}
        finally:
            _queue.task_done()


threading.Thread(target=_worker, daemon=True).start()


def enqueue(fn, total: int = 0) -> str:
    job_id = uuid.uuid4().hex
    _jobs[job_id] = {"status": "pending", "processed": 0, "total": total}
    _queue.put((job_id, fn))
    return job_id


def set_progress(job_id: str, processed: int) -> None:
    job = _jobs.get(job_id)
    if job is not None:
        job["processed"] = processed


def get_job(job_id: str) -> dict | None:
    return _jobs.get(job_id)
