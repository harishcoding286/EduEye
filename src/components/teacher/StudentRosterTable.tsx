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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-300/60">
            OPTIMAL
          </span>
        );
      case 'REMEDIATING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-800 border border-amber-300/60">
            REMEDIATING
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100/90 text-rose-800 border border-rose-300/70 animate-pulse">
            CRITICAL
          </span>
        );
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 font-extrabold';
    if (score >= 60) return 'text-amber-700 font-extrabold';
    return 'text-rose-600 font-extrabold';
  };

  return (
    <div className="bg-white/65 backdrop-blur-2xl border border-white/80 shadow-[0_16px_40px_-12px_rgba(0,120,255,0.08)] rounded-3xl overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-7 border-b border-slate-200/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/40">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Student Cohort Telemetry</span>
            <span className="text-xs bg-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              {filteredStudents.length} of {cohort.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Prioritized in real-time by cognitive risk triage (Critical ➔ Remediating ➔ Optimal)
          </p>
        </div>

        {/* Search & Tier Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student..."
              className="text-xs py-2 px-3.5 pl-8 rounded-2xl bg-white/80 border border-slate-200/90 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all shadow-sm"
            />
            <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
          </div>

          <div className="inline-flex rounded-2xl bg-slate-100/90 p-1 border border-slate-200/60 text-xs">
            {['ALL', 'CRITICAL', 'REMEDIATING', 'OPTIMAL'].map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setFilterTier(tier)}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  filterTier === tier
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessId && (
        <div className="px-6 py-2.5 bg-blue-50/80 border-b border-blue-200/80 text-blue-900 text-xs font-semibold flex items-center justify-between">
          <span>🚀 TA 1-on-1 Office Hours session locked into student calendar.</span>
          <span className="text-[11px] font-mono text-blue-500">Autonomous Sync Done</span>
        </div>
      )}

      {/* Roster Table: Generous row height py-4 with clean dark navy slate text */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/30">
              <th
                className="py-4 px-6 cursor-pointer hover:text-slate-700 transition"
                onClick={() => handleSort('name')}
              >
                Student Name {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="py-4 px-6 cursor-pointer hover:text-slate-700 transition"
                onClick={() => handleSort('predictedGrade')}
              >
                Predicted Outcome {sortField === 'predictedGrade' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="py-4 px-6 cursor-pointer hover:text-slate-700 transition"
                onClick={() => handleSort('attendanceRate')}
              >
                Attendance {sortField === 'attendanceRate' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="py-4 px-6">Prerequisite Deficits</th>
              <th className="py-4 px-6">Risk Status</th>
              <th className="py-4 px-6 text-right">Autonomous Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90 text-sm text-slate-800">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                  No students found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const hasRemediationActive = student.calendarEvents.some(
                  (e) => e.category === 'REMEDIATION_LOCK' && e.status === 'SCHEDULED'
                );

                return (
                  <tr
                    key={student.id}
                    onClick={() => handleRowClick(student)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                  >
                    {/* Name */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {student.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {student.id}
                      </div>
                    </td>

                    {/* Predicted Grade */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`text-base ${getScoreColor(student.predictedGrade)}`}>
                          {student.predictedGrade}%
                        </span>
                        {hasRemediationActive && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                            Lock Active
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Attendance */}
                    <td className="py-4 px-6">
                      <div className="text-xs font-semibold text-slate-700">
                        {student.attendanceRate}%
                      </div>
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-slate-600 h-full rounded-full"
                          style={{ width: `${student.attendanceRate}%` }}
                        />
                      </div>
                    </td>

                    {/* Prerequisite Deficits */}
                    <td className="py-4 px-6">
                      {student.activeDeficits.length === 0 ? (
                        <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                          ✓ None
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {student.activeDeficits.slice(0, 2).map((d) => (
                            <span
                              key={d}
                              className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200"
                            >
                              {d.replace(/-/g, ' ')}
                            </span>
                          ))}
                          {student.activeDeficits.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              +{student.activeDeficits.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Risk Tier */}
                    <td className="py-4 px-6">
                      {getRiskBadge(student.riskTier)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={(e) => handleDispatchTA(e, student.id)}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors shadow-sm"
                      >
                        Dispatch TA →
                      </button>
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
