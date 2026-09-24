'use client';

import React, { useState } from 'react';
import { CohortKPICards } from './CohortKPICards';
import { StudentRosterTable } from './StudentRosterTable';
import { AuditFeed } from './AuditFeed';
import { useAppContext } from '@/context/AppContext';

export function TeacherPortal() {
  const { currentStudent } = useAppContext();
  const [selectedStudentNotification, setSelectedStudentNotification] = useState<string | null>(null);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentNotification(`Focused Student: ${studentId}`);
    setTimeout(() => setSelectedStudentNotification(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-10 min-h-screen flex flex-col gap-8">
      {/* Cockpit Header Banner: Liquid Glass Material */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/65 backdrop-blur-2xl p-8 rounded-3xl border border-white/80 shadow-[0_16px_40px_-12px_rgba(0,120,255,0.08)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-3 py-0.5 rounded-full border border-blue-200/50">
              Faculty &amp; Advisor Cockpit
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Term 2026-Q3
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Linear Algebra &amp; Discrete Structures (MATH-204)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Course Director: <span className="font-semibold text-slate-700">Dr. Sarah Vance</span> • 
            Autonomous closed-loop student remediation active across all enrolled cohorts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3.5">
          <div className="px-4 py-2.5 rounded-2xl bg-white/80 border border-slate-200/70 text-xs shadow-sm">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
              Current Focus Student
            </span>
            <span className="font-extrabold text-slate-900">
              {currentStudent.name} ({currentStudent.predictedGrade}% predicted)
            </span>
          </div>

          <div className="px-3.5 py-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            Autonomous Schedulers Live
          </div>
        </div>
      </div>

      {/* Selected Student Toast */}
      {selectedStudentNotification && (
        <div className="p-4 bg-blue-50/80 border border-blue-200/80 text-blue-900 rounded-2xl text-xs font-medium animate-in fade-in duration-200 flex items-center justify-between shadow-sm">
          <span>🎯 {selectedStudentNotification} — Context synchronized across the execution engine.</span>
          <button
            type="button"
            onClick={() => setSelectedStudentNotification(null)}
            className="text-blue-400 hover:text-blue-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top-Level KPI Metric Summary */}
      <CohortKPICards totalStudentsOverride={42} />

      {/* Main Cockpit Layout: 2 Columns with gap-8 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Left Section: Cohort Roster Table (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-6">
          <StudentRosterTable onSelectStudent={handleSelectStudent} />
        </div>

        {/* Right Section: Real-time Autonomous Audit Timeline (4 cols on lg) */}
        <div className="lg:col-span-4 sticky top-28">
          <AuditFeed />
        </div>
      </div>
    </div>
  );
}

export default TeacherPortal;
