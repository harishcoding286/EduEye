# EduEye — Person B Handoff & Full Context Document
> **Created by:** Person A's Antigravity instance — 2026-09-24  
> **Purpose:** Give Person B (and their Antigravity AI) complete context to immediately clone, branch, and begin building without any synchronisation calls.  
> **Copy this entire file** and paste it as your first message to Antigravity on your machine.

---

## 1. Project Vision — The One-Paragraph Pitch

EduEye is a **closed-loop autonomous student remediation engine** built on Next.js 16/App Router. Unlike passive LMS dashboards (Canvas, Blackboard) that merely plot risk charts for an advisor to read days later, EduEye *acts*: it continuously ingests student assessment telemetry, isolates the exact prerequisite concept deficit (e.g. "Eigenvalues" — not generic "Calculus"), autonomously rewires the student's personal calendar by inserting a focus block in the next available window (avoiding lunch and existing classes), then dispatches a 3-question AI-generated diagnostic micro-drill. When the student resolves it, the block turns green, the risk score recovers, and the faculty audit log records the fully automated intervention — zero advisor overhead.

---

## 2. The 60-Second Demo Loop (What We Are Building Toward)

```
① Default state
   Student Alex Rivera → predictedGrade: 84 → riskTier: "OPTIMAL"
   Normal class schedule visible on calendar

② Trigger (mock quiz drop)
   New pop-quiz: 38/100 on "Eigenvalues"

③ Autonomous engine fires (no human input)
   - Risk engine: predictedGrade drops to 54 → riskTier: "CRITICAL"
   - Cognitive scheduler: finds open 45-min window at 14:00
   - Calendar: inserts pulsating amber REMEDIATION_LOCK block
   - Audit log: appends AUTO_SCHEDULED entry

④ Student resolves
   - Clicks amber block → DiagnosticDrillModal opens
   - Completes 3-question eigenvectors quiz → 3/3 correct
   - Block turns emerald green → status: "COMPLETED"
   - Risk score recovers → riskTier: "OPTIMAL"
   - Audit log: appends QUIZ_RESOLVED entry

⑤ Faculty view (Person B's work)
   - Teacher dashboard shows cohort of 5 students
   - Audit feed auto-refreshes showing the log entries
   - Risk tiers colour-coded: green/amber/red badges per student
```

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js App Router (v16.3.6) |
| Language | TypeScript 5 — `strict: true`, zero `any` tolerance |
| Styling | Tailwind CSS v3 |
| State | React Context (Person B builds the provider) |
| Path alias | `@/*` → `./src/*` |
| Package manager | npm |
| Linting | ESLint (next config) |

---

## 4. Repository

```
GitHub:  https://github.com/harishcoding286/EduEye.git
Branch model:
  main                  → stable Module 0 contract (LIVE, already pushed)
  feat/student-engine   → Person A's working branch (DO NOT TOUCH)
  feat/teacher-cockpit  → YOUR branch (create this — see §9)
```

---

## 5. Current Repository State (What Is Already on `main`)

`main` has exactly **11 files** in one atomic commit `1d1c941`:

```
.gitignore
package.json
package-lock.json
tsconfig.json
src/types/index.ts                  ← THE data contract (read carefully)
src/data/seedData.ts                ← THE mock state (read carefully)
src/engine/.gitkeep                 ← Person A's directory (leave alone)
src/components/student/.gitkeep    ← Person A's directory (leave alone)
src/components/modals/.gitkeep     ← Person A's directory (leave alone)
src/components/teacher/.gitkeep    ← YOUR directory 🟢
src/components/layout/.gitkeep     ← YOUR directory 🟢
```

---

## 6. Complete `src/types/index.ts` — The Immutable Data Contract

> **IMPORTANT:** Never modify this file. All your components import from it.
> If you believe a field is missing, raise an RFC with Person A — do not edit unilaterally.

```typescript
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
  id: string;
  course: string;
  topic: string;
  score: number;
  maxScore: number;
  submittedAt: string;       // ISO-8601
  expectedLagHours: number;
  actualLagHours: number;
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export type CalendarCategory = 'CLASS' | 'PERSONAL' | 'REMEDIATION_LOCK';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;         // ISO-8601
  endTime: string;           // ISO-8601
  category: CalendarCategory;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  topic?: string;
}

// ── Diagnostics ───────────────────────────────────────────────────────────────

export interface DiagnosticQuestion {
  id: string;
  questionText: string;
  options: string[];         // always 4 items
  correctIndex: number;      // zero-based
  remediationInsight: string;
}

export interface DiagnosticQuiz {
  id: string;
  targetConcept: string;
  questions: DiagnosticQuestion[];
  timeLimitSeconds: number;
}

// ── Student Intelligence ───────────────────────────────────────────────────────

export type RiskTier = 'OPTIMAL' | 'REMEDIATING' | 'CRITICAL';

export interface StudentProfile {
  id: string;
  name: string;
  attendanceRate: number;    // 0–100
  predictedGrade: number;    // 0–100
  riskTier: RiskTier;
  activeDeficits: string[];  // concept slugs e.g. "eigenvalues-eigenvectors"
  recentAssessments: Assessment[];
  calendarEvents: CalendarEvent[];
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  timestamp: string;         // ISO-8601
  studentId: string;
  actionType: 'AUTO_SCHEDULED' | 'QUIZ_RESOLVED' | 'TA_ESCALATED';
  description: string;
}
```

