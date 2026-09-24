"""
EduEye Canvas LMS & Google Classroom REST Ingestion Service
Listens for submission webhook events and translates them into actionable telemetry.
"""

from typing import Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class LMSWebhookPayload(BaseModel):
    source: str = Field(default="canvas", description="'canvas' or 'google_classroom'")
    student_id: str
    course_id: str
    course_name: str
    assignment_id: str
    assignment_title: str
    topic: str
    score: float
    max_score: float = 100.0
    due_date: str
    submission_timestamp: Optional[str] = None


class LMSProcessingResult(BaseModel):
    processed: bool
    student_id: str
    topic: str
    score_percentage: float
    actual_lag_hours: float
    expected_lag_hours: float
    is_prerequisite_deficit: bool
    remediation_required: bool
    message: str


class LMSService:
    def process_submission_webhook(self, payload: LMSWebhookPayload) -> LMSProcessingResult:
        score_pct = (payload.score / max(payload.max_score, 1)) * 100

        # Calculate lag
        try:
            due = datetime.fromisoformat(payload.due_date.replace("Z", "+00:00"))
            if payload.submission_timestamp:
                sub = datetime.fromisoformat(payload.submission_timestamp.replace("Z", "+00:00"))
            else:
                sub = datetime.now(timezone.utc)
            lag_hours = max(0.0, (sub - due).total_seconds() / 3600.0)
        except Exception:
            lag_hours = 48.0

        is_deficit = score_pct < 60.0
        remediation_needed = is_deficit or lag_hours > 24.0

        if is_deficit:
            msg = (
                f"LMS Signal ({payload.source.upper()}): Low concept mastery ({score_pct:.0f}%) in {payload.topic}. "
                f"Prerequisite deficit flagged. Autonomous focus lock triggered."
            )
        else:
            msg = f"LMS Signal ({payload.source.upper()}): Satisfactory submission ({score_pct:.0f}%) in {payload.topic}."

        return LMSProcessingResult(
            processed=True,
            student_id=payload.student_id,
            topic=payload.topic,
            score_percentage=round(score_pct, 1),
            actual_lag_hours=round(lag_hours, 1),
            expected_lag_hours=24.0,
            is_prerequisite_deficit=is_deficit,
            remediation_required=remediation_needed,
            message=msg
        )


lms_service = LMSService()
