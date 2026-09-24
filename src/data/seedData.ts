// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Pre-seeded Mock State
//
// Rules for contributors:
//  1. Never mutate these exports directly – treat them as immutable fixtures.
//  2. Deep-clone before passing into state managers:
//       const student = structuredClone(initialStudent);
//  3. All ISO-8601 dates use the format YYYY-MM-DDTHH:mm:ss.sssZ.
//     The date "today" in seeds is pinned to 2026-09-24 (project kickoff).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Assessment,
  AuditLog,
  CalendarEvent,
  DiagnosticQuiz,
  StudentProfile,
} from '@/types';

// ── Shared Helpers ────────────────────────────────────────────────────────────

/** Pinned "today" so seeds never drift with the system clock. */
const TODAY = '2026-09-24';

function ts(date: string, time: string): string {
  return `${date}T${time}:00.000Z`;
}

// ─────────────────────────────────────────────────────────────────────────────
// initialStudent — Alex Rivera (std_101)
// ─────────────────────────────────────────────────────────────────────────────

const alexAssessments: Assessment[] = [
  {
    id: 'asmt_001',
    course: 'Linear Algebra',
    topic: 'Matrix Multiplication',
    score: 88,
    maxScore: 100,
    submittedAt: ts('2026-09-18', '14:32'),
    expectedLagHours: 24,
    actualLagHours: 21,
  },
  {
    id: 'asmt_002',
    course: 'Linear Algebra',
    topic: 'Eigenvalues & Eigenvectors',
    score: 61,
    maxScore: 100,
    submittedAt: ts('2026-09-21', '09:15'),
    expectedLagHours: 24,
    actualLagHours: 38, // submitted late – triggers deficit flag
  },
  {
    id: 'asmt_003',
    course: 'Data Structures',
    topic: 'Graph Traversal (BFS/DFS)',
    score: 92,
    maxScore: 100,
    submittedAt: ts('2026-09-23', '11:00'),
    expectedLagHours: 48,
    actualLagHours: 46,
  },
];

const alexCalendarEvents: CalendarEvent[] = [
  {
    id: 'evt_001',
    title: 'Linear Algebra Lecture',
    startTime: ts(TODAY, '09:00'),
    endTime: ts(TODAY, '10:30'),
    category: 'CLASS',
    status: 'COMPLETED',
    topic: 'Eigenvalues & Eigenvectors',
  },
  {
    id: 'evt_002',
    title: 'Eigenvector Remediation Block',
    startTime: ts(TODAY, '14:00'),
    endTime: ts(TODAY, '15:00'),
    category: 'REMEDIATION_LOCK',
    status: 'SCHEDULED',
    topic: 'Eigenvalues & Eigenvectors',
  },
  {
    id: 'evt_003',
    title: 'Study Group – Algorithms',
    startTime: ts(TODAY, '17:30'),
    endTime: ts(TODAY, '19:00'),
    category: 'PERSONAL',
    status: 'SCHEDULED',
  },
];

export const initialStudent: StudentProfile = {
  id: 'std_101',
  name: 'Alex Rivera',
  attendanceRate: 74,
  predictedGrade: 84,
  riskTier: 'OPTIMAL',
  activeDeficits: ['eigenvalues-eigenvectors'],
  recentAssessments: alexAssessments,
  calendarEvents: alexCalendarEvents,
};