---

## 7. Complete `src/data/seedData.ts` — The Pre-Seeded Mock State

All dates pinned to `2026-09-24`. Never mutate — `structuredClone()` before use.

The file exports **4 named constants**:

| Export | Type | Description |
|---|---|---|
| `initialStudent` | `StudentProfile` | Alex Rivera — the primary student persona |
| `initialCohort` | `StudentProfile[]` | All 5 students including Alex |
| `initialAuditLogs` | `AuditLog[]` | 2 pre-seeded system action entries |
| `eigenvectorsQuiz` | `DiagnosticQuiz` | 3-question diagnostic (Person A uses; you display its resolution in audit logs) |

### Cohort at a Glance

| ID | Name | Grade | Attendance | Risk | Active Deficits |
|---|---|---|---|---|---|
| std_101 | Alex Rivera | 84 | 74% | `OPTIMAL` | eigenvalues-eigenvectors |
| std_102 | Jordan Lee | 67 | 61% | `REMEDIATING` | vector-spaces, eigenvalues-eigenvectors |
| std_103 | Marcus Vance | 51 | 42% | `CRITICAL` | matrix-multiplication, vector-spaces, eigenvalues-eigenvectors, determinants |
| std_104 | Chloe Bennett | 96 | 95% | `OPTIMAL` | *(none)* |
| std_105 | Priya Patel | 72 | 68% | `REMEDIATING` | integration-by-parts |

### Pre-seeded Audit Logs

```
log_001  2026-09-24T00:05  std_101  AUTO_SCHEDULED
  "System automatically scheduled an Eigenvector Remediation Block
   (14:00–15:00) for Alex Rivera based on a score of 61/100
   and a 38-hour submission lag on asmt_002."

log_002  2026-09-24T00:07  std_103  TA_ESCALATED
  "Marcus Vance escalated to TA office hours: attendance rate dropped
   below 45% and 4 active deficit concepts detected.
   Assigned slot: 13:00–14:00 today."
```

Standard import pattern for your components:
```typescript
import type { StudentProfile, AuditLog } from '@/types';
import { initialCohort, initialAuditLogs } from '@/data/seedData';
```

---

## 8. `package.json` & `tsconfig.json` (for reference)

### package.json
```json
{
  "name": "edueye",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^16.3.6",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "^16.3.6",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 9. Person B's Machine Setup (Run This First)

```bash
# 1. Clone the repo
git clone https://github.com/harishcoding286/EduEye.git
cd EduEye

# 2. Install dependencies
npm install

# 3. Verify type safety (should exit 0 with zero output)
npm run type-check

# 4. Create YOUR isolated feature branch
git checkout -b feat/teacher-cockpit

# 5. Confirm your branch
git branch --show-current
# → feat/teacher-cockpit

# 6. Start the dev server
npm run dev
# → http://localhost:3000
```

---

## 10. Ownership Boundaries — Absolute Rules

### 🟢 Directories You Own (modify freely)
```
src/context/                       ← CREATE this — shared React Context store
src/components/teacher/            ← All teacher-facing UI components
src/components/layout/             ← Top navigation bar
```

### 🔴 Directories You Must NEVER Touch
```
src/engine/                        ← Person A: Cognitive Scheduling Engine
src/components/student/            ← Person A: Student calendar + risk views
src/components/modals/             ← Person A: Diagnostic Drill Modal
src/types/index.ts                 ← Frozen contract (RFC required)
src/data/seedData.ts               ← Frozen seed data (RFC required)
```

---

## 11. What You Need to Build — Module 1 Deliverables

### 11a. `src/context/AppContext.tsx` ← BUILD THIS FIRST

This is the **most critical deliverable**. Person A's engine writes to it; your UI reads from it. Get this right and both sides can work in parallel without ever calling each other.

```typescript
'use client';

