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
    setLastActionMessage('Triggered: LMS Pop Quiz Drop (38% Eigenvalues) -> CRITICAL State');
    setTimeout(() => setLastActionMessage(null), 4000);
  };

  const triggerResolve = () => {
    handleRemediationResolved('std_101', 100);
    setLastActionMessage('Triggered: Micro-Drill Resolved (100%) -> OPTIMAL Restored');
    setTimeout(() => setLastActionMessage(null), 4000);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md text-white shadow-xl">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left Branding */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-emerald-400 p-[2px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="font-black text-lg bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  👁
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Edu<span className="text-cyan-400">Eye</span>
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono tracking-wider">
                  FlowBuild Autonomous Engine
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden md:block">
                Closed-Loop Cognitive Scheduling & Telemetry Remediation
              </p>
            </div>
          </div>

          {/* Center: Global Status Badge */}
          <div className="hidden lg:flex items-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-medium shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>⚡ System Status: Autonomous Loop Active</span>
            </div>
          </div>

          {/* Right: Persona Gateway / Switcher */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-slate-600 transition-all text-left group cursor-pointer"
                aria-expanded={isDropdownOpen}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/40 group-hover:scale-105 transition-transform">
                  {activeRole === 'STUDENT' ? 'AR' : 'SV'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200">
                    {userName ||
                      (activeRole === 'STUDENT'
                        ? 'Alex Rivera'
                        : 'Dr. Sarah Vance')}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-sm ${
                        activeRole === 'STUDENT'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {activeRole}
                    </span>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </div>
                </div>
              </button>

              {/* Persona Switcher Dropdown */}
              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-750 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Switch Gateway Persona
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('STUDENT');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-800 transition ${
                      activeRole === 'STUDENT' ? 'bg-slate-800/80' : ''
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                        Alex Rivera
                        {activeRole === 'STUDENT' && (
                          <span className="text-cyan-400 text-xs">● Active</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">Undergrad Student (CS & Math)</div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 font-medium">
                      STUDENT
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('TEACHER');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-800 transition ${
                      activeRole === 'TEACHER' ? 'bg-slate-800/80' : ''
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                        Dr. Sarah Vance
                        {activeRole === 'TEACHER' && (
                          <span className="text-emerald-400 text-xs">● Active</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">Faculty Lead & Course Director</div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 font-medium">
                      TEACHER
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating / Docked Judge Demo Controller Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border-t border-slate-800/80 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-400"></span>
            <span className="font-semibold text-slate-300 font-mono tracking-wide uppercase text-[11px]">
              Judge Demo Controller:
            </span>
            <span className="text-slate-400 hidden md:inline">
              Simulate closed-loop autonomous interventions in real time
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={triggerPopQuiz}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition flex items-center gap-1.5 shadow-md ${
                isAlexAtRisk
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500/50'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold active:scale-95'
              }`}
              title="Drops quiz score to 38% for Alex Rivera, triggering autonomous calendar remediation"
            >
              <span>⚡</span> Simulate LMS Pop Quiz Drop (38% Eigenvalues)
            </button>

            <button
              type="button"
              onClick={triggerResolve}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 border border-emerald-500/40"
              title="Resolves diagnostic drill and clears deficit for Alex Rivera"
            >
              <span>✓</span> Resolve Diagnostic (100%)
            </button>
          </div>
        </div>

        {/* Temporary Feedback Toast */}
        {lastActionMessage && (
          <div className="max-w-7xl mx-auto mt-1.5 text-[11px] text-cyan-300 font-mono flex items-center gap-2">
            <span>ℹ</span>
            <span>{lastActionMessage}</span>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppNavbar;
