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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Enrolled Students */}
      <div className="rounded-2xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_8px_24px_-4px_rgba(51,104,160,0.1)] p-5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-[#66A3BF] uppercase tracking-wider">
            Total Enrolled
          </span>
          <span className="text-xs font-bold text-[#3368A0] bg-[#C8DFDB]/40 px-2 py-0.5 rounded-md border border-[#C8DFDB]">
            100% Active
          </span>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.total}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Section 04
        </p>
      </div>

      {/* 2. Projected Cohort Average */}
      <div className="rounded-2xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_8px_24px_-4px_rgba(51,104,160,0.1)] p-5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-[#66A3BF] uppercase tracking-wider">
            Projected Mean
          </span>
          <span className="text-xs font-bold text-[#3368A0] bg-[#C8DFDB]/40 px-2 py-0.5 rounded-md border border-[#C8DFDB]">
            Goal: 75%
          </span>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-black text-[#3368A0] tracking-tight">
            {metrics.avgGrade}%
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Cohort Projection
        </p>
      </div>

      {/* 3. Active Auto-Interventions */}
      <div className="rounded-2xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_8px_24px_-4px_rgba(51,104,160,0.1)] p-5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-[#66A3BF] uppercase tracking-wider">
            Active Focus Locks
          </span>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            In Flight
          </span>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-black text-amber-700 tracking-tight">
            {metrics.activeInterventions}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Calendar Slots
        </p>
      </div>

      {/* 4. Critical Triage Count */}
      <div className="rounded-2xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_8px_24px_-4px_rgba(51,104,160,0.1)] p-5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-[#66A3BF] uppercase tracking-wider">
            Critical Triage
          </span>
          <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            Review
          </span>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-black text-rose-600 tracking-tight">
            {metrics.criticalCount}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Below 60% Threshold
        </p>
      </div>
    </div>
  );
}

export default CohortKPICards;
