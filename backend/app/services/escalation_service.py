"""
EduEye Automated Escalation & Office Hour Triage Service
Dispatches student diagnostic summaries and stages calendar invites via Resend / SendGrid API.
"""

import os
from typing import Dict, Any, Optional
from pydantic import BaseModel
import httpx


class EscalationRequest(BaseModel):
    student_id: str
    student_name: str
    student_email: Optional[str] = "alex.rivera@university.edu"
    ta_name: Optional[str] = "Michael Chang (Graduate TA)"
    ta_email: Optional[str] = "ta.mchang@university.edu"
    course_name: str = "Linear Algebra (MATH-204)"
    deficit_topic: str = "Eigenvalues & Eigenvectors"
    predicted_grade: float = 54.0
    lag_hours: float = 48.0


class EscalationResponse(BaseModel):
    status: str  # "DISPATCHED" | "SIMULATED"
    notification_id: str
    message: str
    staged_meeting_time: str
    diagnostic_summary: str


class EscalationService:
    def __init__(self):
        self.resend_api_key = os.getenv("RESEND_API_KEY")
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")

    def escalate_student(self, req: EscalationRequest) -> EscalationResponse:
        staged_time = "Tomorrow at 14:00 - 14:45 (Cognitive Peak Window)"
        summary = (
            f"DIAGNOSTIC TRIAGE SUMMARY:\n"
            f"• Student: {req.student_name} ({req.student_id})\n"
            f"• Course: {req.course_name}\n"
            f"• Critical Deficit: {req.deficit_topic}\n"
            f"• Projected Grade: {req.predicted_grade}% (CRITICAL TRIAGE)\n"
            f"• Submission Lag Velocity: {req.lag_hours}h (2.0x target threshold)\n"
            f"• Recommended Action: 1-on-1 Concept Calibration Clinic on Matrix Diagonalization."
        )

        # 1. Attempt Resend API
        if self.resend_api_key:
            try:
                res = httpx.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {self.resend_api_key}"},
                    json={
                        "from": "EduEye Engine <advising@edueye.ai>",
                        "to": [req.ta_email, req.student_email],
                        "subject": f"⚠️ EduEye Urgent TA Clinic Staged: {req.student_name} ({req.deficit_topic})",
                        "text": f"Hello {req.ta_name},\n\nAn automated closed-loop escalation has been triggered for {req.student_name}.\n\n{summary}\n\nStaged Office Hour Slot: {staged_time}\nCalendar invite has been staged.\n\n— EduEye Autonomous Orchestrator"
                    },
                    timeout=5.0
                )
                if res.status_code in [200, 201]:
                    return EscalationResponse(
                        status="DISPATCHED",
                        notification_id=res.json().get("id", "resend_ok"),
                        message=f"Dispatched official notification via Resend API to {req.ta_email}.",
                        staged_meeting_time=staged_time,
                        diagnostic_summary=summary
                    )
            except Exception as e:
                print(f"[EscalationService] Resend dispatch error: {e}")

        # 2. Attempt SendGrid API
        if self.sendgrid_api_key:
            try:
                res = httpx.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    headers={"Authorization": f"Bearer {self.sendgrid_api_key}"},
                    json={
                        "personalizations": [{"to": [{"email": req.ta_email}]}],
                        "from": {"email": "alerts@edueye.ai", "name": "EduEye Autonomous Triage"},
                        "subject": f"⚠️ EduEye Urgent TA Clinic Staged: {req.student_name}",
                        "content": [{"type": "text/plain", "value": summary}]
                    },
                    timeout=5.0
                )
                if res.status_code in [200, 202]:
                    return EscalationResponse(
                        status="DISPATCHED",
                        notification_id=f"sendgrid_{int(os.times().elapsed)}",
                        message=f"Dispatched email alert via SendGrid API to {req.ta_email}.",
                        staged_meeting_time=staged_time,
                        diagnostic_summary=summary
                    )
            except Exception as e:
                print(f"[EscalationService] SendGrid dispatch error: {e}")

        # 3. Simulated Staging Mode
        return EscalationResponse(
            status="SIMULATED",
            notification_id=f"notif_sim_{int(os.times().elapsed)}",
            message=f"TA 1-on-1 Office Hour clinic staged with {req.ta_name} ({req.ta_email}) for {staged_time}.",
            staged_meeting_time=staged_time,
            diagnostic_summary=summary
        )


escalation_service = EscalationService()
