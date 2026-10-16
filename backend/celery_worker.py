"""
Run with:  celery -A celery_worker.celery worker --loglevel=info

This module builds a Flask app + Celery app pair so tasks (in tasks.py) have
application context (DB access) available when the worker executes them.
"""
from app import create_app
from extensions import celery

flask_app = create_app()


class ContextTask(celery.Task):
    def __call__(self, *args, **kwargs):
        with flask_app.app_context():
            return self.run(*args, **kwargs)


celery.Task = ContextTask

# Import tasks so they get registered with celery
import tasks  # noqa: E402,F401
