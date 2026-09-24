'use client';

import React from 'react';
import type { StudentProfile } from '@/types';

export interface StudentHealthCardProps {
  profile: StudentProfile;
  onSimulateDrop?: () => void;
}

export const StudentHealthCard: React.FC<StudentHealthCardProps> = ({
  profile,
}) => {
  const { predictedGrade, attendanceRate, riskTier, activeDeficits, recentAssessments } = profile;

  const isOptimal = predictedGrade >= 75;
  const isCritical = predictedGrade < 60;

  const tierBadgeConfig = {
    OPTIMAL: {
      text: 'OPTIMAL',
      style: 'bg-[#C8DFDB]/60 text-[#3368A0] border border-[#66A3BF]/40',
      dot: 'bg-[#3368A0]',
    },
    REMEDIATING: {
      text: 'REMEDIATING',
      style: 'bg-amber-50 text-amber-800 border border-amber-300',
      dot: 'bg-amber-500',
    },
    CRITICAL: {
      text: 'CRITICAL',
      style: 'bg-rose-50 text-rose-800 border border-rose-300',
      dot: 'bg-rose-500',
    },
  }[riskTier];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ── CARD 1: Predicted Score & Attendance ── */}
      <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] p-6 flex flex-col gap-5 relative overflow-hidden">
        {/* Student Identity Bar */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black tracking-wider uppercase text-[#66A3BF] block">
              Student Profile
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {profile.name}
            </h2>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full ${tierBadgeConfig.style}`}
          >
            <span className={`w-2 h-2 rounded-full ${tierBadgeConfig.dot}`} />
            {tierBadgeConfig.text}
          </span>
        </div>

        {/* Forecast Card */}
        <div className="rounded-2xl p-5 border border-[#C8DFDB] bg-[#C8DFDB]/15">
          <div className="flex items-center justify-between text-xs font-bold text-[#3368A0] mb-1">
            <span>Grade Forecast</span>
            <span className="text-[11px] font-mono text-slate-500">
              AI Projection
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className="text-5xl font-black tracking-tight text-[#3368A0]">
              {predictedGrade}%
            </span>
            <span className="text-xs font-medium text-slate-600">
              {isOptimal
                ? 'Target trajectory on track.'
                : isCritical
                ? 'Remediation slot scheduled to recover baseline.'
                : 'Deficit drill available to advance.'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#C8DFDB]/50 h-2.5 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOptimal
                  ? 'bg-[#3368A0]'
                  : isCritical
                  ? 'bg-rose-500'
                  : 'bg-[#66A3BF]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, predictedGrade))}%` }}
            />
          </div>
        </div>

        {/* Attendance Metric */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-700 font-bold">
              Class Attendance
            </span>
            <span className="font-black text-[#3368A0] text-xs px-2 py-0.5 rounded-lg bg-[#C8DFDB]/40 border border-[#C8DFDB]">
              {attendanceRate}%
            </span>
          </div>
          <div className="w-full bg-[#C8DFDB]/40 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#66A3BF] rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── CARD 2: Active Concept Deficits ── */}
      <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] p-6 flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#3368A0]">
            Prerequisite Status
          </h3>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8DFDB]/40 text-[#3368A0] border border-[#C8DFDB]">
            {activeDeficits.length === 0 ? 'Clear' : `${activeDeficits.length} Active`}
          </span>
        </div>

        {activeDeficits.length === 0 ? (
          <div className="py-3 px-4 rounded-xl bg-[#C8DFDB]/20 border border-[#C8DFDB] text-xs text-[#3368A0]">
            <div className="font-bold">No Concept Deficits Detected</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              All prerequisite topics verified.
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeDeficits.map((deficit) => (
              <div
                key={deficit}
                className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-slate-800"
              >
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  Focus Slot Scheduled
                </div>
                <div className="text-sm font-bold capitalize text-slate-900 mt-0.5">
                  {deficit.replace(/-/g, ' ')}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-normal font-medium">
                  Complete the micro-drill from the calendar to clear this deficit and restore target grade.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CARD 3: Recent Assessments ── */}
      <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] p-6 flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#3368A0]">
            Recent Assessments
          </h3>
          <span className="text-[11px] text-[#66A3BF] font-bold">Latest 3</span>
        </div>

        <div className="divide-y divide-[#C8DFDB]/60">
          {recentAssessments.slice(-3).reverse().map((asmt) => {
            const scorePct = Math.round((asmt.score / asmt.maxScore) * 100);

            return (
              <div
                key={asmt.id}
                className="py-3 flex items-center justify-between first:pt-1 last:pb-1"
              >
                <div className="min-w-0 pr-3">
                  <span className="text-[10px] font-bold text-[#66A3BF] uppercase tracking-wide block">
                    {asmt.course}
                  </span>
                  <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
                    {asmt.topic}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Lag: {asmt.actualLagHours}h / Target: {asmt.expectedLagHours}h
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      scorePct >= 75
                        ? 'bg-[#C8DFDB]/40 text-[#3368A0] border-[#C8DFDB]'
                        : scorePct >= 60
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {asmt.score}/{asmt.maxScore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
