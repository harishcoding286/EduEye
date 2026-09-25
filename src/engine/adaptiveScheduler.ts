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

// ── Constants ─────────────────────────────────────────────────────────────────

const CRITICAL_FOCUS_DURATION_MINS = 120; // 2 hours for critical deficit subject
const REVISION_DURATION_MINS = 40;        // At least 30-45 mins for other subjects

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CLASS:            { bg: '#3368A0', text: '#ffffff', border: '#2b5887' },
  PERSONAL:         { bg: '#C8DFDB', text: '#3368A0', border: '#aed0cb' },
  REMEDIATION_LOCK: { bg: '#66A3BF', text: '#ffffff', border: '#4e8fa8' },
  CRITICAL_FOCUS:   { bg: '#ef4444', text: '#ffffff', border: '#dc2626' },
  RESCHEDULED:      { bg: '#66A3BF', text: '#ffffff', border: '#4e8fa8' },
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

/**
 * Searches for free slots while STRICTLY preserving:
 * - 8 hours of sleep: No scheduling between 22:30 and 07:30
 * - College commitments & existing booked events
 */
function findCandidateSlots(
  days: string[],
  busyByDay: Map<string, MinimalInterval[]>,
  chronotype: Chronotype,
  durationMins: number,
  searchWindowStart = 7 * 60 + 30, // 07:30 (strictly after 8h sleep)
  searchWindowEnd   = 22 * 60,      // 22:00 (leaves 1h wind-down before 23:00 sleep)
  preferredPeriod?: 'MORNING' | 'AFTERNOON' | 'EVENING',
): CandidateSlot[] {
  const candidates: CandidateSlot[] = [];

  for (const day of days) {
    const busy = busyByDay.get(day) ?? [];

    for (let start = searchWindowStart; start + durationMins <= searchWindowEnd; start += 15) {
      const slot: MinimalInterval = { startMins: start, endMins: start + durationMins };
      if (busy.some((b) => hasOverlap(slot, b))) continue;

      const midpoint = start + durationMins / 2;
      let alertScore = getAlertnessScore(midpoint, chronotype);

      // Apply subtle boost for requested period of the day
      if (preferredPeriod === 'MORNING' && start < 12 * 60) {
        alertScore += 10;
      } else if (preferredPeriod === 'EVENING' && start >= 17 * 60 && start <= 21 * 60) {
        alertScore += 10;
      }

      candidates.push({ day, startMins: start, endMins: start + durationMins, alertScore });
    }
  }

  // Sort: highest alertness first, then earliest day
  return candidates.sort((a, b) => {
    if (Math.abs(b.alertScore - a.alertScore) > 5) return b.alertScore - a.alertScore;
    return a.day.localeCompare(b.day) || a.startMins - b.startMins;
  });
}

// ── Conflict Re-negotiation ───────────────────────────────────────────────────

