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
      text: 'Optimal Standing 🌟',
      style: 'bg-emerald-100/90 text-emerald-800 border-emerald-300/70 shadow-[0_2px_8px_rgba(16,185,129,0.2)]',
      dot: 'bg-emerald-500',
    },
    REMEDIATING: {
      text: 'Catching Up 🚀',
      style: 'bg-amber-100/90 text-amber-800 border-amber-300/70 shadow-[0_2px_8px_rgba(245,158,11,0.2)]',
      dot: 'bg-amber-500',
    },
    CRITICAL: {
      text: 'Needs Focus Sprint ⚡',
      style: 'bg-rose-100/90 text-rose-800 border-rose-300/80 animate-pulse shadow-[0_2px_8px_rgba(244,63,94,0.2)]',
      dot: 'bg-rose-500',
    },
  }[riskTier];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ── CARD 1: Hero Predicted Score & Attendance ── */}
      <div className="rounded-[2rem] bg-white/75 backdrop-blur-2xl border-2 border-white/95 shadow-[0_16px_40px_rgba(147,197,253,0.2),inset_0_2px_4px_rgba(255,255,255,0.95)] p-7 flex flex-col gap-5 relative overflow-hidden">
        {/* Specular Sheen */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

        {/* Student Identity Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-200 to-indigo-100 border border-white shadow-inner flex items-center justify-center text-xl">
              🎓
            </div>
            <div>
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block">
                Student Profile 🫧
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {profile.name}
              </h2>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full border ${tierBadgeConfig.style}`}
          >
            <span className={`w-2 h-2 rounded-full ${tierBadgeConfig.dot}`} />
            {tierBadgeConfig.text}
          </span>
        </div>

        {/* High-Gloss 3D Juicy Liquid Glass Bubble for Predicted Score */}
        <div
          className={`relative overflow-hidden rounded-[1.8rem] p-6 transition-all duration-500 border-2 ${
            isOptimal
              ? 'bg-gradient-to-br from-white/95 via-emerald-100/40 to-teal-100/50 border-emerald-300/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),0_12px_28px_rgba(16,185,129,0.18)]'
              : isCritical
              ? 'bg-gradient-to-br from-white/95 via-rose-100/50 to-pink-100/60 border-rose-300/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),0_12px_28px_rgba(244,63,94,0.22)]'
              : 'bg-gradient-to-br from-white/95 via-amber-100/40 to-yellow-100/50 border-amber-300/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),0_12px_28px_rgba(245,158,11,0.18)]'
          }`}
        >
          {/* Top Liquid Specular Reflection */}
          <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-white/80 to-transparent pointer-events-none rounded-t-[1.8rem]" />

          <div className="flex items-center justify-between text-xs font-black tracking-wide uppercase text-slate-600 mb-1">
            <span className="flex items-center gap-1.5">
              <span>{isOptimal ? '🌟' : isCritical ? '⚠️' : '⚡'}</span> Grade Forecast
            </span>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/90 border border-slate-200/80 text-slate-500 shadow-sm">
              Live AI Projection ☁️
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className={`text-6xl font-black tracking-tight ${gradeTextColor} drop-shadow-sm`}>
              {predictedGrade}%
            </span>
            <span className="text-xs font-bold text-slate-600">
              {isOptimal
                ? 'Cruising comfortably towards an A! ✨'
                : isCritical
                ? 'Focus block scheduled to boost your grade! 🎯'
                : 'Deficit drill ready to level up! 🚀'}
            </span>
          </div>

          {/* Liquid Glossy Progress Bar */}
          <div className="w-full bg-slate-200/70 h-3 rounded-full overflow-hidden mt-3 p-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
            <div
              className={`h-full rounded-full transition-all duration-700 shadow-sm relative overflow-hidden ${
                isOptimal
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500'
                  : isCritical
                  ? 'bg-gradient-to-r from-rose-400 via-pink-500 to-rose-500'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, predictedGrade))}%` }}
            >
              {/* Highlight sheen inside the bar */}
              <div className="absolute top-0 inset-x-0 h-1 bg-white/60 rounded-full" />
            </div>
          </div>
        </div>

        {/* Attendance Metric */}
        <div className="pt-1">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-700 font-bold flex items-center gap-1.5">
              <span>🎒</span> Class Attendance &amp; Energy
            </span>
            <span className="font-black text-slate-900 text-xs px-2 py-0.5 rounded-lg bg-sky-100/80 text-sky-800 border border-sky-200/70">
              {attendanceRate}%
            </span>
          </div>
          <div className="w-full bg-slate-200/70 h-2.5 rounded-full overflow-hidden p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── CARD 2: Active Concept Deficits ── */}
      <div className="rounded-[2rem] bg-white/75 backdrop-blur-2xl border-2 border-white/95 shadow-[0_16px_40px_rgba(147,197,253,0.2),inset_0_2px_4px_rgba(255,255,255,0.95)] p-7 flex flex-col gap-4 relative overflow-hidden">
        {/* Specular Sheen */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <span>💡</span> Prerequisite Power-Up
          </h3>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/60">
            {activeDeficits.length === 0 ? '✨ Clear' : `${activeDeficits.length} Need Review`}
          </span>
        </div>

        {activeDeficits.length === 0 ? (
          <div className="py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border border-emerald-200/70 text-xs text-emerald-900 flex items-center gap-3 shadow-sm">
            <span className="w-8 h-8 rounded-2xl bg-emerald-200/80 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
              🌸
            </span>
            <div>
              <div className="font-black text-emerald-950">You're completely on track! ✨</div>
              <div className="text-emerald-700 font-medium text-[11px] mt-0.5">
                Zero concept gaps detected. Keep cruising through the term!
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDeficits.map((deficit) => (
              <div
                key={deficit}
                className="p-4 rounded-2xl bg-gradient-to-r from-rose-50/90 via-pink-50/80 to-amber-50/80 border-2 border-rose-200/90 text-rose-900 flex items-start gap-3.5 shadow-sm"
              >
                <div className="w-8 h-8 rounded-2xl bg-rose-200 text-rose-800 flex items-center justify-center text-sm font-black shrink-0 mt-0.5 shadow-inner">
                  🎯
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1">
                    <span>⚡</span> 45-Min Focus Drill Auto-Scheduled
                  </div>
                  <div className="text-sm font-black capitalize text-slate-900 mt-0.5">
                    {deficit.replace(/-/g, ' ')}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                    A quick 3-question micro-drill will get you right back to an A! 🎯 Click the focus sprint block on your calendar to start.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CARD 3: Recent Telemetry Submissions ── */}
      <div className="rounded-[2rem] bg-white/75 backdrop-blur-2xl border-2 border-white/95 shadow-[0_16px_40px_rgba(147,197,253,0.2),inset_0_2px_4px_rgba(255,255,255,0.95)] p-7 flex flex-col gap-4 relative overflow-hidden">
        {/* Specular Sheen */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <span>📝</span> Recent Submissions
          </h3>
          <span className="text-[11px] text-slate-400 font-bold">Latest 3 Quizzes</span>
        </div>

        <div className="divide-y divide-slate-100/90">
          {recentAssessments.slice(-3).reverse().map((asmt) => {
            const scorePct = Math.round((asmt.score / asmt.maxScore) * 100);
            const isHighLag = asmt.actualLagHours > asmt.expectedLagHours;

            return (
              <div
                key={asmt.id}
                className="py-3.5 flex items-center justify-between first:pt-1 last:pb-1"
              >
                <div className="min-w-0 pr-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">
                    {asmt.course}
                  </span>
                  <div className="text-xs font-black text-slate-800 truncate mt-0.5">
                    {asmt.topic}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Lag: <span className={isHighLag ? 'text-amber-600 font-bold' : 'text-slate-600'}>
                      {asmt.actualLagHours}h
                    </span>{' '}
                    <span className="text-slate-400 font-normal">(Goal: {asmt.expectedLagHours}h)</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block text-xs font-black px-3 py-1.5 rounded-xl border ${
                      scorePct >= 75
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200/80 shadow-sm'
                        : scorePct >= 60
                        ? 'bg-amber-100 text-amber-800 border-amber-200/80 shadow-sm'
                        : 'bg-rose-100 text-rose-800 border-rose-200/80 shadow-sm'
                    }`}
                  >
                    {scorePct >= 75 ? '🌟 ' : scorePct >= 60 ? '⚡ ' : '💧 '}
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
