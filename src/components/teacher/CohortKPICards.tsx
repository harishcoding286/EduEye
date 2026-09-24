'use client';

import React, { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';

export interface CohortKPICardsProps {
  totalStudentsOverride?: number;
}

export function CohortKPICards({ totalStudentsOverride = 42 }: CohortKPICardsProps) {
  const { cohort } = useAppContext();

  const metrics = useMemo(() => {
    const criticalCount = cohort.filter((s) => s.riskTier === 'CRITICAL').length;

    const activeInterventions = cohort.reduce((acc, student) => {
      const scheduledLocks = student.calendarEvents.filter(
        (e) => e.category === 'REMEDIATION_LOCK' && e.status === 'SCHEDULED'
      ).length;
      return acc + scheduledLocks;
    }, 0);

    const avgGrade = Math.round(
      cohort.reduce((acc, s) => acc + s.predictedGrade, 0) / (cohort.length || 1)
    );

    return {
      total: totalStudentsOverride,
      avgGrade: avgGrade || 76,
      activeInterventions,
      criticalCount,
    };
  }, [cohort, totalStudentsOverride]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 1. Total Enrolled Students */}
      <div className="rounded-[1.8rem] bg-white/75 backdrop-blur-2xl border-2 border-white/95 shadow-[0_12px_32px_rgba(147,197,253,0.2),inset_0_2px_4px_rgba(255,255,255,0.95)] p-6 transition-all hover:scale-[1.02] relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Total Enrolled 🎒
          </span>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-100 to-sky-100 text-blue-600 flex items-center justify-center font-bold text-lg border border-white shadow-inner">
            👥
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-900 tracking-tight">
            {metrics.total}
          </span>
          <span className="text-xs font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300/80 shadow-sm">
            100% active ✨
          </span>
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Linear Algebra Section 04
        </p>
      </div>

      {/* 2. Projected Cohort Average */}
      <div className="rounded-[1.8rem] bg-white/75 backdrop-blur-2xl border-2 border-white/95 shadow-[0_12px_32px_rgba(147,197,253,0.2),inset_0_2px_4px_rgba(255,255,255,0.95)] p-6 transition-all hover:scale-[1.02] relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Projected Mean 📈
          </span>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 flex items-center justify-center font-bold text-lg border border-white shadow-inner">
            🌟
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-900 tracking-tight">
            {metrics.avgGrade}%
          </span>
          <span className="text-xs font-black text-blue-800 bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-300/80 shadow-sm">
            Goal: 75% 🎯
          </span>
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          End-of-term AI projection
        </p>
      </div>

      {/* 3. Active Auto-Interventions */}
      <div className="rounded-[1.8rem] bg-white/75 backdrop-blur-2xl border-2 border-white/95 shadow-[0_12px_32px_rgba(147,197,253,0.2),inset_0_2px_4px_rgba(255,255,255,0.95)] p-6 transition-all hover:scale-[1.02] relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Active Focus Locks 🔒
          </span>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-600 flex items-center justify-center font-bold text-lg border border-white shadow-inner">
            ⚡
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-black text-amber-700 tracking-tight">
            {metrics.activeInterventions}
          </span>
          <span className="text-xs font-black text-amber-900 bg-amber-200/90 px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse shadow-sm">
            In Flight 🚀
          </span>
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Autonomous calendar slots
        </p>
      </div>

      {/* 4. Critical Triage Count */}
      <div className="rounded-[1.8rem] bg-white/75 backdrop-blur-2xl border-2 border-white/95 shadow-[0_12px_32px_rgba(147,197,253,0.2),inset_0_2px_4px_rgba(255,255,255,0.95)] p-6 transition-all hover:scale-[1.02] relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Critical Triage ⚠️
          </span>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 text-rose-600 flex items-center justify-center font-bold text-lg border border-white shadow-inner">
            🚨
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-black text-rose-600 tracking-tight">
            {metrics.criticalCount}
          </span>
          <span className="text-xs font-black text-rose-900 bg-rose-200/90 px-2.5 py-0.5 rounded-full border border-rose-300 shadow-sm">
            Needs Eye 👁️
          </span>
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Below 60% threshold
        </p>
      </div>
    </div>
  );
}

export default CohortKPICards;
