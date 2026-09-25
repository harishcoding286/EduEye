// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Adaptive Schedule Generator
// Pure functions only. No React, no side-effects.
//
// Pipeline:
//  1. Materialise baseline events for a 7-day window.
//  2. Score each free slot by cognitive alertness curve.
//  3. Inject REMEDIATION_LOCK focus sprints for deficit subjects.
//  4. Detect conflicts, propose non-destructive reschedules, emit diffs.
//  5. Return ScheduledEvent[] + ScheduleDiff[] ready for FullCalendar.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  StudentScheduleRecord,
  BaselineEvent,
  ScheduledEvent,
  ScheduleDiff,
  AdaptiveScheduleResult,
  Chronotype,
} from '@/types/schedule';
import type { SubjectAnalytics } from '@/types/student-db';
import { getRootCauseChain, weaknessesToNodeIds } from './knowledgeGraph';

// ── Constants ─────────────────────────────────────────────────────────────────

const FOCUS_SPRINT_DURATION_MINS = 90; // 1.5h per session

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CLASS:          { bg: '#3368A0', text: '#ffffff', border: '#2b5887' },
  PERSONAL:       { bg: '#C8DFDB', text: '#3368A0', border: '#aed0cb' },
  REMEDIATION_LOCK: { bg: '#f87171', text: '#ffffff', border: '#ef4444' },
  CRITICAL_FOCUS: { bg: '#ef4444', text: '#ffffff', border: '#dc2626' },
  RESCHEDULED:    { bg: '#66A3BF', text: '#ffffff', border: '#4e8fa8' },
};

// ── Alertness Curve ───────────────────────────────────────────────────────────

/**
 * Returns a 0–100 cognitive alertness score for a given time-of-day (minutes
 * from midnight), modulated by chronotype.
 *
 * Based on two-process model of sleep (Borbély, 1982):
 *   Peak 1: 09:30–11:30 (≈570–690 min)
 *   Post-lunch dip: 13:00–14:30 (≈780–870 min)
 *   Peak 2: 14:30–16:00 (≈870–960 min)
 *   Late-afternoon fade: >17:30 (>1050 min)
 */
