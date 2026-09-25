// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Push Schedule Events to Google Calendar
// POST /api/gcal-sync/push
// Ingests the current active timetable events (including dynamic Gemini revisions)
// and pushes them directly to the student's primary Google Calendar.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { ScheduledEvent } from '@/types/schedule';

export const runtime = 'nodejs';

function toGCalDateTime(isoStr: string): string {
  if (isoStr.includes('+') || isoStr.endsWith('Z')) return isoStr;
  return `${isoStr}+05:30`;
}

async function pushEventToGCal(accessToken: string, event: ScheduledEvent): Promise<boolean> {
  const startDateTime = toGCalDateTime(event.start);
  const endDateTime = toGCalDateTime(event.end);

  const isFocusSprint = event.category === 'REMEDIATION_LOCK';
  const colorId = isFocusSprint ? '11' : event.isRescheduled ? '7' : '2';

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.title,
      description: [
        event.topic ? `Topic: ${event.topic}` : null,
        event.diffReason ? `AI Schedule Note: ${event.diffReason}` : null,
        event.alertScore != null ? `Cognitive Alertness: ${event.alertScore}%` : null,
        'Managed by EduEye Adaptive Cognitive Scheduler',
      ]
        .filter(Boolean)
        .join('\n'),
      start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
      end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' },
      colorId,
    }),
  });

  return res.ok;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('gcal_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Google Calendar authentication required.' },
      { status: 401 }
    );
  }

  let body: { events?: ScheduledEvent[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const events = body.events || [];
  if (events.length === 0) {
    return NextResponse.json({ error: 'No events provided to sync.' }, { status: 400 });
  }

  // Push focus sprints and rescheduled events to Google Calendar (avoid duplicating fixed college lectures)
  const eventsToSync = events.filter(
    (e) => e.category === 'REMEDIATION_LOCK' || e.isRescheduled
  );

  const targets = eventsToSync.length > 0 ? eventsToSync : events;

  let successCount = 0;
  for (const ev of targets) {
    try {
      const ok = await pushEventToGCal(accessToken, ev);
      if (ok) successCount++;
    } catch (err) {
      console.error(`Failed to push event "${ev.title}" to Google Calendar:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    synced: successCount,
    total: targets.length,
  });
}