import React, { createContext, useContext, useState } from 'react';
import type { StudentProfile, AuditLog } from '@/types';
import { initialStudent, initialCohort, initialAuditLogs } from '@/data/seedData';

// ── Context shape ─────────────────────────────────────────────────────────────
// Do NOT change field names without syncing with Person A.

interface AppContextValue {
  // The student currently in focus (Person A's engine updates this live)
  activeStudent: StudentProfile;
  setActiveStudent: (s: StudentProfile) => void;

  // Full 5-student cohort (your CohortRiskTable reads this)
  cohort: StudentProfile[];
  setCohort: (c: StudentProfile[]) => void;

  // Audit trail (Person A appends; your AuditFeed re-renders reactively)
  auditLogs: AuditLog[];
  appendAuditLog: (log: AuditLog) => void;

  // Drill modal gate (Person A sets true when block is clicked)
  isDrillModalOpen: boolean;
  setIsDrillModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeStudent, setActiveStudent] = useState<StudentProfile>(
    structuredClone(initialStudent)
  );
  const [cohort, setCohort] = useState<StudentProfile[]>(
    structuredClone(initialCohort)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(
    structuredClone(initialAuditLogs)
  );
  const [isDrillModalOpen, setIsDrillModalOpen] = useState(false);

  const appendAuditLog = (log: AuditLog) =>
    setAuditLogs(prev => [log, ...prev]); // newest first

  return (
    <AppContext.Provider value={{
      activeStudent, setActiveStudent,
      cohort, setCohort,
      auditLogs, appendAuditLog,
      isDrillModalOpen, setIsDrillModalOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}
```

Wrap the root layout (`src/app/layout.tsx`) with `<AppProvider>`.

---

### 11b. `src/components/layout/Navbar.tsx`

Static top navigation bar. Required elements:
- **Left:** EduEye wordmark / logo
- **Right:** `"Dr. Sarah Chen"` name + `TEACHER` role badge

```typescript
interface NavbarProps {
  userName?: string;   // default: "Dr. Sarah Chen"
  role?: import('@/types').Role;  // default: "TEACHER"
}
```

Styling guide:
```
bg-slate-900 text-white h-16 px-6
Logo: text-white font-bold text-xl tracking-tight
Role badge: bg-indigo-600 text-white text-xs px-2 py-1 rounded-full
```

---

### 11c. `src/components/teacher/CohortRiskTable.tsx`

Renders all 5 students from `cohort` (via context) in a styled table.

**Required columns:**

| Column | Colour logic |
|---|---|
| Name | plain text |
| Predicted Grade | ≥80 → `text-emerald-600`, 60–79 → `text-amber-600`, <60 → `text-red-600` |
| Attendance % | same thresholds as above |
| Risk Tier | badge (see design tokens §13) |
| Active Deficits | first 2 slugs + "…" if more |

```typescript
interface CohortRiskTableProps {
  cohort: StudentProfile[];
  onSelectStudent: (id: string) => void;
}
```

Each row should be `hover:bg-slate-50 cursor-pointer` and call `onSelectStudent` on click.

---

### 11d. `src/components/teacher/AuditFeed.tsx`

Live log of all engine actions. Reads `auditLogs` from context. Display newest-first.

Each entry row must show:
- Time — `format(new Date(log.timestamp), 'HH:mm')` (use `new Date().toLocaleTimeString()` — no extra libs needed)
- Student name — look up from `cohort` by `studentId`
- Action badge — colour per `actionType` (see §13)
- Description — max 2 lines, `line-clamp-2`

```typescript
interface AuditFeedProps {
  logs: AuditLog[];
  cohort: StudentProfile[];
}
```

---

### 11e. `src/components/teacher/TeacherDashboard.tsx`

Top-level composition component for the teacher's view. Pulls everything from `useAppContext()`.

Layout suggestion:
```
┌──────────────────────────────────────────────────┐
│  Navbar                                           │
├──────────────────────────────┬───────────────────┤
│                              │                   │
│   CohortRiskTable            │   AuditFeed       │
│   (flex-1)                   │   (w-80)          │
│                              │                   │
└──────────────────────────────┴───────────────────┘
```

No need to wire `onSelectStudent` to anything complex for demo — a `console.log` or a simple `alert` showing the student name is fine.

---

## 12. The Decoupling Contract — How Person A Calls Your Context

When Person A's cognitive scheduler fires, it will call these context setters (which you've built). Your UI re-renders automatically with no additional wiring needed.

```typescript
// ── After inserting a REMEDIATION_LOCK block ──────────────────────────────
setActiveStudent({
  ...activeStudent,
  riskTier: 'CRITICAL',
  predictedGrade: 54,
  calendarEvents: [...activeStudent.calendarEvents, newRemediationBlock],
});
appendAuditLog({
  id: `log_auto_${Date.now()}`,
  timestamp: new Date().toISOString(),
  studentId: 'std_101',
  actionType: 'AUTO_SCHEDULED',
  description: 'System scheduled Eigenvector Remediation Block (14:00–14:45) for Alex Rivera.',
});

// ── After quiz completion (3/3) ────────────────────────────────────────────
setActiveStudent({
  ...activeStudent,
  riskTier: 'OPTIMAL',
  predictedGrade: 84,
  calendarEvents: activeStudent.calendarEvents.map(e =>
    e.category === 'REMEDIATION_LOCK' ? { ...e, status: 'COMPLETED' } : e
  ),
});
appendAuditLog({
  id: `log_resolved_${Date.now()}`,
  timestamp: new Date().toISOString(),
  studentId: 'std_101',
  actionType: 'QUIZ_RESOLVED',
  description: 'Alex Rivera completed eigenvectors diagnostic: 3/3 correct. Risk recovered to OPTIMAL.',
});
```

---

## 13. Visual Design Tokens (Tailwind)

| Concept | Classes |
|---|---|
| `OPTIMAL` / Resolved | `bg-emerald-500` · `text-emerald-700` · `border-emerald-400` |
| `REMEDIATING` | `bg-amber-400` · `text-amber-700` · `border-amber-400` |
| `CRITICAL` | `bg-red-500` · `text-red-700` · `border-red-400` · `animate-pulse` |
| `AUTO_SCHEDULED` badge | `bg-blue-100 text-blue-800 font-medium` |
| `QUIZ_RESOLVED` badge | `bg-emerald-100 text-emerald-800 font-medium` |
| `TA_ESCALATED` badge | `bg-red-100 text-red-800 font-medium` |
| Navbar | `bg-slate-900 text-white` |
| Page background | `bg-slate-50 min-h-screen` |
| Card / panel | `bg-white rounded-2xl shadow-sm border border-slate-200 p-6` |
| Table header row | `bg-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide` |
| Table body row | `border-b border-slate-100 text-sm text-slate-700` |

---

## 14. Git Workflow for Person B

```bash
# Daily commit cycle
git add src/context/ src/components/teacher/ src/components/layout/
git commit -m "feat(teacher): describe what you built"
git push origin feat/teacher-cockpit

# Stay in sync with main (do this daily)
git fetch origin
git rebase origin/main

# When Module 1 is complete — open a PR on GitHub:
#   feat/teacher-cockpit → main
# Title: "feat(teacher): Module 1 – Faculty Cockpit and AppContext"
```

> **NEVER** `git push origin main` directly. All changes go through PRs reviewed by Person A.

---

## 15. Module 1 Completion Checklist for Person B

```
[ ] git clone https://github.com/harishcoding286/EduEye.git
[ ] cd EduEye && npm install
[ ] npm run type-check  →  exit 0, zero errors
[ ] git checkout -b feat/teacher-cockpit

[ ] src/context/AppContext.tsx          — provider + hook + correct field names
[ ] src/components/layout/Navbar.tsx   — static top bar with correct props
[ ] src/components/teacher/CohortRiskTable.tsx — 5-student colour-coded table
[ ] src/components/teacher/AuditFeed.tsx       — live feed, newest-first
[ ] src/components/teacher/TeacherDashboard.tsx — parent composition

[ ] npm run type-check  →  exit 0 after your changes
[ ] git push origin feat/teacher-cockpit
[ ] Notify Person A: "AppContext is live on feat/teacher-cockpit — field names locked"
    (Person A will then wire their engine to your context)
```

---

## 16. Sanity Check Prompt for Your Antigravity

After setup, paste this to your Antigravity instance as a verification task:

> "Verify that `src/types/index.ts` exports exactly these 10 symbols with zero TypeScript errors: `Role`, `User`, `Assessment`, `CalendarCategory`, `CalendarEvent`, `DiagnosticQuestion`, `DiagnosticQuiz`, `RiskTier`, `StudentProfile`, `AuditLog`. Run `npm run type-check` and confirm exit 0. Then confirm the directory structure matches: `src/engine/`, `src/components/student/`, `src/components/teacher/`, `src/components/modals/`, `src/components/layout/`. Then begin building `src/context/AppContext.tsx` per the specification in the PERSON_B_CONTEXT.md handoff."

---

*Document generated by Antigravity on Person A's machine*  
*Date: 2026-09-24T16:29:44+05:30*  
*Stable commit on `main`: `1d1c941` — "feat(core): initialize Module 0 types and seed data contract"*  
*GitHub: https://github.com/harishcoding286/EduEye*
