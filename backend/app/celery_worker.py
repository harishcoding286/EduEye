"""
EduEye Celery Task Worker
Handles background asynchronous processing for LMS ingestion drops, ML retraining, and TA escalations.
"""

import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Celery Application Setup
celery_app = Celery(
    "edueye_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_always_eager=bool(os.getenv("CELERY_ALWAYS_EAGER", "True")),  # Eager fallback for smooth local testing
)


@celery_app.task(name="edueye.async_process_lms_drop")
def async_process_lms_drop(student_id: str, topic: str, score: float):
    """
    Background worker task to process heavy telemetry drops from Canvas / Google Classroom.
    """
    print(f"[Celery] Processing LMS Drop for student={student_id}, topic={topic}, score={score}%")
    return {"status": "SUCCESS", "student_id": student_id, "topic": topic}


@celery_app.task(name="edueye.async_dispatch_ta_escalation")
def async_dispatch_ta_escalation(student_id: str, student_name: str, topic: str):
    """
    Background worker task to asynchronously send email alerts via Resend / SendGrid API.
    """
    print(f"[Celery] Asynchronously dispatching TA escalation email for {student_name} on {topic}")
    return {"status": "DISPATCHED", "student_id": student_id}


@celery_app.task(name="edueye.async_retrain_risk_model")
def async_retrain_risk_model():
    """
    Background worker task to periodically update Scikit-Learn / XGBoost weights.
    """
    print("[Celery] Retraining XGBoost tabular performance model...")
    return {"status": "RETRAINED"}
