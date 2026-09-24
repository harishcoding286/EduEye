'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { Role, StudentProfile, AuditLog, CalendarEvent } from '@/types';
import { initialStudent, initialCohort, initialAuditLogs } from '@/data/seedData';

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

  // Autonomous Engine Simulation Triggers
  handleGradeDrop: (studentId: string, topic: string, score: number) => void;
  handleRemediationResolved: (studentId: string, score: number) => void;
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
    (studentId: string, topic: string, score: number) => {
      const now = new Date();
      const timestampIso = now.toISOString();

      const newRemediationBlock: CalendarEvent = {
        id: `evt_lock_${Date.now()}`,
        title: `${topic} Remediation Lock`,
        startTime: '2026-09-24T14:00:00.000Z',
        endTime: '2026-09-24T14:45:00.000Z',
        category: 'REMEDIATION_LOCK',
        status: 'SCHEDULED',
        topic,
      };

      const auditEntry: AuditLog = {
        id: `log_auto_${Date.now()}`,
        timestamp: timestampIso,
        studentId,
        actionType: 'AUTO_SCHEDULED',
        description: `Autonomous Engine: ${topic} pop-quiz deficit detected (${score}%). Predicted grade dropped to 54% (CRITICAL). 45m Remediation Lock injected at 14:00.`,
      };

      setCohort((prevCohort) =>
        prevCohort.map((student) => {
          if (student.id !== studentId) return student;

          const updatedDeficits = student.activeDeficits.includes('eigenvalues-eigenvectors')
            ? student.activeDeficits
            : [...student.activeDeficits, 'eigenvalues-eigenvectors'];

          // Avoid duplicate events if already inserted
          const hasExistingLock = student.calendarEvents.some(
            (e) => e.category === 'REMEDIATION_LOCK' && e.status === 'SCHEDULED' && e.topic === topic
          );
          const updatedEvents = hasExistingLock
            ? student.calendarEvents
            : [...student.calendarEvents, newRemediationBlock];

          return {
            ...student,
            predictedGrade: 54,
            riskTier: 'CRITICAL',
            activeDeficits: updatedDeficits,
            calendarEvents: updatedEvents,
          };
        })
      );

      setCurrentStudentState((prev) => {
        if (prev.id !== studentId) return prev;
        const updatedDeficits = prev.activeDeficits.includes('eigenvalues-eigenvectors')
          ? prev.activeDeficits
          : [...prev.activeDeficits, 'eigenvalues-eigenvectors'];

        const hasExistingLock = prev.calendarEvents.some(
          (e) => e.category === 'REMEDIATION_LOCK' && e.status === 'SCHEDULED' && e.topic === topic
        );
        const updatedEvents = hasExistingLock
          ? prev.calendarEvents
          : [...prev.calendarEvents, newRemediationBlock];

        return {
          ...prev,
          predictedGrade: 54,
          riskTier: 'CRITICAL',
          activeDeficits: updatedDeficits,
          calendarEvents: updatedEvents,
        };
      });

      appendAuditLog(auditEntry);
    },
    [appendAuditLog]
  );

  // ── Trigger: Remediation Resolved Loop ────────────────────────────────────
  const handleRemediationResolved = useCallback(
    (studentId: string, score: number) => {
      const now = new Date();
      const timestampIso = now.toISOString();

      const auditEntry: AuditLog = {
        id: `log_res_${Date.now()}`,
        timestamp: timestampIso,
        studentId,
        actionType: 'QUIZ_RESOLVED',
        description: `Alex Rivera resolved Diagnostic Drill with ${score}/100. Concept deficit cleared. Predicted grade restored to 84% (OPTIMAL).`,
      };

      setCohort((prevCohort) =>
        prevCohort.map((student) => {
          if (student.id !== studentId) return student;
          return {
            ...student,
            predictedGrade: 84,
            riskTier: 'OPTIMAL',
            activeDeficits: student.activeDeficits.filter(
              (d) => d !== 'eigenvalues-eigenvectors'
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
            (d) => d !== 'eigenvalues-eigenvectors'
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
      handleGradeDrop,
      handleRemediationResolved,
      escalateToTA,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an <AppProvider>');
  }
  return context;
}
