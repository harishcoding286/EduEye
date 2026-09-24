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

  // Grade styling logic
  const isOptimal = predictedGrade >= 75;
  const isCritical = predictedGrade < 60;

  const gradeTextColor = isOptimal
    ? 'text-emerald-700'
    : isCritical
    ? 'text-rose-600'
    : 'text-amber-700';

  const tierBadgeConfig = {
    OPTIMAL: {
      text: 'Optimal Standing',
      style: 'bg-emerald-100/80 text-emerald-800 border-emerald-300/60',
      dot: 'bg-emerald-500',
    },
    REMEDIATING: {
      text: 'Remediating Gaps',
      style: 'bg-amber-100/80 text-amber-800 border-amber-300/60',
      dot: 'bg-amber-500',
    },
    CRITICAL: {
      text: 'Critical Intervention',
      style: 'bg-rose-100/90 text-rose-800 border-rose-300/70 animate-pulse',
      dot: 'bg-rose-500',
    },
  }[riskTier];

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* ── CARD 1: Hero Predicted Score & Attendance ── */}
      <div className="bg-white/65 backdrop-blur-2xl border border-white/80 shadow-[0_16px_40px_-12px_rgba(0,120,255,0.08)] rounded-3xl p-8 flex flex-col gap-6">
        {/* Student Identity Bar */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 block mb-0.5">
              Enrolled Student
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {profile.name}
            </h2>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${tierBadgeConfig.style}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tierBadgeConfig.dot}`} />
            {tierBadgeConfig.text}
          </span>
        </div>

        {/* High-Gloss 3D Liquid Droplet / Orb for Predicted Score */}
        <div
          className={`relative overflow-hidden rounded-3xl p-7 transition-all duration-500 border ${
            isOptimal
              ? 'bg-gradient-to-br from-white/95 via-emerald-500/10 to-emerald-400/20 border-emerald-300/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_16px_36px_-6px_rgba(16,185,129,0.22)]'
              : isCritical
              ? 'bg-gradient-to-br from-white/95 via-rose-500/15 to-rose-400/25 border-rose-300/70 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_16px_36px_-6px_rgba(244,63,94,0.3)] animate-pulse'
              : 'bg-gradient-to-br from-white/95 via-amber-500/10 to-amber-400/20 border-amber-300/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_16px_36px_-6px_rgba(245,158,11,0.22)]'
          }`}
        >
          {/* Top Liquid Specular Reflection */}
          <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-white/70 to-transparent pointer-events-none rounded-t-3xl" />

          <div className="flex items-center justify-between text-xs font-bold tracking-wider uppercase text-slate-500 mb-2">
            <span>Predicted Course Mastery</span>
            <span className="font-mono text-[10px] text-slate-400">ML PROJECTION</span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className={`text-6xl font-black tracking-tight ${gradeTextColor} drop-shadow-sm`}>
              {predictedGrade}%
            </span>
            <span className="text-xs font-semibold text-slate-600">
              {isOptimal
                ? 'On track for Honors'
                : isCritical
                ? 'Automatic focus locks dispatched'
                : 'Deficit remediation active'}
            </span>
          </div>

          {/* Liquid Progress Bar */}
          <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden mt-4 p-[1px] shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 shadow-sm ${
                isOptimal
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : isCritical
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, predictedGrade))}%` }}
            />
          </div>
        </div>

        {/* Attendance Metric */}
        <div className="pt-2">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-600 font-medium">Session Attendance &amp; Engagement</span>
            <span className="font-bold text-slate-800">{attendanceRate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-700 rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── CARD 2: Active Concept Deficits ── */}
      <div className="bg-white/65 backdrop-blur-2xl border border-white/80 shadow-[0_16px_40px_-12px_rgba(0,120,255,0.08)] rounded-3xl p-7 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Prerequisite Concept Health
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            {activeDeficits.length} Active Flag(s)
          </span>
        </div>

        {activeDeficits.length === 0 ? (
          <div className="py-4 px-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-800 flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
              ✓
            </span>
            <span className="font-medium">
              Zero conceptual bottlenecks detected across all prerequisite modules.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDeficits.map((deficit) => (
              <div
                key={deficit}
                className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-rose-900 flex items-start gap-3.5"
              >
                <div className="w-7 h-7 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  !
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                    Autonomous Calendar Lock Triggered
                  </div>
                  <div className="text-sm font-extrabold capitalize text-slate-900 mt-0.5">
                    {deficit.replace(/-/g, ' ')}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Low assessment confidence mapped to prerequisite concept. Focus sprint scheduled to prevent mid-term failure.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CARD 3: Recent Telemetry Submissions ── */}
      <div className="bg-white/65 backdrop-blur-2xl border border-white/80 shadow-[0_16px_40px_-12px_rgba(0,120,255,0.08)] rounded-3xl p-7 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recent Telemetry Submissions
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Last 3 Assessments</span>
        </div>

        <div className="divide-y divide-slate-100/90">
          {recentAssessments.slice(-3).reverse().map((asmt) => {
            const scorePct = Math.round((asmt.score / asmt.maxScore) * 100);
            const isHighLag = asmt.actualLagHours > asmt.expectedLagHours;

            return (
              <div
                key={asmt.id}
                className="py-4 flex items-center justify-between first:pt-1 last:pb-1"
              >
                <div className="min-w-0 pr-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    {asmt.course}
                  </span>
                  <div className="text-sm font-bold text-slate-800 truncate mt-0.5">
                    {asmt.topic}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Submission Lag: <span className={isHighLag ? 'text-amber-600 font-semibold' : 'text-slate-600'}>
                      {asmt.actualLagHours}h
                    </span>{' '}
                    <span className="text-slate-400 font-normal">(Target: {asmt.expectedLagHours}h)</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block text-xs font-extrabold px-3 py-1 rounded-xl ${
                      scorePct >= 75
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                        : scorePct >= 60
                        ? 'bg-amber-100 text-amber-800 border border-amber-200/60'
                        : 'bg-rose-100 text-rose-800 border border-rose-200/60'
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
