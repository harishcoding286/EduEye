'use client';

import React from 'react';
import type { StudentProfile } from '@/types';

export interface StudentHealthCardProps {
  profile: StudentProfile;
  onSimulateDrop?: () => void;
}

export const StudentHealthCard: React.FC<StudentHealthCardProps> = ({
  profile,
  onSimulateDrop,
}) => {
  const { predictedGrade, attendanceRate, riskTier, activeDeficits, recentAssessments } = profile;

  // Grade styling
  const isOptimal = predictedGrade >= 75;
  const isCritical = predictedGrade < 60;
  const isRemediating = !isOptimal && !isCritical;

  const gradeColor = isOptimal
    ? 'text-emerald-600'
    : isCritical
    ? 'text-rose-600'
    : 'text-amber-600';

  const gradeBg = isOptimal
    ? 'bg-emerald-50 border-emerald-200'
    : isCritical
    ? 'bg-rose-50 border-rose-200 animate-pulse'
    : 'bg-amber-50 border-amber-200';

  const tierBadge = {
    OPTIMAL: { text: 'Optimal Stability', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    REMEDIATING: { text: 'Remediating Deficit', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
    CRITICAL: { text: 'Critical Risk Warning', badge: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' },
  }[riskTier];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
      {/* Student Identity Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Student Telemetry
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">{profile.name}</h2>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tierBadge.badge}`}
        >
          {tierBadge.text}
        </span>
      </div>

      {/* Predicted Semester Outcome Gauge */}
      <div className={`p-5 rounded-2xl border ${gradeBg} transition-all duration-500`}>
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Predicted Semester Grade
          </span>
          <span className="text-[11px] font-medium text-slate-500">ML Forecast</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-5xl font-black tracking-tight ${gradeColor}`}>
            {predictedGrade}%
          </span>
          <span className="text-xs font-medium text-slate-500">
            {isOptimal ? 'Target met' : isCritical ? 'Immediate action required' : 'Active remediation'}
          </span>
        </div>
        <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${
              isOptimal ? 'bg-emerald-500' : isCritical ? 'bg-rose-500' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, predictedGrade))}%` }}
          />
        </div>
      </div>

      {/* Attendance Metric */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-slate-600">Lecture & Lab Attendance</span>
          <span className="font-bold text-slate-800">{attendanceRate}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
          <div
            className="h-full bg-slate-700 rounded-full transition-all duration-500"
            style={{ width: `${attendanceRate}%` }}
          />
        </div>
      </div>

      {/* Active Concept Deficits */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
          Active Concept Deficits
        </h3>
        {activeDeficits.length === 0 ? (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
            <span className="text-emerald-500 font-bold">✓</span> No concept bottlenecks detected.
          </div>
        ) : (
          <div className="space-y-2">
            {activeDeficits.map(deficit => (
              <div
                key={deficit}
                className="p-3.5 rounded-xl bg-rose-50/90 border border-rose-300/80 text-rose-900 flex items-start gap-2.5"
              >
                <span className="text-base leading-none">⚠️</span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-rose-800">
                    Critical Gap Detected
                  </div>
                  <div className="text-sm font-semibold capitalize mt-0.5">
                    {deficit.replace(/-/g, ' ')}
                  </div>
                  <p className="text-[11px] text-rose-700/80 mt-1">
                    Prerequisite bottleneck triggering cognitive calendar locks.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Submissions Feed */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
          Recent Telemetry Submissions
        </h3>
        <div className="space-y-2">
          {recentAssessments.slice(-3).reverse().map(asmt => {
            const scorePct = Math.round((asmt.score / asmt.maxScore) * 100);
            const isHighLag = asmt.actualLagHours > asmt.expectedLagHours;

            return (
              <div
                key={asmt.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">
                    {asmt.course}
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate">{asmt.topic}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Lag: <span className={isHighLag ? 'text-amber-600 font-medium' : 'text-slate-600'}>
                      {asmt.actualLagHours}h
                    </span>{' '}
                    (Expected {asmt.expectedLagHours}h)
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md ${
                      scorePct >= 75
                        ? 'bg-emerald-100 text-emerald-800'
                        : scorePct >= 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
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

      {/* Local Simulation Trigger (for Person A verification) */}
      {onSimulateDrop && (
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onSimulateDrop}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>⚡</span> Simulate Pop Quiz Drop (38% Eigenvalues)
          </button>
        </div>
      )}
    </div>
  );
};
