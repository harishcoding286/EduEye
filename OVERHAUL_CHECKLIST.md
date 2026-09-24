# 📋 EduEye — Project Overhaul & Enhancement Roadmap

> **Track:** FlowBuild (Intelligent Automation, Adaptive Systems, Cognitive Scheduling, Process Reinvention)  
> **Status:** Baseline Demo Operational (Modules 0–3 Merged)  
> **Last Updated:** 2026-09-24  

---

## 📊 Overhaul Progress Summary

| Category | Priority | Progress | Status |
|:---|:---:|:---:|:---:|
| **1. Generative AI Diagnostic Engine** | High | `0 / 4` | ⏳ Pending |
| **2. Cognitive Scheduling Engine 2.0** | Critical | `0 / 5` | ⏳ Pending |
| **3. Faculty Cockpit & Analytics** | High | `0 / 5` | ⏳ Pending |
| **4. UI/UX Motion & Visual Polish** | Medium | `0 / 5` | ⏳ Pending |
| **5. LMS Ingestion & Event Pipeline** | Medium | `0 / 4` | ⏳ Pending |
| **6. Production Hardening & Persistence** | Low | `0 / 3` | ⏳ Pending |

---

## 1. 🤖 Generative AI Diagnostic Engine (Gemini Integration)
*Transform static mock quizzes into dynamically synthesized prerequisite micro-drills.*

- [ ] **1.1 Gemini API Client Setup**
  - Install and configure official `@google/genai` SDK in Next.js Server Actions / API routes.
  - Set up environment variables (`GEMINI_API_KEY`) with graceful fallback to offline seed quizzes if API key is absent.
- [ ] **1.2 Dynamic Diagnostic Micro-Drill Generator**
  - Prompt engineering pipeline: ingest student's specific deficit topic (e.g. *"Eigenvalues & Eigenvectors"*) and past submission errors.
  - Enforce structured JSON schema output: 3 multiple-choice questions, exactly 4 choices each, zero-based `correctIndex`, and actionable `remediationInsight`.
- [ ] **1.3 Adaptive Post-Quiz Remediation Explainer**
  - When a student answers incorrectly, generate a contextual 1-paragraph mini-explanation explaining the specific conceptual pitfall.
- [ ] **1.4 AI Study Recommendation Summary**
  - Generate an individualized 2-sentence executive summary on the Student Dashboard explaining *why* the cognitive block was placed and how to prepare.

---

## 2. 🧠 Cognitive Scheduling Engine 2.0 (Chronobiology & Knowledge Graph)
*Elevate basic timegrid slot finding into a realistic, intelligent life-scheduler.*

- [ ] **2.1 Circadian Rhythm & Cognitive Energy Model**
  - Incorporate daily mental alertness curves:
    - Peak cognitive alertness (09:30–11:30 & 14:00–16:00).
    - Postprandial dip (13:00–14:00) and late-afternoon fatigue drop (>17:30).
  - Score candidate study slots based on concept difficulty vs. student chronotype.
- [ ] **2.2 Dynamic Conflict Re-negotiation & Schedule Diff**
  - If a prime focus slot collides with a flexible `PERSONAL` event (e.g. gym, study group), allow the engine to automatically propose a non-destructive reschedule.
  - Display a visual *"Schedule Diff Preview"* banner:
    > *"Algorithms Study Group shifted from 17:00 → 18:30 to lock in critical 14:00 Eigenvalues Focus Sprint."*
- [ ] **2.3 Prerequisite Concept Knowledge Graph**
  - Build a directed acyclic graph (DAG) of math/CS topics:
    `Matrix Multiplication` ➔ `Determinants` ➔ `Vector Spaces` ➔ `Eigenvalues & Eigenvectors` ➔ `SVD`.
  - When an Eigenvalues quiz fails, recursively inspect earlier prerequisites to target the true root-cause deficit.
- [ ] **2.4 Multi-Day Schedule Planning Horizon**
  - Expand scheduler lookahead from single-day to a 7-day rolling window for upcoming high-stakes midterms/finals.
- [ ] **2.5 Calendar Sync & Export**
  - One-click `.ics` calendar file download for Google Calendar, Apple Calendar, and Outlook.

---

