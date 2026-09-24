// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Cognitive Risk Engine
// Computes student risk tier, predicted grade, and concept deficits from telemetry.
// ─────────────────────────────────────────────────────────────────────────────

import type { Assessment, RiskTier, StudentProfile } from '@/types';

/**
 * Normalizes a topic string into a uniform deficit slug.
 * E.g. "Eigenvalues & Eigenvectors" -> "eigenvalues-eigenvectors"
 */
export function topicToSlug(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export interface RiskAnalysisResult {
  predictedGrade: number;
  riskTier: RiskTier;
  activeDeficits: string[];
}

/**
 * Calculates dynamic risk metrics from telemetry:
 * - Weighted assessment scores (recent assignments carry higher weight)
 * - Procrastination lag penalty (actualLagHours vs expectedLagHours)
 * - Attendance rate impact (attendance below 75% incurs linear penalty)
 */
export function evaluateStudentRisk(
  assessments: Assessment[],
  attendanceRate: number
): RiskAnalysisResult {
  if (assessments.length === 0) {
    return {
      predictedGrade: Math.round(attendanceRate),
      riskTier: attendanceRate >= 75 ? 'OPTIMAL' : attendanceRate >= 60 ? 'REMEDIATING' : 'CRITICAL',
      activeDeficits: [],
    };
  }

  // 1. Calculate weighted assessment average (recency bias)
  let totalWeight = 0;
  let weightedScoreSum = 0;
  const deficitsSet = new Set<string>();

  // Sort assessments chronologically ascending
  const sorted = [...assessments].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );

  sorted.forEach((asmt, index) => {
    // Linear recency weight from 1.0 to 2.5
    const recencyMultiplier = 1.0 + (index / Math.max(1, sorted.length - 1)) * 1.5;
    const scorePct = (asmt.score / asmt.maxScore) * 100;

    // Check for submission lag penalty: if lag is double expected, apply penalty
    const lagRatio = asmt.actualLagHours / Math.max(1, asmt.expectedLagHours);
    const lagPenalty = lagRatio > 1.2 ? Math.min(15, (lagRatio - 1.0) * 8) : 0;

    const adjustedScore = Math.max(0, scorePct - lagPenalty);

    weightedScoreSum += adjustedScore * recencyMultiplier;
    totalWeight += recencyMultiplier;

    // Flag deficit if score is below 70% or if score < 75% with severe lag
    if (scorePct < 70 || (scorePct < 75 && lagRatio > 1.3)) {
      deficitsSet.add(topicToSlug(asmt.topic));
    }
  });

  const baseAcademicScore = totalWeight > 0 ? weightedScoreSum / totalWeight : 70;

  // 2. Attendance impact (70% academic weight, 30% attendance weight)
  const combinedGrade = Math.round(baseAcademicScore * 0.75 + attendanceRate * 0.25);
  const clampedGrade = Math.max(0, Math.min(100, combinedGrade));

  // 3. Risk Tier Determination
  let riskTier: RiskTier;
  if (clampedGrade >= 75 && deficitsSet.size === 0) {
    riskTier = 'OPTIMAL';
  } else if (clampedGrade >= 65 || (clampedGrade >= 55 && deficitsSet.size <= 1)) {
    riskTier = 'REMEDIATING';
  } else {
    riskTier = 'CRITICAL';
  }

  return {
    predictedGrade: clampedGrade,
    riskTier,
    activeDeficits: Array.from(deficitsSet),
  };
}

/**
 * Ingests a new assessment telemetry entry into the student profile and recalculates risk.
 */
export function ingestAssessment(
  student: StudentProfile,
  newAssessment: Assessment
): {
  updatedStudent: StudentProfile;
  previousGrade: number;
  previousTier: RiskTier;
  hasNewDeficit: boolean;
} {
  const previousGrade = student.predictedGrade;
  const previousTier = student.riskTier;
  const updatedAssessments = [...student.recentAssessments, newAssessment];

  const analysis = evaluateStudentRisk(updatedAssessments, student.attendanceRate);

  const topicSlug = topicToSlug(newAssessment.topic);
  const hasNewDeficit =
    analysis.activeDeficits.includes(topicSlug) && !student.activeDeficits.includes(topicSlug);

  const updatedStudent: StudentProfile = {
    ...student,
    predictedGrade: analysis.predictedGrade,
    riskTier: analysis.riskTier,
    activeDeficits: analysis.activeDeficits,
    recentAssessments: updatedAssessments,
  };

  return {
    updatedStudent,
    previousGrade,
    previousTier,
    hasNewDeficit,
  };
}

/**
 * Resolves an active deficit when student achieves mastery on a diagnostic micro-drill.
 * Recovers predicted grade and sets remediation events to COMPLETED.
 */
export function resolveDeficit(
  student: StudentProfile,
  resolvedDeficitSlug: string
): {
  updatedStudent: StudentProfile;
  recoveredGrade: number;
  newTier: RiskTier;
} {
  const remainingDeficits = student.activeDeficits.filter(
    slug => slug !== resolvedDeficitSlug && slug !== topicToSlug(resolvedDeficitSlug)
  );

  // Update calendar events: mark matching remediation blocks as COMPLETED
  const updatedCalendarEvents = student.calendarEvents.map(evt => {
    if (
      evt.category === 'REMEDIATION_LOCK' &&
      evt.topic &&
      topicToSlug(evt.topic) === topicToSlug(resolvedDeficitSlug)
    ) {
      return { ...evt, status: 'COMPLETED' as const };
    }
    return evt;
  });

  // Calculate recovered grade (+25-30 point recovery post-drill completion)
  const baselineGrade = student.predictedGrade;
  const recoveredGrade = Math.min(88, Math.max(82, baselineGrade + 30));
  const newTier: RiskTier = remainingDeficits.length === 0 ? 'OPTIMAL' : 'REMEDIATING';

  const updatedStudent: StudentProfile = {
    ...student,
    predictedGrade: recoveredGrade,
    riskTier: newTier,
    activeDeficits: remainingDeficits,
    calendarEvents: updatedCalendarEvents,
  };

  return {
    updatedStudent,
    recoveredGrade,
    newTier,
  };
}
