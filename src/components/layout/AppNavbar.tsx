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
    setLastActionMessage('🫧 Pop Quiz Telemetry Ingested: 38% in Eigenvalues! Focus block scheduled ✨');
    setTimeout(() => setLastActionMessage(null), 4000);
  };

  const triggerResolve = () => {
    handleRemediationResolved('std_101', 100);
    setLastActionMessage('🌸 Micro-Drill Completed (100% Mastery)! Predicted grade restored to Optimal! ⭐️');
    setTimeout(() => setLastActionMessage(null), 4000);
  };

  return (
    <header className="sticky top-2 z-50 w-full px-4 sm:px-8">
      {/* Floating Frutiger Aero Glass Capsule Navbar */}
      <div className="max-w-7xl mx-auto rounded-[2rem] bg-white/75 backdrop-blur-2xl border-2 border-white/95 shadow-[0_16px_40px_rgba(96,165,250,0.2),inset_0_2px_4px_rgba(255,255,255,0.9)] overflow-hidden">
        {/* Specular sheen bar */}
        <div className="h-1 bg-gradient-to-r from-transparent via-white/90 to-transparent" />

        <div className="px-6 py-3 flex items-center justify-between gap-4">
          {/* Left Brand: Cute Frutiger Aero Mascot & Wordmark */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-sky-200 via-cyan-300 to-blue-400 p-[2px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_6px_16px_rgba(56,189,248,0.35)] flex items-center justify-center group hover:scale-105 transition-transform cursor-pointer">
              <div className="w-full h-full bg-white/80 rounded-[14px] flex items-center justify-center text-2xl backdrop-blur-sm">
                🫧
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 bg-clip-text text-transparent">
                  EduEye
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-100 to-sky-100 text-slate-700 border border-white/90 shadow-sm">
                  Study Buddy ✨
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 hidden sm:block">
                Cognitive Schedule &amp; Gap Remediation ☁️
              </p>
            </div>
          </div>

          {/* Center: Cheerful Floating Status Pill */}
          <div className="hidden lg:flex items-center">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/90 border border-emerald-300/80 text-emerald-700 text-xs font-bold shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_4px_12px_rgba(16,185,129,0.18)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Autonomous Engine: Active 🌈</span>
            </div>
          </div>

          {/* Right: Persona Gateway & Switcher */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-white border border-white shadow-sm hover:shadow transition-all text-left group cursor-pointer"
                aria-expanded={isDropdownOpen}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm bg-gradient-to-br from-pink-100 to-sky-100 border border-white shadow-inner">
                  {activeRole === 'STUDENT' ? '🎒' : '👩‍🏫'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black text-slate-800">
                    {userName || (activeRole === 'STUDENT' ? 'Alex Rivera' : 'Dr. Sarah Vance')}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-bold text-blue-600">
                      {activeRole === 'STUDENT' ? 'Student View 🎒' : 'Teacher View 👩‍🏫'}
                    </span>
                    <span className="text-[10px] text-slate-400">▾</span>
                  </div>
                </div>
              </button>

              {/* Persona Switcher Dropdown */}
              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-3xl bg-white/95 backdrop-blur-2xl border-2 border-white shadow-[0_20px_50px_rgba(59,130,246,0.2)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 p-1.5"
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <div className="px-3.5 py-2 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Switch Gateway Persona 🫧
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('STUDENT');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center justify-between hover:bg-sky-50/80 transition ${
                      activeRole === 'STUDENT' ? 'bg-sky-100/70 font-bold' : ''
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Alex Rivera 🎒
                        {activeRole === 'STUDENT' && <span className="text-blue-500 text-xs">●</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">Undergrad Student</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                      STUDENT
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('TEACHER');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center justify-between hover:bg-emerald-50/80 transition ${
                      activeRole === 'TEACHER' ? 'bg-emerald-100/70 font-bold' : ''
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Dr. Sarah Vance 👩‍🏫
                        {activeRole === 'TEACHER' && <span className="text-emerald-500 text-xs">●</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">Course Director</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                      TEACHER
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Glossy Candy Controller Bar */}
        <div className="bg-gradient-to-r from-sky-100/70 via-pink-50/60 to-purple-100/70 border-t border-white/80 px-6 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <span className="text-base">🎮</span>
              <span>Demo Controls:</span>
              <span className="text-slate-500 font-medium hidden md:inline">
                Simulate automatic quiz drops &amp; calendar locks!
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Glossy Gel 3D Amber Button */}
              <button
                type="button"
                onClick={triggerPopQuiz}
                className="px-4 py-2 rounded-2xl text-xs font-black text-slate-950 transition-all flex items-center gap-1.5 bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 border border-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.9),0_6px_18px_rgba(245,158,11,0.35)] hover:scale-105 active:scale-95 cursor-pointer"
                title="Drops quiz score to 38% for Alex Rivera"
              >
                <span>⚡</span> Simulate LMS Pop Quiz Drop (38% Eigenvalues)
              </button>

              {/* Glossy Gel 3D Emerald Button */}
              <button
                type="button"
                onClick={triggerResolve}
                className="px-4 py-2 rounded-2xl text-xs font-black text-emerald-950 transition-all flex items-center gap-1.5 bg-gradient-to-b from-emerald-200 via-emerald-300 to-teal-400 hover:from-emerald-100 hover:to-emerald-300 border border-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.9),0_6px_18px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95 cursor-pointer"
                title="Clears deficit and restores grade to 100%"
              >
                <span>✨</span> Resolve Diagnostic (100%)
              </button>
            </div>
          </div>

          {/* Toast Message */}
          {lastActionMessage && (
            <div className="mt-2 text-xs font-bold text-indigo-700 flex items-center gap-2 animate-in fade-in duration-200 bg-white/80 px-3.5 py-1.5 rounded-full border border-white/90 shadow-sm w-fit">
              <span>💫</span>
              <span>{lastActionMessage}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppNavbar;
