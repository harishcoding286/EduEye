// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Student Analytics Engine
// Pure functions: no side-effects, no imports from React/Next.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  SubjectRecord,
  SubjectAnalytics,
  StudentAnalytics,
  StudentDatabase,
} from '@/types/student-db';

export function computeSubjectAnalytics(s: SubjectRecord): SubjectAnalytics {
  const avgCATScore =
    ((s.cat1Score + s.cat2Score) / (2 * s.maxCATScore)) * 100;
  const catDelta = s.cat2Score - s.cat1Score;
  const assignmentRate =
    s.totalAssignments === 0
      ? 100
      : (s.submittedOnTime / s.totalAssignments) * 100;

  // Composite deficit score: lower → more at risk
  // Weighted: 50% avg CAT, 30% assignment rate, 20% trajectory (capped)
  const trajectoryPenalty = catDelta < 0 ? Math.abs(catDelta) * 0.4 : 0;
  const deficitScore =
    avgCATScore * 0.5 + assignmentRate * 0.3 - trajectoryPenalty;

  const trend: SubjectAnalytics['trend'] =
    catDelta > 2 ? 'IMPROVING' : catDelta < -2 ? 'DECLINING' : 'STABLE';

  return { ...s, avgCATScore, catDelta, assignmentRate, deficitScore, trend };
}

export function computeStudentAnalytics(db: StudentDatabase): StudentAnalytics {
  const { student, subjects } = db;

  const analysed = subjects.map(computeSubjectAnalytics);
  const attendancePct = (student.daysAttended / student.totalWorkingDays) * 100;

  const avgAssignmentRate =
    analysed.reduce((acc, s) => acc + s.assignmentRate, 0) / analysed.length;

  const avgCATScore =
    analysed.reduce((acc, s) => acc + s.avgCATScore, 0) / analysed.length;

  // Critical subject = lowest deficitScore
  const criticalSubject = [...analysed].sort(
    (a, b) => a.deficitScore - b.deficitScore
  )[0];

  return {
    attendancePct,
    avgAssignmentRate,
    avgCATScore,
    criticalSubject,
    subjects: analysed,
  };
}
