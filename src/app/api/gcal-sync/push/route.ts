// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Push Schedule Events to Google Calendar
// POST /api/gcal-sync/push
// Omits events already made on the same hour in Google Calendar,
// and pushes all other events cleanly.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { ScheduledEvent } from '@/types/schedule';
import { syncScheduleToGCal } from '@/lib/gcalService';

export const runtime = 'nodejs';

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

  const result = await syncScheduleToGCal(accessToken, events);

  return NextResponse.json({
    success: true,
    ...result,
  });
}
