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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 min-h-screen flex flex-col gap-6">
      {/* Cockpit Header Banner: Cute Frutiger Aero Glass Capsule */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-[2.2rem] bg-white/75 backdrop-blur-2xl p-7 border-2 border-white/95 shadow-[0_16px_40px_rgba(147,197,253,0.2),inset_0_2px_4px_rgba(255,255,255,0.95)] relative overflow-hidden">
        {/* Specular sheen */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-100/80 px-3 py-0.5 rounded-full border border-blue-200 shadow-sm flex items-center gap-1">
              <span>👩‍🏫</span> Faculty &amp; Advisor Cockpit
            </span>
            <span className="text-xs text-slate-400 font-mono font-bold">
              Term 2026-Q3 🫧
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Linear Algebra &amp; Discrete Structures (MATH-204)
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Course Director: <span className="font-black text-slate-700">Dr. Sarah Vance</span> • 
            Autonomous closed-loop student remediation active across all enrolled cohorts ☁️
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/90 border border-white text-xs shadow-sm">
            <span className="text-slate-400 block text-[9px] uppercase font-black tracking-wider">
              Focus Student 🎯
            </span>
            <span className="font-black text-slate-900">
              {currentStudent.name} ({currentStudent.predictedGrade}%)
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs font-black flex items-center gap-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            Autonomous Schedulers Live ✨
          </div>
        </div>
      </div>

      {/* Selected Student Toast */}
      {selectedStudentNotification && (
        <div className="p-4 bg-sky-50/90 border-2 border-sky-200 text-sky-950 rounded-2xl text-xs font-bold animate-in fade-in duration-200 flex items-center justify-between shadow-sm">
          <span>🎯 {selectedStudentNotification} — Context synchronized across the execution engine! ✨</span>
          <button
            type="button"
            onClick={() => setSelectedStudentNotification(null)}
            className="text-sky-500 hover:text-sky-700 font-black cursor-pointer text-sm"
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
