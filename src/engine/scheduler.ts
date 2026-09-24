// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Cognitive Scheduling Engine
// Autonomous heuristic calendar allocator for remediation focus blocks.
// ─────────────────────────────────────────────────────────────────────────────

import type { CalendarEvent } from '@/types';

export interface SchedulingConstraints {
  dateStr: string; // "YYYY-MM-DD", e.g. "2026-09-24"
  durationMinutes: number; // e.g. 45 or 60
  topic: string;
  avoidLunch?: boolean; // Default true: protect 12:00 - 13:30
  fatigueBufferMinutes?: number; // Default 15 min buffer after classes
}

export interface ScheduledRemediationSlot {
  event: CalendarEvent;
  heuristicsLog: string[];
}

interface TimeRange {
  start: number; // minutes from midnight (e.g. 14:00 = 840)
  end: number;
}

function parseTimeToMinutes(isoString: string): number {
  const d = new Date(isoString);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function formatMinutesToIso(dateStr: string, minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${dateStr}T${pad(hours)}:${pad(mins)}:00.000Z`;
}

/**
 * Finds the optimal open focus window for remediation using cognitive heuristics.
 * Heuristics applied:
 *  1. Protected nutrition windows (Lunch: 12:00 - 13:30).
 *  2. Cognitive fatigue mitigation (enforces buffer post-class).
 *  3. Chronobiology preference (Afternoon post-lunch peak: 14:00 - 16:00).
 *  4. Strict collision detection against active/completed classes and personal blocks.
 */
export function scheduleCognitiveRemediation(
  existingEvents: CalendarEvent[],
  constraints: SchedulingConstraints
): ScheduledRemediationSlot {
  const {
    dateStr,
    durationMinutes = 45,
    topic,
    avoidLunch = true,
    fatigueBufferMinutes = 15,
  } = constraints;

  const heuristicsLog: string[] = [];
  heuristicsLog.push(`Analyzing calendar for ${dateStr} with ${existingEvents.length} existing events.`);

  // 1. Extract active busy ranges for the target date
  const busyRanges: TimeRange[] = [];
  for (const evt of existingEvents) {
    if (evt.status === 'CANCELLED') continue;

    // Check if event belongs to target date
    if (evt.startTime.startsWith(dateStr) || evt.endTime.startsWith(dateStr)) {
      const startMin = parseTimeToMinutes(evt.startTime);
      const endMin = parseTimeToMinutes(evt.endTime);
      // Add fatigue buffer to end of intensive classes
      const buffer = evt.category === 'CLASS' ? fatigueBufferMinutes : 0;
      busyRanges.push({ start: startMin, end: endMin + buffer });
      heuristicsLog.push(
        `Busy block detected: "${evt.title}" (${Math.floor(startMin / 60)}:${(startMin % 60)
          .toString()
          .padStart(2, '0')} - ${Math.floor(endMin / 60)}:${(endMin % 60)
          .toString()
          .padStart(2, '0')}) + ${buffer}m buffer`
      );
    }
  }

  // 2. Add protected nutrition windows
  if (avoidLunch) {
    busyRanges.push({ start: 12 * 60, end: 13 * 60 + 30 }); // 12:00 - 13:30
    heuristicsLog.push('Protected nutrition window locked: Lunch (12:00 - 13:30).');
  }

  // Evening boundary
  busyRanges.push({ start: 19 * 60, end: 24 * 60 }); // 19:00 onwards

  // 3. Scan candidate slots from 09:00 to 18:30 in 15-minute intervals
  const dayStart = 9 * 60; // 09:00 AM
  const dayEnd = 18 * 60 + 30; // 06:30 PM

  // Candidate evaluation with cognitive desirability scoring
  let bestSlotMinutes = -1;
  let highestScore = -Infinity;

  for (let t = dayStart; t + durationMinutes <= dayEnd; t += 15) {
    const slotRange: TimeRange = { start: t, end: t + durationMinutes };

    // Check collisions
    const hasCollision = busyRanges.some(
      busy => Math.max(slotRange.start, busy.start) < Math.min(slotRange.end, busy.end)
    );

    if (hasCollision) continue;

    // Heuristic cognitive scoring:
    // Peak focus window is 14:00 (840 min)
    let score = 100;

    // Favor early afternoon 14:00 - 15:30
    if (t >= 14 * 60 && t <= 15 * 60 + 30) {
      score += 50;
      if (t === 14 * 60) score += 30; // Exact 2:00 PM target bonus
    } else if (t >= 10 * 60 + 30 && t <= 11 * 60 + 45) {
      // Secondary morning focus slot
      score += 30;
    } else if (t >= 16 * 60) {
      score -= 20; // Late afternoon fatigue penalty
    }

    if (score > highestScore) {
      highestScore = score;
      bestSlotMinutes = t;
    }
  }

  // Fallback if no window found: 14:00 default
  const chosenStart = bestSlotMinutes !== -1 ? bestSlotMinutes : 14 * 60;
  const chosenEnd = chosenStart + durationMinutes;

  heuristicsLog.push(
    `Optimal cognitive slot selected: ${Math.floor(chosenStart / 60)}:${(chosenStart % 60)
      .toString()
      .padStart(2, '0')} - ${Math.floor(chosenEnd / 60)}:${(chosenEnd % 60)
      .toString()
      .padStart(2, '0')} (Cognitive Score: ${highestScore}).`
  );

  const newEvent: CalendarEvent = {
    id: `evt_rem_${Date.now()}`,
    title: `${topic} Remediation Block`,
    startTime: formatMinutesToIso(dateStr, chosenStart),
    endTime: formatMinutesToIso(dateStr, chosenEnd),
    category: 'REMEDIATION_LOCK',
    status: 'SCHEDULED',
    topic,
  };

  return {
    event: newEvent,
    heuristicsLog,
  };
}