export function getAlertnessScore(minutesFromMidnight: number, chronotype: Chronotype): number {
  const m = minutesFromMidnight;
  const offset = chronotype === 'MORNING' ? -30 : chronotype === 'EVENING' ? 60 : 0;
  const adjusted = m - offset;

  // Gaussian-inspired peaks
  const peak1Center = 10.5 * 60; // 10:30
  const peak2Center = 15.0 * 60; // 15:00
  const dipCenter   = 13.5 * 60; // 13:30

  const gauss = (center: number, width: number, scale: number) =>
    scale * Math.exp(-Math.pow(adjusted - center, 2) / (2 * Math.pow(width, 2)));

  const score =
    gauss(peak1Center, 60, 100)  // morning peak
    + gauss(peak2Center, 45, 85) // afternoon peak
    - gauss(dipCenter, 40, 40);  // post-lunch dip penalty

  // Late evening fade: linear drop after 17:30
  const fadeStart = 17.5 * 60;
  const fadeBonus = adjusted > fadeStart ? -((adjusted - fadeStart) / 30) * 8 : 0;

  return Math.max(0, Math.min(100, Math.round(score + fadeBonus)));
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function hhmmToMins(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minsToHHMM(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function isoFromDateMins(datePart: string, mins: number): string {
  return `${datePart}T${minsToHHMM(mins)}:00`;
}

/** Returns YYYY-MM-DD strings for a 7-day window starting from today */
function get7DayWindow(anchorDate: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

interface MinimalInterval {
  startMins: number;
  endMins: number;
}

function hasOverlap(a: MinimalInterval, b: MinimalInterval): boolean {
  return Math.max(a.startMins, b.startMins) < Math.min(a.endMins, b.endMins);
}

// ── Materialise Baseline ──────────────────────────────────────────────────────

function materialiseBaseline(
  record: StudentScheduleRecord,
  days: string[],
): ScheduledEvent[] {
  const events: ScheduledEvent[] = [];

  for (const day of days) {
    const dow = new Date(day + 'T00:00:00').getDay(); // 0=Sun

    for (const base of record.weeklyBaselineEvents) {
      if (!base.dowPattern.includes(dow)) continue;

      const colors = EVENT_COLORS[base.category] ?? EVENT_COLORS.PERSONAL;
      events.push({
        id: `${base.id}_${day}`,
        title: base.title,
        start: isoFromDateMins(day, hhmmToMins(base.startHHMM)),
        end: isoFromDateMins(day, hhmmToMins(base.endHHMM)),
        category: base.category,
        color: colors.bg,
        textColor: colors.text,
        borderColor: colors.border,
        topic: base.topic,
        alertScore: getAlertnessScore(
          (hhmmToMins(base.startHHMM) + hhmmToMins(base.endHHMM)) / 2,
          record.chronotype,
        ),
      });
    }
  }

  return events;
}

// ── Candidate Slot Finder ─────────────────────────────────────────────────────

interface CandidateSlot {
  day: string;
  startMins: number;
  endMins: number;
  alertScore: number;
}

function findCandidateSlots(
  days: string[],
  busyByDay: Map<string, MinimalInterval[]>,
  chronotype: Chronotype,
  durationMins: number,
  searchWindowStart = 8 * 60,  // 08:00
  searchWindowEnd   = 21 * 60, // 21:00
): CandidateSlot[] {
  const candidates: CandidateSlot[] = [];

  for (const day of days) {
    const busy = busyByDay.get(day) ?? [];

    for (let start = searchWindowStart; start + durationMins <= searchWindowEnd; start += 30) {
      const slot: MinimalInterval = { startMins: start, endMins: start + durationMins };
      if (busy.some((b) => hasOverlap(slot, b))) continue;

      const midpoint = start + durationMins / 2;
      const alertScore = getAlertnessScore(midpoint, chronotype);

      candidates.push({ day, startMins: start, endMins: start + durationMins, alertScore });
    }
  }

  // Sort: highest alertness first, earliest day first
  return candidates.sort((a, b) => {
    if (Math.abs(b.alertScore - a.alertScore) > 5) return b.alertScore - a.alertScore;
    return a.day.localeCompare(b.day) || a.startMins - b.startMins;
  });
}

// ── Conflict Re-negotiation ───────────────────────────────────────────────────

/**
 * Tries to find an alternative time for a flexible PERSONAL event that is
 * blocking a high-priority focus slot, on the same day.
 *
 * Returns the rescheduled minutes [newStart, newEnd] or null if impossible.
 */
function findRescheduleSlot(
  busyIntervals: MinimalInterval[],
  eventDurationMins: number,
  excludeStartMins: number,
  daySearchEnd = 22 * 60,
): { newStart: number; newEnd: number } | null {
  // Try scheduling the bumped event in later slots (starting 30m after the conflict)
  const tryStart = excludeStartMins + eventDurationMins + 30;

  for (let s = tryStart; s + eventDurationMins <= daySearchEnd; s += 30) {
    const candidate: MinimalInterval = { startMins: s, endMins: s + eventDurationMins };
    if (!busyIntervals.some((b) => hasOverlap(candidate, b))) {
      return { newStart: s, newEnd: s + eventDurationMins };
    }
  }
  return null;
}

// ── Main Scheduler ─────────────────────────────────────────────────────────────

export function generateAdaptiveSchedule(
  studentId: string,
  scheduleRecord: StudentScheduleRecord,
  rankedSubjects: SubjectAnalytics[],
  anchorDate: Date = new Date(),
): AdaptiveScheduleResult {
  const days = get7DayWindow(anchorDate);
  const weekStart = days[0];
  const weekEnd = days[days.length - 1];

  // Identify ordered deficit subjects (worst first)
  const deficitSubjects = [...rankedSubjects].sort((a, b) => a.deficitScore - b.deficitScore);
  const criticalSubject = deficitSubjects[0];

  // Traverse knowledge graph to find root-cause chain for critical subject
  const failedNodeIds = weaknessesToNodeIds(criticalSubject.conceptWeaknesses);
  const rootCauseChain = getRootCauseChain(failedNodeIds);

  // Materialise baseline events
  const baselineEvents = materialiseBaseline(scheduleRecord, days);

  // Build busy-by-day map
  const busyByDay = new Map<string, MinimalInterval[]>();
  for (const day of days) {
    busyByDay.set(day, []);
  }
  for (const ev of baselineEvents) {
    const day = ev.start.slice(0, 10);
    const startMins = hhmmToMins(ev.start.slice(11, 16));
    const endMins   = hhmmToMins(ev.end.slice(11, 16));
    busyByDay.get(day)?.push({ startMins, endMins });
  }

  const finalEvents: ScheduledEvent[] = [...baselineEvents];
  const diffs: ScheduleDiff[] = [];
  let focusSlotsInjected = 0;

  // ── Determine how many focus sessions per subject ──────────────────────────
  // Critical subject: inject up to 4 sessions, secondary: up to 2
  const sessionsNeeded: Array<{ subject: SubjectAnalytics; count: number; conceptChain: string[] }> = [];

  for (let i = 0; i < Math.min(deficitSubjects.length, 3); i++) {
    const sub = deficitSubjects[i];
    const chain = i === 0 ? rootCauseChain.map((n) => n.label) : sub.conceptWeaknesses;
    const count = i === 0 ? 4 : i === 1 ? 2 : 1;
    sessionsNeeded.push({ subject: sub, count, conceptChain: chain });
  }

  // ── Inject focus sprints ───────────────────────────────────────────────────
  for (const { subject, count, conceptChain } of sessionsNeeded) {
    const candidates = findCandidateSlots(
      days,
      busyByDay,
      scheduleRecord.chronotype,
      FOCUS_SPRINT_DURATION_MINS,
    );

    let injected = 0;
    for (const slot of candidates) {
      if (injected >= count) break;

      const slotInterval: MinimalInterval = { startMins: slot.startMins, endMins: slot.endMins };
      const dayBusy = busyByDay.get(slot.day) ?? [];

      // Check for PERSONAL (flexible) event conflict only
      const conflictingPersonal = finalEvents.find((ev) => {
        if (ev.category !== 'PERSONAL') return false;
        if (ev.start.slice(0, 10) !== slot.day) return false;
        const evStart = hhmmToMins(ev.start.slice(11, 16));
        const evEnd   = hhmmToMins(ev.end.slice(11, 16));
        return hasOverlap(slotInterval, { startMins: evStart, endMins: evEnd });
      });

      if (conflictingPersonal) {
        // Try non-destructive reschedule
        const evDur = hhmmToMins(conflictingPersonal.end.slice(11, 16))
                    - hhmmToMins(conflictingPersonal.start.slice(11, 16));
        const reschedule = findRescheduleSlot(dayBusy, evDur, slot.endMins);

        if (reschedule) {
          const originalStart = conflictingPersonal.start;
          const originalEnd   = conflictingPersonal.end;
          const newStart = isoFromDateMins(slot.day, reschedule.newStart);
          const newEnd   = isoFromDateMins(slot.day, reschedule.newEnd);

          // Mutate in-place
          conflictingPersonal.start = newStart;
          conflictingPersonal.end   = newEnd;
          conflictingPersonal.isRescheduled = true;
          conflictingPersonal.originalStart = originalStart;
          conflictingPersonal.originalEnd   = originalEnd;
          conflictingPersonal.color = EVENT_COLORS.RESCHEDULED.bg;
          conflictingPersonal.borderColor = EVENT_COLORS.RESCHEDULED.border;
          conflictingPersonal.diffReason = `Rescheduled to lock in ${subject.name} Focus Sprint`;

          diffs.push({
            eventId: conflictingPersonal.id,
            eventTitle: conflictingPersonal.title,
            fromStart: originalStart,
            fromEnd: originalEnd,
            toStart: newStart,
            toEnd: newEnd,
            reason: `${conflictingPersonal.title} shifted to lock in critical ${subject.name} Focus Sprint at ${minsToHHMM(slot.startMins)}.`,
          });

          // Update busy map for rescheduled event
          busyByDay.set(
            slot.day,
            dayBusy.filter(
              (b) => !(b.startMins === hhmmToMins(originalStart.slice(11, 16))),
            ).concat({ startMins: reschedule.newStart, endMins: reschedule.newEnd }),
          );
        } else {
          // Can't reschedule — skip this slot
          continue;
        }
      }

      // Determine concept to focus on (rotate through chain)
      const focusConcept = conceptChain[injected % Math.max(conceptChain.length, 1)]
        ?? subject.name;

      const isCritical = subject.id === criticalSubject.id;
      const colors = isCritical ? EVENT_COLORS.CRITICAL_FOCUS : EVENT_COLORS.REMEDIATION_LOCK;

      const sprintEvent: ScheduledEvent = {
        id: `sprint_${subject.id}_${slot.day}_${slot.startMins}`,
        title: `${subject.name} — Focus Sprint`,
        start: isoFromDateMins(slot.day, slot.startMins),
        end: isoFromDateMins(slot.day, slot.endMins),
        category: 'REMEDIATION_LOCK',
        color: colors.bg,
        textColor: colors.text,
        borderColor: colors.border,
        topic: focusConcept,
        alertScore: slot.alertScore,
      };

      finalEvents.push(sprintEvent);

      // Mark slot as busy
      dayBusy.push({ startMins: slot.startMins, endMins: slot.endMins });
      busyByDay.set(slot.day, dayBusy);

      injected++;
      focusSlotsInjected++;
    }
  }

  return {
    events: finalEvents,
    diffs,
    criticalSubject: criticalSubject.name,
    focusSlotsInjected,
    weekStart,
    weekEnd,
  };
}
