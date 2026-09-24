"""
EduEye Cognitive Calendar Rescheduling Service
Connects to Google Calendar API to insert focused study/review blocks during peak productivity windows.
"""

import os
from datetime import datetime, time, timedelta, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import httpx


class CalendarEventPayload(BaseModel):
    id: str
    title: str
    startTime: str  # ISO string
    endTime: str    # ISO string
    category: str   # 'CLASS' | 'PERSONAL' | 'REMEDIATION_LOCK'
    status: str     # 'SCHEDULED' | 'COMPLETED'
    topic: Optional[str] = None


class CognitiveScheduleRequest(BaseModel):
    student_id: str
    target_topic: str
    duration_minutes: int = 45
    existing_events: List[CalendarEventPayload]
    target_date: Optional[str] = None  # YYYY-MM-DD
    sync_to_google: bool = False


class CognitiveScheduleResponse(BaseModel):
    allocated_event: CalendarEventPayload
    optimal_window_description: str
    circadian_fit_score: float
    google_calendar_synced: bool
    google_calendar_event_id: Optional[str] = None


class CognitiveCalendarService:
    def __init__(self):
        self.google_calendar_token = os.getenv("GOOGLE_CALENDAR_ACCESS_TOKEN")
        self.google_calendar_id = os.getenv("GOOGLE_CALENDAR_ID", "primary")

    def find_optimal_focus_slot(self, req: CognitiveScheduleRequest) -> CognitiveScheduleResponse:
        """
        Cognitive Heuristic Engine:
        1. Identifies chronobiological peak windows:
           - Prime afternoon window: 14:00 - 16:30
           - Secondary morning window: 10:00 - 11:30
        2. Strictly preserves lunch (12:00 - 13:30) and avoids postprandial dip.
        3. Avoids collisions with existing CLASS and locked events.
        4. Inserts 45-minute focus sprint.
        """
        # Parse today's reference date
        if req.target_date:
            ref_date = datetime.fromisoformat(req.target_date).date()
        else:
            ref_date = datetime.now(timezone.utc).date()

        # Define Candidate Prime Windows in UTC order
        candidate_slots = [
            # 14:00 - 14:45 (Prime Afternoon Cognitive Peak)
            (
                datetime.combine(ref_date, time(14, 0), tzinfo=timezone.utc),
                datetime.combine(ref_date, time(14, 45), tzinfo=timezone.utc),
                "Peak Afternoon Focus Window (High Alertness)",
                0.96
            ),
            # 15:00 - 15:45 (Afternoon Focus Window)
            (
                datetime.combine(ref_date, time(15, 0), tzinfo=timezone.utc),
                datetime.combine(ref_date, time(15, 45), tzinfo=timezone.utc),
                "Afternoon Focus Window (Sustained Concentration)",
                0.90
            ),
            # 10:00 - 10:45 (Morning Peak Window)
            (
                datetime.combine(ref_date, time(10, 0), tzinfo=timezone.utc),
                datetime.combine(ref_date, time(10, 45), tzinfo=timezone.utc),
                "Morning Chronobiological Peak Window",
                0.94
            ),
            # 16:00 - 16:45 (Pre-Dinner Review Slot)
            (
                datetime.combine(ref_date, time(16, 0), tzinfo=timezone.utc),
                datetime.combine(ref_date, time(16, 45), tzinfo=timezone.utc),
                "Late Afternoon Reinforcement Slot",
                0.82
            ),
        ]

        # Parse existing busy intervals
        busy_intervals = []
        for evt in req.existing_events:
            try:
                st = datetime.fromisoformat(evt.startTime.replace("Z", "+00:00"))
                et = datetime.fromisoformat(evt.endTime.replace("Z", "+00:00"))
                busy_intervals.append((st, et))
            except Exception:
                continue

        # Find first non-colliding candidate slot
        chosen_start = None
        chosen_end = None
        chosen_desc = "Optimal Focus Slot"
        chosen_score = 0.85

        for cand_start, cand_end, desc, score in candidate_slots:
            has_collision = False
            for busy_start, busy_end in busy_intervals:
                # Overlap test: (StartA < EndB) and (EndA > StartB)
                if cand_start < busy_end and cand_end > busy_start:
                    has_collision = True
                    break

            if not has_collision:
                chosen_start = cand_start
                chosen_end = cand_end
                chosen_desc = desc
                chosen_score = score
                break

        # Fallback if all prime windows collide
        if not chosen_start:
            chosen_start = datetime.combine(ref_date, time(16, 30), tzinfo=timezone.utc)
            chosen_end = chosen_start + timedelta(minutes=req.duration_minutes)
            chosen_desc = "Adaptive Fallback Focus Slot"
            chosen_score = 0.75

        allocated_event = CalendarEventPayload(
            id=f"evt_rem_{int(datetime.now().timestamp())}",
            title=f"🎯 {req.target_topic} Cognitive Focus Lock",
            startTime=chosen_start.isoformat(),
            endTime=chosen_end.isoformat(),
            category="REMEDIATION_LOCK",
            status="SCHEDULED",
            topic=req.target_topic
        )

        # Google Calendar API Integration
        google_synced = False
        google_event_id = None

        if req.sync_to_google and self.google_calendar_token:
            google_event_id = self._sync_to_google_calendar(allocated_event)
            google_synced = bool(google_event_id)

        return CognitiveScheduleResponse(
            allocated_event=allocated_event,
            optimal_window_description=chosen_desc,
            circadian_fit_score=chosen_score,
            google_calendar_synced=google_synced,
            google_calendar_event_id=google_event_id
        )

    def _sync_to_google_calendar(self, event: CalendarEventPayload) -> Optional[str]:
        """
        Dispatches RFC3339 event to Google Calendar API v3 endpoint
        """
        url = f"https://www.googleapis.com/calendar/v3/calendars/{self.google_calendar_id}/events"
        headers = {
            "Authorization": f"Bearer {self.google_calendar_token}",
            "Content-Type": "application/json"
        }
        body = {
            "summary": event.title,
            "description": f"EduEye Autonomous Cognitive Remediation Sprint for topic: {event.topic}",
            "start": {"dateTime": event.startTime},
            "end": {"dateTime": event.endTime},
            "colorId": "5",  # Yellow / Amber
            "reminders": {"useDefault": True}
        }
        try:
            with httpx.Client(timeout=4.0) as client:
                res = client.post(url, json=body, headers=headers)
                if res.status_code in [200, 201]:
                    return res.json().get("id")
        except Exception as e:
            print(f"[CalendarService] Google Calendar API error: {e}")
        return None


calendar_service = CognitiveCalendarService()
