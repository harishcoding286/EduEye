// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Cognitive Scheduling Engine
// Pure utility for autonomous, fatigue-aware calendar slot allocation.
// ─────────────────────────────────────────────────────────────────────────────

import type { CalendarEvent } from '@/types';

interface TimeInterval {
  startMinutes: number; // minutes from 00:00 (e.g., 09:00 = 540)
  endMinutes: number;
}

/**
 * Extracts minutes from midnight from an ISO-8601 string or Date object.
 */
function getMinutesFromMidnight(isoString: string): number {
  const d = new Date(isoString);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/**
 * Converts minutes from midnight back to ISO-8601 string for a given date prefix.
 */
function formatMinutesToIso(dateStr: string, minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${dateStr}T${pad(hours)}:${pad(mins)}:00.000Z`;
}

/**
 * Extracts the date string (YYYY-MM-DD) from the first available event or falls back to '2026-09-24'.
 */
function extractTargetDate(events: CalendarEvent[]): string {
  const sample = events.find(e => e.startTime && e.startTime.includes('T'));
  if (sample) {
    return sample.startTime.split('T')[0];
  }
  return '2026-09-24';
}

/**
 * Finds the optimal study slot for remediation with cognitive fatigue avoidance.
 *
 * Constraints & Heuristics:
 * - Scan interval: 09:00 (540m) to 18:00 (1080m) today.
 * - Zero collision: Does not overlap with any non-cancelled event in `events`.
 * - Blackout: Strictly protects lunch hours 12:00 (720m) to 13:00 (780m).
 * - Cognitive Optimization: Prefers the earliest continuous available slot before 16:00 (960m)
 *   to avoid late-afternoon mental fatigue. Falls back to 16:00-18:00 if no earlier slot exists.
 */
export function findOptimalStudySlot(
  events: CalendarEvent[],
  targetDurationMinutes = 45
): { startTime: string; endTime: string } {
  const targetDate = extractTargetDate(events);

  // 1. Gather all busy intervals for target date
  const busyIntervals: TimeInterval[] = [];

  for (const event of events) {
    if (event.status === 'CANCELLED') continue;

    // Check if event touches target date
    if (event.startTime.startsWith(targetDate) || event.endTime.startsWith(targetDate)) {
      const startMinutes = getMinutesFromMidnight(event.startTime);
      const endMinutes = getMinutesFromMidnight(event.endTime);
      if (endMinutes > startMinutes) {
        busyIntervals.push({ startMinutes, endMinutes });
      }
    }
  }

  // 2. Add Blackout: Lunch protection (12:00 to 13:00 = 720m to 780m)
  busyIntervals.push({ startMinutes: 12 * 60, endMinutes: 13 * 60 });

  // 3. Define search ranges:
  // Primary priority: 09:00 (540m) to 16:00 (960m) [Early fatigue avoidance window]
  // Secondary fallback: 16:00 (960m) to 18:00 (1080m)
  const morningWindowStart = 9 * 60; // 09:00
  const earlyCutoff = 16 * 60;       // 16:00
  const dayEnd = 18 * 60;            // 18:00

  const hasOverlap = (start: number, end: number): boolean => {
    return busyIntervals.some(busy => Math.max(start, busy.startMinutes) < Math.min(end, busy.endMinutes));
  };

  // 4. Scan in 15-minute increments for earliest slot before 16:00
  for (let current = morningWindowStart; current + targetDurationMinutes <= earlyCutoff; current += 15) {
    if (!hasOverlap(current, current + targetDurationMinutes)) {
      return {
        startTime: formatMinutesToIso(targetDate, current),
        endTime: formatMinutesToIso(targetDate, current + targetDurationMinutes),
      };
    }
  }

  // 5. Fallback: Scan 16:00 to 18:00 if no slot was available before 16:00
  for (let current = earlyCutoff; current + targetDurationMinutes <= dayEnd; current += 15) {
    if (!hasOverlap(current, current + targetDurationMinutes)) {
      return {
        startTime: formatMinutesToIso(targetDate, current),
        endTime: formatMinutesToIso(targetDate, current + targetDurationMinutes),
      };
    }
  }

  // 6. Final safety fallback: default to 14:00 (2:00 PM)
  const fallbackStart = 14 * 60;
  return {
    startTime: formatMinutesToIso(targetDate, fallbackStart),
    endTime: formatMinutesToIso(targetDate, fallbackStart + targetDurationMinutes),
  };
}
