// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Google Calendar Service
// Checks Google Calendar for existing events at the same hour, omits duplicates,
// and pushes all other scheduled events cleanly.
// ─────────────────────────────────────────────────────────────────────────────

import type { ScheduledEvent } from '@/types/schedule';

export function toGCalDateTime(isoStr: string): string {
  if (isoStr.includes('+') || isoStr.includes('Z')) return isoStr;
  return `${isoStr}+05:30`;
}

interface ExistingGCalEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

/**
 * Fetches all events currently on the student's Google Calendar for the given date range.
 */
export async function fetchExistingGCalEvents(
  accessToken: string,
  timeMinISO: string,
  timeMaxISO: string
): Promise<ExistingGCalEvent[]> {
  try {
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', toGCalDateTime(timeMinISO));
    url.searchParams.set('timeMax', toGCalDateTime(timeMaxISO));
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('maxResults', '250');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('[fetchExistingGCalEvents] Failed to fetch:', res.status, await res.text());
      return [];
    }

    const data = (await res.json()) as { items?: ExistingGCalEvent[] };
    return data.items || [];
  } catch (err) {
    console.error('[fetchExistingGCalEvents] Error:', err);
    return [];
  }
}

/**
 * Pushes a single event to Google Calendar via standard POST.
 */
export async function pushSingleEventToGCal(
  accessToken: string,
  event: ScheduledEvent
): Promise<boolean> {
  const startDateTime = toGCalDateTime(event.start);
  const endDateTime = toGCalDateTime(event.end);

  const isCritical =
    event.title.toLowerCase().includes('critical') ||
    event.title.toLowerCase().includes('deep focus');
  const isFocusSprint = event.category === 'REMEDIATION_LOCK';
  const colorId = isCritical ? '11' : isFocusSprint ? '7' : '2';

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

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[pushSingleEventToGCal] Failed for "${event.title}":`, res.status, errorText);
  }

  return res.ok;
}

/**
 * Syncs the schedule to Google Calendar:
 * - Omits duplicate events that are already made on the same hour in Google Calendar.
 * - Creates all other events with no issues.
 */
export async function syncScheduleToGCal(
  accessToken: string,
  events: ScheduledEvent[]
): Promise<{ synced: number; omitted: number; total: number }> {
  // Filter for focus sprints, revisions, and rescheduled events
  const eventsToSync = events.filter(
    (e) => e.category === 'REMEDIATION_LOCK' || e.isRescheduled
  );
  const targets = eventsToSync.length > 0 ? eventsToSync : events;

  if (targets.length === 0) {
    return { synced: 0, omitted: 0, total: 0 };
  }

  // Deduplicate incoming list so no two events in the batch share the exact same start hour
  const uniqueTargets: ScheduledEvent[] = [];
  const seenBatchHours = new Set<string>();

  for (const ev of targets) {
    const hourKey = `${ev.start.slice(0, 13)}`; // e.g. "2026-09-25T17"
    if (!seenBatchHours.has(hourKey)) {
      seenBatchHours.add(hourKey);
      uniqueTargets.push(ev);
    }
  }

  // Determine time window
  const sortedDates = [...uniqueTargets].sort((a, b) => a.start.localeCompare(b.start));
  const timeMin = sortedDates[0].start.slice(0, 10) + 'T00:00:00';
  const timeMax = sortedDates[sortedDates.length - 1].end.slice(0, 10) + 'T23:59:59';

  // Fetch all existing events from the student's Google Calendar in this window
  const existingGCalEvents = await fetchExistingGCalEvents(accessToken, timeMin, timeMax);

  // Index existing events by their day-and-hour key (e.g. "2026-09-25T17")
  const existingHourSet = new Set<string>();
  for (const item of existingGCalEvents) {
    const dt = item.start?.dateTime;
    if (dt && dt.length >= 13) {
      existingHourSet.add(dt.slice(0, 13));
    }
  }

  let syncedCount = 0;
  let omittedCount = 0;

  for (const ev of uniqueTargets) {
    const targetHourKey = ev.start.slice(0, 13);

    // If an event is already made on the same hour in Google Calendar, OMIT it!
    if (existingHourSet.has(targetHourKey)) {
      omittedCount++;
      continue;
    }

    // Otherwise, push this event to Google Calendar
    try {
      const ok = await pushSingleEventToGCal(accessToken, ev);
      if (ok) {
        syncedCount++;
        existingHourSet.add(targetHourKey); // Mark as filled so subsequent items won't collide
      }
    } catch (err) {
      console.error(`Failed to push event "${ev.title}":`, err);
    }
  }

  return {
    synced: syncedCount,
    omitted: omittedCount,
    total: uniqueTargets.length,
  };
}
