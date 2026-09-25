// ─────────────────────────────────────────────────────────────────────────────
// EduEye — ICS Calendar Export (RFC 5545)
// Generates a downloadable .ics file from the adaptive schedule.
// Used as the Google Calendar import fallback when OAuth is not configured.
// ─────────────────────────────────────────────────────────────────────────────

import type { ScheduledEvent } from '@/types/schedule';

function formatIcsDate(isoString: string): string {
  // "2026-09-25T09:30:00" → "20260925T093000"
  return isoString.replace(/[-:]/g, '').replace(/\.\d{3}/, '').slice(0, 15);
}

function escapeIcs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function generateICS(events: ScheduledEvent[], calendarName = 'EduEye Schedule'): string {
  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}@edueye`;
  const stamp = formatIcsDate(new Date().toISOString());

  const vevents = events
    .map((ev) => {
      const desc = ev.topic ? `Topic: ${ev.topic}${ev.alertScore != null ? ` | Alertness: ${ev.alertScore}%` : ''}` : '';
      return [
        'BEGIN:VEVENT',
        `UID:${uid()}`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${formatIcsDate(ev.start)}`,
        `DTEND:${formatIcsDate(ev.end)}`,
        `SUMMARY:${escapeIcs(ev.title)}`,
        desc ? `DESCRIPTION:${escapeIcs(desc)}` : '',
        `STATUS:CONFIRMED`,
        'END:VEVENT',
      ]
        .filter(Boolean)
        .join('\r\n');
    })
    .join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduEye//Adaptive Scheduler//EN',
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    vevents,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(events: ScheduledEvent[], filename = 'edueye-schedule.ics'): void {
  const ics = generateICS(events);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
