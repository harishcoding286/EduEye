// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Push Schedule Events to Google Calendar
// POST /api/gcal-sync/push
// Idempotently syncs active schedule events to Google Calendar with zero duplicates.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { ScheduledEvent } from '@/types/schedule';
import {
  upsertGCalEvent,
  cleanupDuplicateGCalEvents,
  getDeterministicGCalId,
} from '@/lib/gcalService';

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

  // Focus sprints and rescheduled events (exclude static college lectures to prevent calendar clutter)
  const eventsToSync = events.filter(
    (e) => e.category === 'REMEDIATION_LOCK' || e.isRescheduled
  );
  const targets = eventsToSync.length > 0 ? eventsToSync : events;

  // Strict deduplication: ensure only 1 task per time slot in the batch
  const deduplicatedTargets: ScheduledEvent[] = [];
  const seenSlots = new Set<string>();

  for (const ev of targets) {
    const slotKey = `${ev.start.slice(0, 10)}_${ev.start.slice(11, 16)}_${ev.end.slice(11, 16)}`;
    if (!seenSlots.has(slotKey)) {
      seenSlots.add(slotKey);
      deduplicatedTargets.push(ev);
    }
  }

  const validIds = new Set<string>();
  let successCount = 0;

  for (const ev of deduplicatedTargets) {
    try {
      const ok = await upsertGCalEvent(accessToken, ev);
      if (ok) {
        successCount++;
        validIds.add(getDeterministicGCalId(ev));
      }
    } catch (err) {
      console.error(`[gcal-sync/push] Failed to upsert event "${ev.title}":`, err);
    }
  }

  // Cleanup any legacy duplicate tasks from past runs in this time window
  if (deduplicatedTargets.length > 0) {
    const timeMin = deduplicatedTargets[0].start;
    const timeMax = deduplicatedTargets[deduplicatedTargets.length - 1].end;
    cleanupDuplicateGCalEvents(accessToken, timeMin, timeMax, validIds).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    synced: successCount,
    total: deduplicatedTargets.length,
  });
}
