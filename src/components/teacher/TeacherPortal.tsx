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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* Cockpit Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 rounded-3xl bg-white/85 backdrop-blur-xl p-6 border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#3368A0] bg-[#C8DFDB]/40 px-2.5 py-0.5 rounded-md border border-[#C8DFDB]">
              Faculty Cockpit
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              MATH-204
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Linear Algebra &amp; Discrete Structures
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Course Director: <span className="font-bold text-slate-700">Dr. Sarah Vance</span> • Closed-loop remediation monitoring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#C8DFDB]/20 border border-[#C8DFDB] text-xs">
            <span className="text-slate-400 block text-[9px] uppercase font-bold">
              Focus Student
            </span>
            <span className="font-bold text-[#3368A0]">
              {currentStudent.name} ({currentStudent.predictedGrade}%)
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-[#C8DFDB]/40 border border-[#C8DFDB] text-[#3368A0] text-xs font-bold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#3368A0]"></span>
            Schedulers Active
          </div>
        </div>
      </div>

      {/* Selected Student Toast */}
      {selectedStudentNotification && (
        <div className="p-3 bg-[#C8DFDB]/30 border border-[#C8DFDB] text-[#3368A0] rounded-xl text-xs font-bold animate-in fade-in duration-150 flex items-center justify-between">
          <span>{selectedStudentNotification} — Context synchronized across the engine.</span>
          <button
            type="button"
            onClick={() => setSelectedStudentNotification(null)}
            className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Top-Level KPI Metric Summary */}
      <CohortKPICards totalStudentsOverride={42} />

      {/* Main Cockpit Layout: 2 Columns with gap-8 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Left Section: Cohort Roster Table (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <StudentRosterTable onSelectStudent={handleSelectStudent} />
        </div>

        {/* Right Section: Audit Timeline (4 cols) */}
        <div className="lg:col-span-4">
          <AuditFeed />
        </div>
      </div>
    </div>
  );
}

export default TeacherPortal;
