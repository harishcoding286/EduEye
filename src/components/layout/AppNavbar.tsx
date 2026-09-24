'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';

export interface AppNavbarProps {
  userName?: string;
  role?: 'STUDENT' | 'TEACHER';
}

export function AppNavbar({ userName, role }: AppNavbarProps) {
  const {
    currentRole,
    setCurrentRole,
    currentStudent,
    handleGradeDrop,
    handleRemediationResolved,
  } = useAppContext();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const activeRole = role ?? currentRole;
  const isAlexAtRisk = currentStudent.riskTier === 'CRITICAL';

  const triggerPopQuiz = async () => {
    await handleGradeDrop('std_101', 'Eigenvectors', 38);
    setLastActionMessage('Signal Ingested: Pop Quiz Drop (38% Eigenvalues) ➔ Schedule Rewired');
    setTimeout(() => setLastActionMessage(null), 4000);
  };

  const triggerResolve = () => {
    handleRemediationResolved('std_101', 100);
    setLastActionMessage('Diagnostic Resolved: 100% Mastery ➔ Grade Restored to Optimal');
    setTimeout(() => setLastActionMessage(null), 4000);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-2xl border-b border-white/80 shadow-[0_4px_30px_rgba(0,120,255,0.04)]">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-20 gap-6">
          {/* Left Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-500 p-[1.5px] shadow-[0_8px_20px_-4px_rgba(14,165,233,0.3)]">
              <div className="w-full h-full bg-white/95 rounded-[14px] flex items-center justify-center backdrop-blur-sm">
                <span className="font-black text-xl text-blue-600">
                  👁
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Edu<span className="text-blue-600">Eye</span>
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-mono tracking-wide">
                  FlowBuild Autonomous Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block mt-0.5">
                Closed-Loop Cognitive Scheduling &amp; Autonomous Gap Remediation
              </p>
            </div>
          </div>

          {/* Center: Global Status Pill */}
          <div className="hidden lg:flex items-center">
            <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-white/80 border border-emerald-400/40 text-emerald-800 text-xs font-semibold shadow-[0_4px_16px_rgba(16,185,129,0.12)] backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Autonomous Loop Active</span>
            </div>
          </div>

          {/* Right: Persona Gateway / Switcher */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center space-x-3 px-3.5 py-2 rounded-2xl bg-white/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 transition-all text-left shadow-sm group cursor-pointer"
                aria-expanded={isDropdownOpen}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs uppercase bg-blue-50 text-blue-700 border border-blue-200/70 group-hover:scale-105 transition-transform">
                  {activeRole === 'STUDENT' ? 'AR' : 'SV'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800">
                    {userName ||
                      (activeRole === 'STUDENT'
                        ? 'Alex Rivera'
                        : 'Dr. Sarah Vance')}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        activeRole === 'STUDENT'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {activeRole}
                    </span>
                    <span className="text-[10px] text-slate-400">▾</span>
                  </div>
                </div>
              </button>

              {/* Persona Switcher Dropdown */}
              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(0,120,255,0.12)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Gateway Persona
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('STUDENT');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition ${
                      activeRole === 'STUDENT' ? 'bg-blue-50/60 font-semibold' : ''
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        Alex Rivera
                        {activeRole === 'STUDENT' && (
                          <span className="text-blue-600 text-xs">● Active</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">Undergrad Student (CS &amp; Math)</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                      STUDENT
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('TEACHER');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition ${
                      activeRole === 'TEACHER' ? 'bg-emerald-50/60 font-semibold' : ''
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        Dr. Sarah Vance
                        {activeRole === 'TEACHER' && (
                          <span className="text-emerald-600 text-xs">● Active</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">Faculty Lead &amp; Course Director</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      TEACHER
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controller Dock / Demo Action Bar */}
      <div className="bg-white/40 border-t border-slate-200/60 px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
            <span className="font-semibold text-slate-700 font-mono tracking-wide uppercase text-[11px]">
              Demo Controller:
            </span>
            <span className="text-slate-500 text-xs hidden md:inline">
              Simulate closed-loop autonomous telemetry triggers
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* High-Gloss 3D Action Button */}
            <button
              type="button"
              onClick={triggerPopQuiz}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_8px_20px_-4px_rgba(245,158,11,0.35)] ${
                isAlexAtRisk
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 hover:scale-[1.02] active:scale-[0.98]'
              }`}
              title="Drops quiz score to 38% for Alex Rivera, triggering autonomous calendar remediation"
            >
              <span>⚡</span> Simulate LMS Pop Quiz Drop (38% Eigenvalues)
            </button>

            <button
              type="button"
              onClick={triggerResolve}
              className="px-4 py-2 rounded-2xl bg-white/80 hover:bg-white text-emerald-700 hover:text-emerald-800 border border-emerald-300/80 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              title="Resolves diagnostic drill and clears deficit for Alex Rivera"
            >
              <span>✓</span> Resolve Diagnostic (100%)
            </button>
          </div>
        </div>

        {/* Temporary Feedback Toast */}
        {lastActionMessage && (
          <div className="max-w-7xl mx-auto mt-2 text-xs text-blue-700 font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <span>ℹ</span>
            <span>{lastActionMessage}</span>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppNavbar;
