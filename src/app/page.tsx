'use client';

import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { TeacherPortal } from '@/components/teacher/TeacherPortal';

export default function Home() {
  const { currentRole, setCurrentRole, currentStudent, handleGradeDrop, handleRemediationResolved } = useAppContext();

  // If role is TEACHER, render the full executive Faculty / Advisor Cockpit
  if (currentRole === 'TEACHER') {
    return <TeacherPortal />;
  }

  // When role is STUDENT, render Alex Rivera's perspective with quick gateway to Teacher Cockpit
  const scheduledLocks = currentStudent.calendarEvents.filter(
    (e) => e.category === 'REMEDIATION_LOCK' && e.status === 'SCHEDULED'
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Role Toggle Switch Notification */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-semibold mb-2">
              <span>👤</span> Student Persona Active (Alex Rivera)
            </div>
            <h1 className="text-xl font-bold text-white">
              Student Dashboard Telemetry
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Switch to Faculty Lead view to inspect the full Cohort Telemetry, TA dispatch, and Audit Feed.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCurrentRole('TEACHER')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-900/30 flex items-center gap-2 active:scale-95"
          >
            <span>Switch to Faculty / Advisor Cockpit</span>
            <span>→</span>
          </button>
        </div>

        {/* Student Snapshot Card */}
        <div className="bg-slate-800/60 border border-slate-750 rounded-2xl p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{currentStudent.name}</span>
                <span className="text-xs font-mono text-slate-400">({currentStudent.id})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Undergraduate Student • Linear Algebra (MATH-204)
              </p>
            </div>

            <div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  currentStudent.riskTier === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                    : currentStudent.riskTier === 'REMEDIATING'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                Risk Tier: {currentStudent.riskTier}
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-750">
              <span className="text-slate-400 text-xs font-semibold uppercase">Predicted Grade</span>
              <div className="text-2xl font-black text-white mt-1">
                {currentStudent.predictedGrade}%
              </div>
              <span className="text-[11px] text-slate-400">ML target score</span>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-750">
              <span className="text-slate-400 text-xs font-semibold uppercase">Attendance Rate</span>
              <div className="text-2xl font-black text-white mt-1">
                {currentStudent.attendanceRate}%
              </div>
              <span className="text-[11px] text-slate-400">Lecture participation</span>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-750">
              <span className="text-slate-400 text-xs font-semibold uppercase">Active Deficits</span>
              <div className="text-lg font-bold text-amber-400 mt-1">
                {currentStudent.activeDeficits.length === 0
                  ? 'None'
                  : currentStudent.activeDeficits.join(', ')}
              </div>
              <span className="text-[11px] text-slate-400">Target concepts</span>
            </div>
          </div>

          {/* Scheduled Remediation Focus Blocks */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-750">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
              <span>Autonomous Focus Blocks (Calendar Locks)</span>
              <span className="text-[11px] font-mono text-cyan-400">
                {scheduledLocks.length} active lock(s)
              </span>
            </h3>

            {scheduledLocks.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">
                No active remediation lock scheduled. Trigger a pop-quiz drop from the top controller bar to test autonomous scheduling.
              </p>
            ) : (
              <div className="space-y-2">
                {scheduledLocks.map((lock) => (
                  <div
                    key={lock.id}
                    className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-amber-200">
                        🔒 {lock.title}
                      </div>
                      <div className="text-xs text-amber-400/80">
                        Time window: 14:00 – 14:45 • Topic: {lock.topic}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemediationResolved('std_101', 100)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                    >
                      Resolve Diagnostic Drill (100%)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Judge Demo Controls */}
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleGradeDrop('std_101', 'Eigenvalues & Eigenvectors', 38)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow-lg"
            >
              ⚡ Trigger Pop Quiz Drop (38%)
            </button>
            <button
              type="button"
              onClick={() => handleRemediationResolved('std_101', 100)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition active:scale-95 shadow-lg"
            >
              ✓ Resolve Remediation Block (100%)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
