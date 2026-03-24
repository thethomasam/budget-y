from celery import Celery

celery_app = Celery(
    "budgety",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
    include=["app.tasks.csv_upload"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
)