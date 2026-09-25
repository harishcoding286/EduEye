// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Google Calendar Service
// Idempotent sync, deterministic event IDs, anti-duplicate validation,
// and automatic cleanup of overlapping/stale calendar items.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto';
import type { ScheduledEvent } from '@/types/schedule';

export function toGCalDateTime(isoStr: string): string {
  if (isoStr.includes('+') || isoStr.endsWith('Z')) return isoStr;
  return `${isoStr}+05:30`;
}

/**
 * Generates an idempotent, deterministic event ID for Google Calendar v3.
 * Google Calendar allows lowercase characters [a-v0-9] with length 5-1024.
 * Hexadecimal (md5) produces 32 characters in [0-9a-f], which is 100% compliant.
 */
export function getDeterministicGCalId(event: ScheduledEvent): string {
  const dateStr = event.start.slice(0, 10);
  const startHHMM = event.start.slice(11, 16);
  const endHHMM = event.end.slice(11, 16);
  const rawKey = `slot_${dateStr}_${startHHMM}_${endHHMM}`;
  const hash = crypto.createHash('md5').update(rawKey).digest('hex');
  return `edueye${hash}`;
}

export async function upsertGCalEvent(accessToken: string, event: ScheduledEvent): Promise<boolean> {
  const gcalId = getDeterministicGCalId(event);
  const startDateTime = toGCalDateTime(event.start);
  const endDateTime = toGCalDateTime(event.end);

  const isCritical =
    event.title.toLowerCase().includes('critical') ||
    event.title.toLowerCase().includes('deep focus');
  const isFocusSprint = event.category === 'REMEDIATION_LOCK';
  const colorId = isCritical ? '11' : isFocusSprint ? '7' : '2';

  const payload = {
    summary: event.title,
    description: [
      event.topic ? `Topic: ${event.topic}` : null,
      event.diffReason ? `AI Schedule Note: ${event.diffReason}` : null,
      event.alertScore != null ? `Cognitive Alertness: ${event.alertScore}%` : null,
      'Managed by EduEye Adaptive Cognitive Scheduler (8h Sleep Protected)',
    ]
      .filter(Boolean)
      .join('\n'),
    start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
    end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' },
    colorId,
  };

  // 1. Try updating existing event at this deterministic ID
  const putRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${gcalId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (putRes.ok) {
    return true;
  }

  // 2. If it does not exist yet (404), insert with this deterministic ID
  if (putRes.status === 404) {
    const postRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: gcalId,
        ...payload,
      }),
    });
    return postRes.ok;
  }

  return false;
}

/**
 * Searches Google Calendar for any past duplicate/legacy EduEye events in this
 * week range and purges duplicates so the calendar remains clean and orderly.
 */
export async function cleanupDuplicateGCalEvents(
  accessToken: string,
  timeMinISO: string,
  timeMaxISO: string,
  validDeterministicIds: Set<string>
): Promise<number> {
  try {
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', toGCalDateTime(timeMinISO));
    url.searchParams.set('timeMax', toGCalDateTime(timeMaxISO));
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('q', 'EduEye');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return 0;

    const data = (await res.json()) as {
      items?: Array<{ id: string; summary?: string; start?: { dateTime?: string } }>;
    };
    const items = data.items || [];
    let cleaned = 0;
    const seenSlots = new Set<string>();

    for (const item of items) {
      const slot = item.start?.dateTime?.slice(0, 16) || item.id;
      // If this event is not one of our current deterministic IDs or is duplicate for the same hour:
      if (!validDeterministicIds.has(item.id) || seenSlots.has(slot)) {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${item.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        cleaned++;
      } else {
        seenSlots.add(slot);
      }
    }
    return cleaned;
  } catch (err) {
    console.warn('[cleanupDuplicateGCalEvents] Cleanup notice:', err);
    return 0;
  }
}