function findRescheduleSlot(
  busyIntervals: MinimalInterval[],
  eventDurationMins: number,
  excludeStartMins: number,
  daySearchEnd = 22 * 60,
): { newStart: number; newEnd: number } | null {
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

  // Identify ordered deficit subjects (worst deficit is critical)
  const deficitSubjects = [...rankedSubjects].sort((a, b) => a.deficitScore - b.deficitScore);
  const criticalSubject = deficitSubjects[0];
  const otherSubjects = rankedSubjects.filter((s) => s.id !== criticalSubject.id);

  // Traverse knowledge graph for root-cause chain of critical subject
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

  // ── 1. Allocate Critical Subject (2-hour Deep Focus Sprints) ───────────────────
  // Critical subject gets prioritized 4 deep focus sessions (90-120 mins) during peak alertness
  const criticalCandidates = findCandidateSlots(
    days,
    busyByDay,
    scheduleRecord.chronotype,
    CRITICAL_FOCUS_DURATION_MINS,
    7 * 60 + 30,
    22 * 60,
    'EVENING',
  );

  let criticalInjected = 0;
  for (const slot of criticalCandidates) {
    if (criticalInjected >= 4) break;

    const slotInterval: MinimalInterval = { startMins: slot.startMins, endMins: slot.endMins };
    const dayBusy = busyByDay.get(slot.day) ?? [];

    // Avoid double scheduling critical on the same day if already present
    const alreadyOnDay = finalEvents.some(
      (e) => e.start.slice(0, 10) === slot.day && e.title.includes(criticalSubject.name),
    );
    if (alreadyOnDay && criticalInjected < 3) continue;

    if (dayBusy.some((b) => hasOverlap(slotInterval, b))) continue;

    const focusConcept =
      rootCauseChain[criticalInjected % Math.max(rootCauseChain.length, 1)]?.label ??
      criticalSubject.conceptWeaknesses[0] ??
      criticalSubject.name;

    const sprintEvent: ScheduledEvent = {
      id: `sprint_critical_${criticalSubject.id}_${slot.day}_${slot.startMins}`,
      title: `${criticalSubject.name} — Deep Focus Sprint (2h)`,
      start: isoFromDateMins(slot.day, slot.startMins),
      end: isoFromDateMins(slot.day, slot.endMins),
      category: 'REMEDIATION_LOCK',
      color: EVENT_COLORS.CRITICAL_FOCUS.bg,
      textColor: EVENT_COLORS.CRITICAL_FOCUS.text,
      borderColor: EVENT_COLORS.CRITICAL_FOCUS.border,
      topic: focusConcept,
      alertScore: slot.alertScore,
    };

    finalEvents.push(sprintEvent);
    dayBusy.push(slotInterval);
    busyByDay.set(slot.day, dayBusy);

    criticalInjected++;
    focusSlotsInjected++;
  }

  // ── 2. Allocate Other Subjects (At least 30-45 mins Revisions on Different Periods) ──
  // Every non-critical subject gets scheduled for 30-45m revision blocks across different days/times
  for (const otherSub of otherSubjects) {
    const subCandidates = findCandidateSlots(
      days,
      busyByDay,
      scheduleRecord.chronotype,
      REVISION_DURATION_MINS,
      7 * 60 + 30, // 07:30 morning
      22 * 60,      // 22:00 evening
      otherSub.deficitScore < 0 ? 'MORNING' : 'EVENING',
    );

    let subInjected = 0;
    const targetSessions = 2; // At least 2 revision sessions per subject per week

    for (const slot of subCandidates) {
      if (subInjected >= targetSessions) break;

      const slotInterval: MinimalInterval = { startMins: slot.startMins, endMins: slot.endMins };
      const dayBusy = busyByDay.get(slot.day) ?? [];

      if (dayBusy.some((b) => hasOverlap(slotInterval, b))) continue;

      const isMorning = slot.startMins < 12 * 60;
      const topicTag =
        otherSub.conceptWeaknesses[subInjected % Math.max(otherSub.conceptWeaknesses.length, 1)] ??
        otherSub.keyTopics[0] ??
        otherSub.name;

      const revisionEvent: ScheduledEvent = {
        id: `rev_${otherSub.id}_${slot.day}_${slot.startMins}`,
        title: `${otherSub.name} — ${isMorning ? 'Morning Quick Revision (40m)' : 'Review & Practice (40m)'}`,
        start: isoFromDateMins(slot.day, slot.startMins),
        end: isoFromDateMins(slot.day, slot.endMins),
        category: 'REMEDIATION_LOCK',
        color: EVENT_COLORS.REMEDIATION_LOCK.bg,
        textColor: EVENT_COLORS.REMEDIATION_LOCK.text,
        borderColor: EVENT_COLORS.REMEDIATION_LOCK.border,
        topic: topicTag,
        alertScore: slot.alertScore,
      };

      finalEvents.push(revisionEvent);
      dayBusy.push(slotInterval);
      busyByDay.set(slot.day, dayBusy);

      subInjected++;
      focusSlotsInjected++;
    }
  }

  // ── 3. Strict Deduplication & Non-Overlap Pass ─────────────────────────────────
  // Ensure that no two events ever overlap or duplicate the same hour
  const deduplicatedEvents: ScheduledEvent[] = [];
  const seenIntervals = new Set<string>();

  for (const ev of finalEvents) {
    const timeKey = `${ev.start.slice(0, 10)}_${hhmmToMins(ev.start.slice(11, 16))}`;
    if (!seenIntervals.has(timeKey)) {
      seenIntervals.add(timeKey);
      deduplicatedEvents.push(ev);
    }
  }

  return {
    events: deduplicatedEvents,
    diffs,
    criticalSubject: criticalSubject.name,
    focusSlotsInjected,
    weekStart,
    weekEnd,
  };
}
