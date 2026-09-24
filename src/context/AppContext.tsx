'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { Role, StudentProfile, AuditLog, CalendarEvent } from '@/types';
import { initialStudent, initialCohort, initialAuditLogs } from '@/data/seedData';
import { findOptimalStudySlot } from '@/engine/cognitiveScheduler';

export interface AppContextValue {
  // Role switching
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  toggleRole: () => void;

  // Active student in focus (Alex Rivera by default)
  currentStudent: StudentProfile;
  setCurrentStudent: (student: StudentProfile | ((prev: StudentProfile) => StudentProfile)) => void;
  // Interoperability alias for Person A
  activeStudent: StudentProfile;
  setActiveStudent: (student: StudentProfile | ((prev: StudentProfile) => StudentProfile)) => void;

  // Cohort state
  cohort: StudentProfile[];
  setCohort: (cohort: StudentProfile[] | ((prev: StudentProfile[]) => StudentProfile[])) => void;

  // Audit trail
  auditLogs: AuditLog[];
  setAuditLogs: (logs: AuditLog[] | ((prev: AuditLog[]) => AuditLog[])) => void;
  appendAuditLog: (log: AuditLog) => void;

  // Modal state
  isDrillModalOpen: boolean;
  setIsDrillModalOpen: (open: boolean) => void;

  // Engine loading state
  isAnalyzingLoad: boolean;
  setIsAnalyzingLoad: (isAnalyzing: boolean) => void;

