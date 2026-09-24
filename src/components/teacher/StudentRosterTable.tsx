'use client';

import React, { useState, useMemo } from 'react';
import type { StudentProfile, RiskTier } from '@/types';
import { useAppContext } from '@/context/AppContext';

export interface StudentRosterTableProps {
  onSelectStudent?: (studentId: string) => void;
}

export function StudentRosterTable({ onSelectStudent }: StudentRosterTableProps) {
  const { cohort, setCurrentStudent, escalateToTA } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'name' | 'predictedGrade' | 'attendanceRate'>('predictedGrade');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [actionSuccessId, setActionSuccessId] = useState<string | null>(null);

  // Filter & Sort Pipeline
  const filteredStudents = useMemo(() => {
    return cohort
      .filter((student) => {
        const matchesQuery = student.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = filterTier === 'ALL' || student.riskTier === filterTier;
        return matchesQuery && matchesTier;
      })
      .sort((a, b) => {
        // Triage Risk Priority: CRITICAL (0) > REMEDIATING (1) > OPTIMAL (2)
        const tierRank: Record<RiskTier, number> = {
          CRITICAL: 0,
          REMEDIATING: 1,
          OPTIMAL: 2,
        };
        const rankDiff = tierRank[a.riskTier] - tierRank[b.riskTier];
        if (rankDiff !== 0) return rankDiff;

        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return sortDirection === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [cohort, searchQuery, filterTier, sortField, sortDirection]);

  const handleSort = (field: 'name' | 'predictedGrade' | 'attendanceRate') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDispatchTA = (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation();
    escalateToTA(studentId);
    setActionSuccessId(studentId);
    setTimeout(() => setActionSuccessId(null), 3000);
  };

  const handleRowClick = (student: StudentProfile) => {
    setCurrentStudent(student);
    if (onSelectStudent) {
      onSelectStudent(student.id);
    }
  };

  const getRiskBadge = (tier: RiskTier) => {
    switch (tier) {
      case 'OPTIMAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300/80">
            OPTIMAL
          </span>
        );
      case 'REMEDIATING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300/80">
            REMEDIATING
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 animate-pulse">
            CRITICAL
          </span>
        );
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 font-bold';
    if (score >= 60) return 'text-amber-600 font-semibold';
    return 'text-red-600 font-bold';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Student Cohort Telemetry</span>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
              {filteredStudents.length} of {cohort.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time mastery tracking, submission velocity, and autonomous remediation status
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 bg-white px-3 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 w-44"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tier Filter Pills */}
          <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5 text-xs font-medium text-slate-600">
            {['ALL', 'CRITICAL', 'REMEDIATING', 'OPTIMAL'].map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setFilterTier(tier)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterTier === tier
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-500 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200/80">
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition"
                onClick={() => handleSort('name')}
              >
                Student Name {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition text-right sm:text-left"
                onClick={() => handleSort('predictedGrade')}
              >
                Predicted Grade {sortField === 'predictedGrade' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition"
                onClick={() => handleSort('attendanceRate')}
              >
                Attendance {sortField === 'attendanceRate' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="py-3 px-4">Recent Velocity</th>
              <th className="py-3 px-4">Concept Status</th>
              <th className="py-3 px-4">Risk Tier</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  No students found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                // Calculate submission velocity from recent assessments
                const recentAsmt = student.recentAssessments[student.recentAssessments.length - 1];
                const lagDelta = recentAsmt
                  ? recentAsmt.actualLagHours - recentAsmt.expectedLagHours
                  : 0;

                const hasRemediationActive = student.calendarEvents.some(
                  (e) => e.category === 'REMEDIATION_LOCK' && e.status === 'SCHEDULED'
                );

                return (
                  <tr
                    key={student.id}
                    onClick={() => handleRowClick(student)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {student.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {student.id}
                      </div>
                    </td>

                    {/* Predicted Grade */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-base ${getScoreColor(student.predictedGrade)}`}>
                          {student.predictedGrade}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {student.predictedGrade >= 80 ? '🎯' : student.predictedGrade >= 60 ? '⚡' : '🔻'}
                        </span>
                      </div>
                    </td>

                    {/* Attendance */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              student.attendanceRate >= 80
                                ? 'bg-emerald-500'
                                : student.attendanceRate >= 60
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${student.attendanceRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600">
                          {student.attendanceRate}%
                        </span>
                      </div>
                    </td>

                    {/* Velocity (Submission Lag vs Expected) */}
                    <td className="py-3.5 px-4">
                      {recentAsmt ? (
                        <div className="text-xs">
                          <span
                            className={`font-semibold ${
                              lagDelta <= 0
                                ? 'text-emerald-600'
                                : lagDelta <= 12
                                ? 'text-amber-600'
                                : 'text-red-600 font-bold'
                            }`}
                          >
                            {lagDelta <= 0 ? `${Math.abs(lagDelta)}h ahead` : `+${lagDelta}h lag`}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[130px]" title={recentAsmt.topic}>
                            {recentAsmt.topic}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Stable</span>
                      )}
                    </td>

                    {/* Concept Status / Deficits */}
                    <td className="py-3.5 px-4">
                      {student.activeDeficits.length === 0 ? (
                        <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium">
                          ✓ No deficits
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {student.activeDeficits.slice(0, 2).map((deficit) => (
                            <span
                              key={deficit}
                              className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                              title={deficit}
                            >
                              {deficit.replace(/-/g, ' ')}
                            </span>
                          ))}
                          {student.activeDeficits.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-semibold self-center">
                              +{student.activeDeficits.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Risk Tier Badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {getRiskBadge(student.riskTier)}
                        {hasRemediationActive && (
                          <span
                            className="text-[11px] text-cyan-600 font-bold"
                            title="Remediation block active"
                          >
                            🔒
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {student.riskTier === 'CRITICAL' ? (
                        <button
                          type="button"
                          onClick={(e) => handleDispatchTA(e, student.id)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg shadow-sm transition-all border ${
                            actionSuccessId === student.id
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200 active:scale-95'
                          }`}
                        >
                          {actionSuccessId === student.id ? '✓ Invite Sent' : 'Dispatch TA Invite'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Autonomous</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentRosterTable;
