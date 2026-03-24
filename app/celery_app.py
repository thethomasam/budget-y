from celery import Celery
from app.config import config

redis_url = config["redis"]["url"]

celery_app = Celery(
    "budgety",
    broker=redis_url,
    backend=redis_url,
    include=["app.tasks.csv_upload"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
)