  // Autonomous Engine Simulation Triggers
  handleGradeDrop: (studentId?: string, topic?: string, score?: number) => Promise<void>;
  handleRemediationResolved: (studentId?: string, score?: number) => void;
  escalateToTA: (studentId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>('STUDENT');
  const [currentStudent, setCurrentStudentState] = useState<StudentProfile>(() =>
    structuredClone(initialStudent)
  );
  const [cohort, setCohort] = useState<StudentProfile[]>(() =>
    structuredClone(initialCohort)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    structuredClone(initialAuditLogs)
  );
  const [isDrillModalOpen, setIsDrillModalOpen] = useState(false);
  const [isAnalyzingLoad, setIsAnalyzingLoad] = useState(false);

  // Synchronized student state updater ensuring cohort and active student stay in sync
  const setCurrentStudent = useCallback(
    (updater: StudentProfile | ((prev: StudentProfile) => StudentProfile)) => {
      setCurrentStudentState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        setCohort((prevCohort) =>
          prevCohort.map((s) => (s.id === next.id ? next : s))
        );
        return next;
      });
    },
    []
  );

  const toggleRole = useCallback(() => {
    setCurrentRole((prev) => (prev === 'STUDENT' ? 'TEACHER' : 'STUDENT'));
  }, []);

  const appendAuditLog = useCallback((log: AuditLog) => {
    setAuditLogs((prev) => [log, ...prev]);
  }, []);

  // ── Trigger: Grade Drop / Autonomous Scheduling Loop ───────────────────────
  const handleGradeDrop = useCallback(
    async (studentId: string = 'std_101', topic: string = 'Eigenvectors', score: number = 38) => {
      // 1. Trigger 400ms loading overlay
      setIsAnalyzingLoad(true);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setIsAnalyzingLoad(false);

      const now = new Date();
      const timestampIso = now.toISOString();

      // 2. Locate target student and run cognitive scheduler
      setCurrentStudentState((prev) => {
        // Run cognitive scheduler to find the optimal 45m continuous focus slot
        const slot = findOptimalStudySlot(prev.calendarEvents, 45);

        const newRemediationBlock: CalendarEvent = {
          id: `evt_lock_${Date.now()}`,
          title: `${topic} Remediation Lock`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          category: 'REMEDIATION_LOCK',
          status: 'SCHEDULED',
          topic,
        };

        const updatedDeficits = prev.activeDeficits.includes('eigenvalues-eigenvectors')
          ? prev.activeDeficits
          : [...prev.activeDeficits, 'eigenvalues-eigenvectors'];

        // Remove any prior duplicate locks for this topic
        const filteredEvents = prev.calendarEvents.filter(
          (e) => !(e.category === 'REMEDIATION_LOCK' && e.status === 'SCHEDULED' && e.topic === topic)
        );

        const updatedStudent: StudentProfile = {
          ...prev,
          predictedGrade: 54,
          riskTier: 'CRITICAL',
          activeDeficits: updatedDeficits,
          recentAssessments: [
            ...prev.recentAssessments,
            {
              id: `asmt_drop_${Date.now()}`,
              course: 'Linear Algebra',
              topic: 'Eigenvalues & Eigenvectors',
              score,
              maxScore: 100,
              submittedAt: timestampIso,
              expectedLagHours: 24,
              actualLagHours: 48,
            },
          ],
          calendarEvents: [...filteredEvents, newRemediationBlock],
        };

        // Also update cohort
        setCohort((prevCohort) =>
          prevCohort.map((s) => (s.id === studentId ? updatedStudent : s))
        );

        return updatedStudent;
      });

      // 3. Log automated intervention to audit feed
      const auditEntry: AuditLog = {
        id: `log_auto_${Date.now()}`,
        timestamp: timestampIso,
        studentId,
        actionType: 'AUTO_SCHEDULED',
        description: `Autonomous Engine: ${topic} pop-quiz deficit detected (${score}%). Predicted grade dropped from 84% to 54% (CRITICAL). 45m Remediation Lock injected at 14:00 (avoiding classes & lunch).`,
      };

      appendAuditLog(auditEntry);
    },
    [appendAuditLog]
  );

  // ── Trigger: Remediation Resolved Loop ────────────────────────────────────
  const handleRemediationResolved = useCallback(
    (studentId: string = 'std_101', score: number = 3) => {
      const now = new Date();
      const timestampIso = now.toISOString();

      const scoreDisplay = score <= 3 ? `${score}/3` : `${score}%`;

      const auditEntry: AuditLog = {
        id: `log_res_${Date.now()}`,
        timestamp: timestampIso,
        studentId,
        actionType: 'QUIZ_RESOLVED',
        description: `Alex Rivera resolved Diagnostic Drill (${scoreDisplay} correct). Concept deficit cleared. Predicted grade restored to 84% (OPTIMAL).`,
      };

      setCohort((prevCohort) =>
        prevCohort.map((student) => {
          if (student.id !== studentId) return student;
          return {
            ...student,
            predictedGrade: 84,
            riskTier: 'OPTIMAL',
            activeDeficits: student.activeDeficits.filter(
              (d) => d !== 'eigenvalues-eigenvectors' && d !== 'Eigenvectors'
            ),
            calendarEvents: student.calendarEvents.map((evt) =>
              evt.category === 'REMEDIATION_LOCK'
                ? { ...evt, status: 'COMPLETED' }
                : evt
            ),
          };
        })
      );

      setCurrentStudentState((prev) => {
        if (prev.id !== studentId) return prev;
        return {
          ...prev,
          predictedGrade: 84,
          riskTier: 'OPTIMAL',
          activeDeficits: prev.activeDeficits.filter(
            (d) => d !== 'eigenvalues-eigenvectors' && d !== 'Eigenvectors'
          ),
          calendarEvents: prev.calendarEvents.map((evt) =>
            evt.category === 'REMEDIATION_LOCK'
              ? { ...evt, status: 'COMPLETED' }
              : evt
          ),
        };
      });

      appendAuditLog(auditEntry);
    },
    [appendAuditLog]
  );

  // ── Action: TA Escalation ──────────────────────────────────────────────────
  const escalateToTA = useCallback(
    (studentId: string) => {
      const now = new Date();
      const timestampIso = now.toISOString();

      const target = cohort.find((s) => s.id === studentId) || currentStudent;

      const taEvent: CalendarEvent = {
        id: `evt_ta_${Date.now()}`,
        title: 'TA 1-on-1 Office Hours Escalation',
        startTime: '2026-09-24T13:00:00.000Z',
        endTime: '2026-09-24T14:00:00.000Z',
        category: 'REMEDIATION_LOCK',
        status: 'SCHEDULED',
        topic: 'Prerequisite Triage & Mentorship',
      };

      const auditEntry: AuditLog = {
        id: `log_ta_${Date.now()}`,
        timestamp: timestampIso,
        studentId,
        actionType: 'TA_ESCALATED',
        description: `Faculty Advisor dispatched direct TA intervention invite for ${target.name}. Dedicated focus session locked to calendar.`,
      };

      setCohort((prevCohort) =>
        prevCohort.map((s) =>
          s.id === studentId
            ? { ...s, calendarEvents: [...s.calendarEvents, taEvent] }
            : s
        )
      );

      setCurrentStudentState((prev) =>
        prev.id === studentId
          ? { ...prev, calendarEvents: [...prev.calendarEvents, taEvent] }
          : prev
      );

      appendAuditLog(auditEntry);
    },
    [cohort, currentStudent, appendAuditLog]
  );

  const contextValue = useMemo<AppContextValue>(
    () => ({
      currentRole,
      setCurrentRole,
      toggleRole,

      currentStudent,
      setCurrentStudent,
      activeStudent: currentStudent,
      setActiveStudent: setCurrentStudent,

      cohort,
      setCohort,

      auditLogs,
      setAuditLogs,
      appendAuditLog,

      isDrillModalOpen,
      setIsDrillModalOpen,

      isAnalyzingLoad,
      setIsAnalyzingLoad,

      handleGradeDrop,
      handleRemediationResolved,
      escalateToTA,
    }),
    [
      currentRole,
      toggleRole,
      currentStudent,
      setCurrentStudent,
      cohort,
      auditLogs,
      appendAuditLog,
      isDrillModalOpen,
      isAnalyzingLoad,
      handleGradeDrop,
      handleRemediationResolved,
      escalateToTA,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}

      {/* Global 400ms Cognitive Analysis Loading Overlay */}
      {isAnalyzingLoad && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md text-white animate-in fade-in duration-150">
          <div className="flex items-center gap-3.5 p-6 bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold tracking-wide text-cyan-300">
              EduEye Engine analyzing cognitive load &amp; LMS signal...
            </span>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an <AppProvider>');
  }
  return context;
}
