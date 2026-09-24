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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Cockpit Header Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                Faculty & Advisor Cockpit
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Term 2026-Q3
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Linear Algebra & Discrete Structures (MATH-204)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Course Director: <span className="font-semibold text-slate-700">Dr. Sarah Vance</span> • 
              Automated cognitive remediation active for all enrolled cohorts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Current Focus Student
              </span>
              <span className="font-bold text-slate-800">
                {currentStudent.name} ({currentStudent.predictedGrade}% predicted)
              </span>
            </div>

            <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              Autonomous Schedulers Live
            </div>
          </div>
        </div>

        {/* Selected Student Toast */}
        {selectedStudentNotification && (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-medium animate-in fade-in duration-200 flex items-center justify-between">
            <span>🎯 {selectedStudentNotification} — Context updated across the system.</span>
            <button
              type="button"
              onClick={() => setSelectedStudentNotification(null)}
              className="text-indigo-400 hover:text-indigo-600 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top-Level KPI Metric Summary */}
        <CohortKPICards totalStudentsOverride={42} />

        {/* Main Cockpit Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Left Section: Cohort Roster Table (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-6">
            <StudentRosterTable onSelectStudent={handleSelectStudent} />
          </div>

          {/* Right Section: Real-time Autonomous Audit Timeline (4 cols on lg) */}
          <div className="lg:col-span-4 sticky top-20">
            <AuditFeed />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherPortal;
