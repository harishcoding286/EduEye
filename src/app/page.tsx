'use client';

import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { StudentPortal } from '@/components/student/StudentPortal';
import { TeacherPortal } from '@/components/teacher/TeacherPortal';
import { findOptimalStudySlot } from '@/engine/cognitiveScheduler';

export default function HomePage() {
  const {
    currentRole,
    currentStudent,
    setCurrentStudent,
    handleRemediationResolved,
  } = useAppContext();

  // Faculty / Course Director View: cohort KPIs, triage roster table, real-time audit feed
  if (currentRole === 'TEACHER') {
    return <TeacherPortal />;
  }

  // Undergrad Student View: telemetry gauge, attendance progress, interactive schedule, and micro-drill modal
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <StudentPortal
        currentStudent={currentStudent}
        profile={currentStudent}
        onProfileUpdate={setCurrentStudent}
        findOptimalSlot={findOptimalStudySlot}
        onRemediationResolved={(score) => handleRemediationResolved(currentStudent.id, score)}
      />
    </div>
  );
}
