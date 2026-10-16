from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_caching import Cache
from celery import Celery

db = SQLAlchemy()
login_manager = LoginManager()
cache = Cache()


class SafeCache:
    """Thin wrapper around Flask-Caching that never lets a Redis outage
    crash a request. Caching is a performance optimization here, not a
    correctness requirement, so failures are logged and swallowed."""

    def get(self, key):
        try:
            return cache.get(key)
        except Exception as e:
            print(f"[cache] get('{key}') failed: {e}")
            return None

    def set(self, key, value, timeout=None):
        try:
            cache.set(key, value, timeout=timeout)
        except Exception as e:
            print(f"[cache] set('{key}') failed: {e}")

    def delete(self, key):
        try:
            cache.delete(key)
        except Exception as e:
            print(f"[cache] delete('{key}') failed: {e}")


safe_cache = SafeCache()


def safe_delay(task, *args, **kwargs):
    """Queue a Celery task without letting a broker outage crash the request.
    Background jobs (emails, reminders, report pre-computation) are
    best-effort here, not required for the request to succeed."""
    try:
        task.delay(*args, **kwargs)
    except Exception as e:
        print(f"[celery] queuing '{task.name}' failed: {e}")


def make_celery(app=None):
    celery_app = Celery(
        "tma",
        broker="redis://localhost:6379/1",
        backend="redis://localhost:6379/2",
        include=["tasks"],
    )
    if app is not None:
        celery_app.conf.update(
            broker_url=app.config["CELERY_BROKER_URL"],
            result_backend=app.config["CELERY_RESULT_BACKEND"],
        )
    return celery_app


celery = make_celery()
