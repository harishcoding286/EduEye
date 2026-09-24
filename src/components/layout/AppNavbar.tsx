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
    handleGradeDrop,
    handleRemediationResolved,
  } = useAppContext();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const activeRole = role ?? currentRole;

  const triggerPopQuiz = async () => {
    await handleGradeDrop('std_101', 'Eigenvectors', 38);
    setLastActionMessage('Quiz deficit logged: 38% in Eigenvalues. Remediation block scheduled.');
    setTimeout(() => setLastActionMessage(null), 3500);
  };

  const triggerResolve = () => {
    handleRemediationResolved('std_101', 100);
    setLastActionMessage('Diagnostic resolved (100%). Grade forecast restored.');
    setTimeout(() => setLastActionMessage(null), 3500);
  };

  return (
    <header className="relative w-full px-4 sm:px-8 pt-6 pb-2">
      {/* Static Glass Navbar */}
      <div className="max-w-7xl mx-auto rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] overflow-hidden">
        {/* Top subtle border sheen */}
        <div className="h-0.5 bg-[#C8DFDB]/60" />

        <div className="px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Brand: Logo & Wordmark (Solid #3368A0, No Gradient) */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3368A0] text-white flex items-center justify-center font-black shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-2xl tracking-tight text-[#3368A0]">
                  EduEye
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#C8DFDB]/40 text-[#3368A0] border border-[#C8DFDB]">
                  Autonomous Engine
                </span>
              </div>
            </div>
          </div>

          {/* Right: Persona Switcher */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl bg-[#C8DFDB]/20 hover:bg-[#C8DFDB]/40 border border-[#C8DFDB] transition-all text-left cursor-pointer"
                aria-expanded={isDropdownOpen}
              >
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black bg-[#3368A0] text-white">
                  {activeRole === 'STUDENT' ? 'AR' : 'SV'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black text-slate-800">
                    {userName || (activeRole === 'STUDENT' ? 'Alex Rivera' : 'Dr. Sarah Vance')}
                  </div>
                  <div className="text-[10px] font-bold text-[#66A3BF]">
                    {activeRole === 'STUDENT' ? 'Student View' : 'Teacher View'}
                  </div>
                </div>
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Persona Switcher Dropdown */}
              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 backdrop-blur-2xl border border-[#C8DFDB] shadow-[0_16px_36px_rgba(51,104,160,0.15)] py-1.5 z-50 p-1"
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-[#66A3BF]">
                    Select Persona
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('STUDENT');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between hover:bg-[#C8DFDB]/20 transition ${
                      activeRole === 'STUDENT' ? 'bg-[#C8DFDB]/30 font-bold' : ''
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Alex Rivera
                      </div>
                      <div className="text-[11px] text-slate-500">Student</div>
                    </div>
                    {activeRole === 'STUDENT' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3368A0] text-white font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('TEACHER');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between hover:bg-[#C8DFDB]/20 transition ${
                      activeRole === 'TEACHER' ? 'bg-[#C8DFDB]/30 font-bold' : ''
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Dr. Sarah Vance
                      </div>
                      <div className="text-[11px] text-slate-500">Course Director</div>
                    </div>
                    {activeRole === 'TEACHER' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3368A0] text-white font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Minimal Demo Controller Bar */}
        <div className="bg-[#C8DFDB]/25 border-t border-[#C8DFDB]/60 px-6 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#3368A0]">
              Demo Controls
            </span>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={triggerPopQuiz}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#3368A0] text-white hover:bg-[#2b5887] transition-all cursor-pointer shadow-sm"
              >
                Simulate Quiz Drop (38%)
              </button>

              <button
                type="button"
                onClick={triggerResolve}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#66A3BF] text-white hover:bg-[#578ea5] transition-all cursor-pointer shadow-sm"
              >
                Resolve Diagnostic (100%)
              </button>
            </div>
          </div>

          {/* Toast Message */}
          {lastActionMessage && (
            <div className="mt-1.5 text-xs font-bold text-[#3368A0] bg-white/90 px-3 py-1 rounded-lg border border-[#C8DFDB] w-fit">
              {lastActionMessage}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppNavbar;