## 3. 👩‍🏫 Faculty Cockpit & Cohort Analytics Deep-Dive
*Empower professors and TAs with institutional-grade proactive triage.*

- [ ] **3.1 Student Telemetry Inspector Drawer (Slide-Over Panel)**
  - Clicking any student in `StudentRosterTable` opens a detailed slide-out inspector:
    - Complete assessment timeline with submission lag trends.
    - Active prerequisite gaps with mastery probability indicators.
    - Historical automated interventions log for that specific student.
- [ ] **3.2 Cohort Concept Deficit Heatmap**
  - Visual matrix showing which concepts have the highest failure rates across the entire enrolled roster.
  - Identifies class-wide lecture bottlenecks before exams.
- [ ] **3.3 One-Click TA Clinic Dispatch**
  - When $\ge 3$ students share the same deficit (e.g., Eigenvalues), enable the teacher to launch a *"Group Remediation Clinic"* that simultaneously books slots on all affected calendars.
- [ ] **3.4 Grade Distribution & Risk Scatter Plot**
  - Interactive distribution chart (Attendance Rate vs. Predicted Grade) with color-coded risk clusters.
- [ ] **3.5 Audit Trail Filtering & CSV Export**
  - Filter audit logs by action type (`AUTO_SCHEDULED`, `QUIZ_RESOLVED`, `TA_ESCALATED`).
  - Export audit logs to CSV for compliance reporting.

---

## 4. 🎨 UI/UX Motion & Visual Polish (Vercel-Grade Design)
*Create an immersive, visually captivating experience for demo presentations.*

- [ ] **4.1 Fluid Layout & Gauge Animations**
  - Smooth animated transitions for the Predicted Grade gauge when dropping from 84% $\to$ 54% and recovering back to 84%.
- [ ] **4.2 Visual Calendar Block Locking Animation**
  - Pulsating amber glow and ripple effect when the cognitive engine locks a new remediation block into the schedule.
- [ ] **4.3 Micro-Drill Mastery Celebration**
  - Confetti particle burst and sound effects toggle when scoring 3/3 on diagnostic drills.
- [ ] **4.4 Multi-View Calendar Component**
  - Day agenda view vs. 5-day week view toggle with clean hourly grid lines (08:00–20:00).
- [ ] **4.5 Refined Dark Mode / Theme System**
  - Ensure consistent, contrast-compliant styling across both Student and Faculty views.

---

## 5. ⚡ LMS Ingestion Pipeline & Webhook Simulator
*Demonstrate realistic Canvas / Blackboard closed-loop integration.*

- [ ] **5.1 Next.js App Router Ingestion Route (`/api/telemetry/ingest`)**
  - Webhook endpoint that receives mock Canvas/Blackboard grade payloads:
    `{ studentId, courseId, assignmentName, topic, score, maxScore, submittedAt, lagHours }`.
- [ ] **5.2 Interactive LMS Webhook Dispatcher Modal**
  - A developer/judge modal to customize and dispatch mock LMS payloads with custom scores and topics.
- [ ] **5.3 Real-Time SSE (Server-Sent Events) Stream**
  - Live stream audit log updates across open tabs without full-page reloads.
- [ ] **5.4 Procrastination Index & Velocity Tracking**
  - Calculate submission lag acceleration: detect students whose submission lag is expanding over successive weeks.

---

## 6. 🛡️ Production Hardening & Persistence
*Ensure codebase reliability and deployment readiness.*

- [ ] **6.1 Persistent Local Storage / IndexedDB Sync**
  - Persist student calendar modifications and audit logs across browser refreshes.
- [ ] **6.2 Unit & Integration Test Suite**
  - Jest / Vitest tests for:
    - `findOptimalStudySlot`: verifying lunch protection, class collision avoidance, and early cutoff heuristics.
    - `evaluateStudentRisk`: verifying lag penalties and risk tier boundaries.
- [ ] **6.3 Deployment to Vercel**
  - Production build verification and live public demo deployment.

---

## 🎯 Recommended Next Immediate Step

> **Focus Track:** **Track 1 (Gemini AI Dynamic Quiz Generation)** OR **Track 3.1 (Student Inspector Drawer in Faculty Cockpit)**.  
> Both deliver immediate visual and architectural "wow factor" for judges and reviewers.
