// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Schedule & Adaptive Scheduler Types
// ─────────────────────────────────────────────────────────────────────────────

import type { CalendarCategory } from '@/types';

// ── Raw DB shape ──────────────────────────────────────────────────────────────

export interface BaselineEvent {
  id: string;
  title: string;
  category: CalendarCategory;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  /** Day-of-week integers: 0=Sun, 1=Mon … 6=Sat */
  dowPattern: number[];
  startHHMM: string; // "09:30"
  endHHMM: string;   // "13:00"
  topic: string | null;
}

export interface UpcomingExam {
  subjectId: string;
  subjectName: string;
  examType: string;
  examDate: string; // ISO YYYY-MM-DD
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export type Chronotype = 'MORNING' | 'EVENING' | 'NEUTRAL';

export interface StudentScheduleRecord {
  studentId: string;
  chronotype: Chronotype;
  timezone: string;
  weeklyBaselineEvents: BaselineEvent[];
  upcomingExams: UpcomingExam[];
}

export interface StudentScheduleDB {
  [studentId: string]: StudentScheduleRecord;
}

// ── Adaptive Scheduler Output ─────────────────────────────────────────────────

export type EventColor = 'CLASS' | 'PERSONAL' | 'REMEDIATION_LOCK' | 'CRITICAL_FOCUS' | 'RESCHEDULED';

export interface ScheduledEvent {
  id: string;
  title: string;
  start: string; // ISO-8601
  end: string;
  category: CalendarCategory;
  color: string;
  textColor: string;
  borderColor: string;
  topic?: string | null;
  alertScore?: number;         // 0–100 cognitive alertness at this time
  isRescheduled?: boolean;
  originalStart?: string;
  originalEnd?: string;
  diffReason?: string;
}

export interface ScheduleDiff {
  eventId: string;
  eventTitle: string;
  fromStart: string;
  fromEnd: string;
  toStart: string;
  toEnd: string;
  reason: string;
}

export interface AdaptiveScheduleResult {
  events: ScheduledEvent[];
  diffs: ScheduleDiff[];
  criticalSubject: string;
  focusSlotsInjected: number;
  weekStart: string;
  weekEnd: string;
}

// ── Knowledge Graph ───────────────────────────────────────────────────────────

export interface KnowledgeNode {
  id: string;
  label: string;
  subjectId: string;
  prerequisites: string[]; // node IDs that must be mastered first
  difficulty: 1 | 2 | 3 | 4 | 5;
}
