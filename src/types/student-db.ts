// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Student Performance Database Types
// Used by the /dashboard and /analytics feature set.
// ─────────────────────────────────────────────────────────────────────────────

export interface SubjectRecord {
  id: string;
  code: string;
  name: string;
  credits: number;
  faculty: string;
  cat1Score: number;
  cat2Score: number;
  maxCATScore: number;
  totalAssignments: number;
  submittedOnTime: number;
  keyTopics: string[];
  conceptWeaknesses: string[];
}

export interface StudentRecord {
  id: string;
  name: string;
  rollNumber: string;
  semester: number;
  academicYear: string;
  branch: string;
  totalWorkingDays: number;
  daysAttended: number;
}

export interface StudentDatabase {
  student: StudentRecord;
  subjects: SubjectRecord[];
}

// ── Computed analytics helpers ────────────────────────────────────────────────

export interface SubjectAnalytics extends SubjectRecord {
  avgCATScore: number;          // out of 100 (normalised)
  catDelta: number;             // cat2Score - cat1Score
  assignmentRate: number;       // 0–100
  deficitScore: number;         // composite risk score (lower = more at risk)
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

export interface StudentAnalytics {
  attendancePct: number;
  avgAssignmentRate: number;
  avgCATScore: number;          // normalised to 100
  criticalSubject: SubjectAnalytics;
  subjects: SubjectAnalytics[];
}

// ── Quiz types (Gemini-generated) ────────────────────────────────────────────

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctIndex: number;
  remediationInsight: string;
}

export interface GeneratedQuiz {
  subject: string;
  questions: QuizQuestion[];
}
