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
      <div className="bg-white/65 backdrop-blur-2xl border border-white/80 shadow-[0_16px_40px_-12px_rgba(0,120,255,0.08)] rounded-3xl p-6 transition-all hover:bg-white/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Enrolled
          </span>
          <div className="w-8 h-8 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            👥
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.total}
          </span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
            100% active
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Linear Algebra Section 04
        </p>
      </div>

      {/* 2. Projected Cohort Average */}
      <div className="bg-white/65 backdrop-blur-2xl border border-white/80 shadow-[0_16px_40px_-12px_rgba(0,120,255,0.08)] rounded-3xl p-6 transition-all hover:bg-white/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Projected Mean
          </span>
          <div className="w-8 h-8 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            📈
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.avgGrade}%
          </span>
          <span className="text-xs font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200/50">
            Term Target 75%
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          ML end-of-term projection
        </p>
      </div>

      {/* 3. Active Auto-Interventions */}
      <div className="bg-white/65 backdrop-blur-2xl border border-white/80 shadow-[0_16px_40px_-12px_rgba(0,120,255,0.08)] rounded-3xl p-6 transition-all hover:bg-white/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Focus Locks
          </span>
          <div className="w-8 h-8 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
            🔒
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-amber-700 tracking-tight">
            {metrics.activeInterventions}
          </span>
          <span className="text-xs font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200/60 animate-pulse">
            In Flight
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Autonomous calendar rewirings
        </p>
      </div>

      {/* 4. Critical Triage Count */}
      <div className="bg-white/65 backdrop-blur-2xl border border-white/80 shadow-[0_16px_40px_-12px_rgba(0,120,255,0.08)] rounded-3xl p-6 transition-all hover:bg-white/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Critical Triage
          </span>
          <div className="w-8 h-8 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
            ⚠️
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-rose-600 tracking-tight">
            {metrics.criticalCount}
          </span>
          <span className="text-xs font-semibold text-rose-800 bg-rose-100/80 px-2.5 py-0.5 rounded-full border border-rose-200/60">
            Requires Eye
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Students below 60% threshold
        </p>
      </div>
    </div>
  );
}

export default CohortKPICards;