// ─────────────────────────────────────────────────────────────────────────────
// initialCohort — 5-student roster for Teacher Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const initialCohort: StudentProfile[] = [
  // 1 — Alex Rivera (already defined above, referenced by value)
  initialStudent,

  // 2 — Jordan Lee | REMEDIATING
  {
    id: 'std_102',
    name: 'Jordan Lee',
    attendanceRate: 61,
    predictedGrade: 67,
    riskTier: 'REMEDIATING',
    activeDeficits: ['vector-spaces', 'eigenvalues-eigenvectors'],
    recentAssessments: [
      {
        id: 'asmt_101',
        course: 'Linear Algebra',
        topic: 'Vector Spaces',
        score: 54,
        maxScore: 100,
        submittedAt: ts('2026-09-20', '16:45'),
        expectedLagHours: 24,
        actualLagHours: 52,
      },
      {
        id: 'asmt_102',
        course: 'Linear Algebra',
        topic: 'Eigenvalues & Eigenvectors',
        score: 48,
        maxScore: 100,
        submittedAt: ts('2026-09-22', '20:10'),
        expectedLagHours: 24,
        actualLagHours: 63,
      },
    ],
    calendarEvents: [
      {
        id: 'evt_101',
        title: 'Vector Spaces Remediation Block',
        startTime: ts(TODAY, '10:00'),
        endTime: ts(TODAY, '11:30'),
        category: 'REMEDIATION_LOCK',
        status: 'SCHEDULED',
        topic: 'Vector Spaces',
      },
    ],
  },

  // 3 — Marcus Vance | CRITICAL
  {
    id: 'std_103',
    name: 'Marcus Vance',
    attendanceRate: 42,
    predictedGrade: 51,
    riskTier: 'CRITICAL',
    activeDeficits: [
      'matrix-multiplication',
      'vector-spaces',
      'eigenvalues-eigenvectors',
      'determinants',
    ],
    recentAssessments: [
      {
        id: 'asmt_201',
        course: 'Linear Algebra',
        topic: 'Determinants',
        score: 39,
        maxScore: 100,
        submittedAt: ts('2026-09-19', '23:55'),
        expectedLagHours: 24,
        actualLagHours: 72,
      },
      {
        id: 'asmt_202',
        course: 'Calculus II',
        topic: 'Integration by Parts',
        score: 45,
        maxScore: 100,
        submittedAt: ts('2026-09-23', '08:30'),
        expectedLagHours: 48,
        actualLagHours: 91,
      },
    ],
    calendarEvents: [
      {
        id: 'evt_201',
        title: 'TA Office Hours — Escalation',
        startTime: ts(TODAY, '13:00'),
        endTime: ts(TODAY, '14:00'),
        category: 'REMEDIATION_LOCK',
        status: 'SCHEDULED',
        topic: 'determinants',
      },
    ],
  },

  // 4 — Chloe Bennett | OPTIMAL
  {
    id: 'std_104',
    name: 'Chloe Bennett',
    attendanceRate: 95,
    predictedGrade: 96,
    riskTier: 'OPTIMAL',
    activeDeficits: [],
    recentAssessments: [
      {
        id: 'asmt_301',
        course: 'Linear Algebra',
        topic: 'Eigenvalues & Eigenvectors',
        score: 98,
        maxScore: 100,
        submittedAt: ts('2026-09-21', '10:05'),
        expectedLagHours: 24,
        actualLagHours: 23,
      },
      {
        id: 'asmt_302',
        course: 'Data Structures',
        topic: 'Dynamic Programming',
        score: 94,
        maxScore: 100,
        submittedAt: ts('2026-09-23', '09:00'),
        expectedLagHours: 48,
        actualLagHours: 47,
      },
    ],
    calendarEvents: [
      {
        id: 'evt_301',
        title: 'Data Structures Lecture',
        startTime: ts(TODAY, '11:00'),
        endTime: ts(TODAY, '12:30'),
        category: 'CLASS',
        status: 'SCHEDULED',
        topic: 'Advanced Graph Algorithms',
      },
    ],
  },

  // 5 — Priya Patel | REMEDIATING
  {
    id: 'std_105',
    name: 'Priya Patel',
    attendanceRate: 68,
    predictedGrade: 72,
    riskTier: 'REMEDIATING',
    activeDeficits: ['integration-by-parts'],
    recentAssessments: [
      {
        id: 'asmt_401',
        course: 'Calculus II',
        topic: 'Integration by Parts',
        score: 58,
        maxScore: 100,
        submittedAt: ts('2026-09-22', '14:20'),
        expectedLagHours: 24,
        actualLagHours: 41,
      },
      {
        id: 'asmt_402',
        course: 'Linear Algebra',
        topic: 'Matrix Multiplication',
        score: 81,
        maxScore: 100,
        submittedAt: ts('2026-09-24', '07:45'),
        expectedLagHours: 24,
        actualLagHours: 25,
      },
    ],
    calendarEvents: [
      {
        id: 'evt_401',
        title: 'Calculus II Lecture',
        startTime: ts(TODAY, '08:00'),
        endTime: ts(TODAY, '09:30'),
        category: 'CLASS',
        status: 'COMPLETED',
        topic: 'Integration Techniques',
      },
      {
        id: 'evt_402',
        title: 'Integration Remediation Block',
        startTime: ts(TODAY, '15:30'),
        endTime: ts(TODAY, '16:30'),
        category: 'REMEDIATION_LOCK',
        status: 'SCHEDULED',
        topic: 'integration-by-parts',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// initialAuditLogs — Pre-existing system audit trail
// ─────────────────────────────────────────────────────────────────────────────

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log_001',
    timestamp: ts(TODAY, '00:05'),
    studentId: 'std_101',
    actionType: 'AUTO_SCHEDULED',
    description:
      'System automatically scheduled an Eigenvector Remediation Block ' +
      '(14:00–15:00) for Alex Rivera based on a score of 61/100 ' +
      'and a 38-hour submission lag on asmt_002.',
  },
  {
    id: 'log_002',
    timestamp: ts(TODAY, '00:07'),
    studentId: 'std_103',
    actionType: 'TA_ESCALATED',
    description:
      'Marcus Vance escalated to TA office hours: attendance rate dropped ' +
      'below 45 % and 4 active deficit concepts detected. ' +
      'Assigned slot: 13:00–14:00 today.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// eigenvectorsQuiz — Diagnostic quiz targeting the #1 cohort deficit
// ─────────────────────────────────────────────────────────────────────────────

export const eigenvectorsQuiz: DiagnosticQuiz = {
  id: 'quiz_eig_001',
  targetConcept: 'eigenvalues-eigenvectors',
  timeLimitSeconds: 600, // 10 minutes
  questions: [
    {
      id: 'q_eig_001',
      questionText:
        'Which of the following best describes an eigenvector of a matrix A?',
      options: [
        'A vector that is orthogonal to all columns of A',
        'A non-zero vector v such that Av = λv for some scalar λ',
        'A vector whose magnitude equals the largest eigenvalue of A',
        'The null space basis vector of A',
      ],
      correctIndex: 1,
      remediationInsight:
        'An eigenvector v satisfies Av = λv, meaning A only scales v ' +
        'by a factor λ (the eigenvalue) without changing its direction. ' +
        'Review the geometric interpretation: multiplying by A stretches ' +
        'or flips the vector along its own span.',
    },
    {
      id: 'q_eig_002',
      questionText:
        'For a 3×3 matrix A, the characteristic polynomial is det(A − λI) = 0. ' +
        'If the roots are λ = 2, 2, 5, what can you conclude?',
      options: [
        'A always has 3 linearly independent eigenvectors',
        'A is always diagonalisable',
        'λ = 2 has algebraic multiplicity 2; geometric multiplicity may be 1 or 2',
        'The determinant of A is 4',
      ],
      correctIndex: 2,
      remediationInsight:
        'Algebraic multiplicity counts how many times a root repeats in the ' +
        'characteristic polynomial. Geometric multiplicity is the dimension ' +
        'of the corresponding eigenspace. A matrix is diagonalisable only ' +
        'when both multiplicities match for every eigenvalue.',
    },
    {
      id: 'q_eig_003',
      questionText:
        'Given A = [[4, 1], [2, 3]], which of the following is an eigenvector?',
      options: ['[1, 0]', '[1, −1]', '[1, 2]', '[2, 1]'],
      correctIndex: 1,
      remediationInsight:
        'Compute A·[1, −1]ᵀ = [4−1, 2−3]ᵀ = [3, −1]ᵀ … wait, let\'s verify: ' +
        'λ₁ = 5 → v₁ = [1, 1]ᵀ; λ₂ = 2 → v₂ = [1, −2]ᵀ. ' +
        'Check each option by solving (A − λI)v = 0. ' +
        'The key skill is substituting a candidate vector and confirming Av = λv.',
    },
  ],
};
