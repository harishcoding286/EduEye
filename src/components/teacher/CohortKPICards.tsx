'use client';

import React, { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';

export interface CohortKPICardsProps {
  totalStudentsOverride?: number;
}

export function CohortKPICards({ totalStudentsOverride = 42 }: CohortKPICardsProps) {
  const { cohort } = useAppContext();

  const metrics = useMemo(() => {
    // Critical risk count
    const criticalCount = cohort.filter((s) => s.riskTier === 'CRITICAL').length;

    // Active auto-interventions (remediation lock blocks currently scheduled)
    const activeInterventions = cohort.reduce((acc, student) => {
      const scheduledLocks = student.calendarEvents.filter(
        (e) => e.category === 'REMEDIATION_LOCK' && e.status === 'SCHEDULED'
      ).length;
      return acc + scheduledLocks;
    }, 0);

    // Cohort average grade calculation
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Enrolled Students */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Students
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            👥
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {metrics.total}
          </span>
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            100% active
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Linear Algebra & Algorithms Section 04
        </p>
      </div>

      {/* 2. Cohort Predicted Average */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Cohort Average
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            📊
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {metrics.avgGrade}%
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              metrics.avgGrade >= 75
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-amber-700 bg-amber-50'
            }`}
          >
            {metrics.avgGrade >= 75 ? '↑ Benchmark met' : '↓ Attention needed'}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          ML predicted term mastery curve
        </p>
      </div>

      {/* 3. Active Auto-Interventions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Auto-Interventions
          </span>
          <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold text-sm">
            ⚡
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {metrics.activeInterventions}
          </span>
          <span className="text-xs font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200/60 px-2 py-0.5 rounded-full">
            Autonomous
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Remediation locks active on calendars
        </p>
      </div>

      {/* 4. Critical Alerts */}
      <div
        className={`rounded-2xl border p-5 transition-all shadow-sm ${
          metrics.criticalCount > 0
            ? 'bg-red-50/60 border-red-200 hover:shadow-red-100'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              metrics.criticalCount > 0 ? 'text-red-700' : 'text-slate-500'
            }`}
          >
            Critical Alerts
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
              metrics.criticalCount > 0
                ? 'bg-red-100 text-red-700 animate-pulse'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {metrics.criticalCount > 0 ? '⚠️' : '✓'}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-3xl font-extrabold tracking-tight ${
              metrics.criticalCount > 0 ? 'text-red-700' : 'text-slate-900'
            }`}
          >
            {metrics.criticalCount}
          </span>
          {metrics.criticalCount > 0 ? (
            <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
              Requires review
            </span>
          ) : (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Zero at-risk
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Students with high prerequisite attrition
        </p>
      </div>
    </div>
  );
}

export default CohortKPICards;
