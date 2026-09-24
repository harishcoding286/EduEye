// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Centralised Data Contracts
// All feature branches import from this single source of truth.
// Do NOT alter existing interface shapes without a cross-team RFC.
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ─────────────────────────────────────────────────────────────────────

export type Role = 'STUDENT' | 'TEACHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

// ── Assessments ───────────────────────────────────────────────────────────────

export interface Assessment {
  /** Unique assessment identifier */
  id: string;
  /** Course name, e.g. "Linear Algebra" */
  course: string;
  /** Specific topic tested, e.g. "Eigenvalues" */
  topic: string;
  /** Raw score achieved */
  score: number;
  /** Maximum possible score */
  maxScore: number;
  /** ISO-8601 datetime string of when the student submitted */
  submittedAt: string;
  /**
   * Ideal hours between lesson delivery and quiz submission
   * (used to detect procrastination patterns).
   */
  expectedLagHours: number;
  /** Actual hours the student took before submitting */
  actualLagHours: number;
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export type CalendarCategory = 'CLASS' | 'PERSONAL' | 'REMEDIATION_LOCK';

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO-8601 datetime string */
  startTime: string;
  /** ISO-8601 datetime string */
  endTime: string;
  category: CalendarCategory;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  /** Optional topic tag – populated for CLASS and REMEDIATION_LOCK events */
  topic?: string;
}

// ── Diagnostics ───────────────────────────────────────────────────────────────

export interface DiagnosticQuestion {
  id: string;
  questionText: string;
  /** Exactly 4 answer options presented to the student */
  options: string[];
  /** Zero-based index into `options` pointing to the correct answer */
  correctIndex: number;
  /** Short explanation surfaced to the student after answering */
  remediationInsight: string;
}

export interface DiagnosticQuiz {
  id: string;
  /** The concept the quiz is designed to probe */
  targetConcept: string;
  questions: DiagnosticQuestion[];
  /** Hard time limit for the entire quiz in seconds */
  timeLimitSeconds: number;
}

// ── Student Intelligence ───────────────────────────────────────────────────────

export type RiskTier = 'OPTIMAL' | 'REMEDIATING' | 'CRITICAL';

export interface StudentProfile {
  id: string;
  name: string;
  /** Value 0–100 representing percentage of classes attended */
  attendanceRate: number;
  /** ML-predicted end-of-term grade (0–100) */
  predictedGrade: number;
  riskTier: RiskTier;
  /** List of concept slugs the student currently struggles with */
  activeDeficits: string[];
  recentAssessments: Assessment[];
  calendarEvents: CalendarEvent[];
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  /** ISO-8601 datetime string */
  timestamp: string;
  studentId: string;
  actionType: 'AUTO_SCHEDULED' | 'QUIZ_RESOLVED' | 'TA_ESCALATED';
  description: string;
}
