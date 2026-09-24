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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#C8DFDB]/50 text-[#3368A0] border border-[#C8DFDB]">
            OPTIMAL
          </span>
        );
      case 'REMEDIATING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            REMEDIATING
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            CRITICAL
          </span>
        );
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#3368A0] font-black';
    if (score >= 60) return 'text-amber-700 font-black';
    return 'text-rose-600 font-black';
  };

  return (
    <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] overflow-hidden flex flex-col relative">
      {/* Table Toolbar */}
      <div className="p-6 border-b border-[#C8DFDB]/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Cohort Telemetry</span>
            <span className="text-xs bg-[#C8DFDB]/40 text-[#3368A0] px-2.5 py-0.5 rounded-md font-bold border border-[#C8DFDB]">
              {filteredStudents.length} of {cohort.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Priority sorted: Critical, Remediating, Optimal.
          </p>
        </div>

        {/* Search & Tier Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student..."
              className="text-xs py-1.5 px-3 pl-8 rounded-xl bg-white border border-[#C8DFDB] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3368A0] transition-all"
            />
            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="inline-flex rounded-xl bg-[#C8DFDB]/30 p-0.5 border border-[#C8DFDB] text-xs">
            {['ALL', 'CRITICAL', 'REMEDIATING', 'OPTIMAL'].map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setFilterTier(tier)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterTier === tier
                    ? 'bg-[#3368A0] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
        <div className="px-6 py-2 bg-[#C8DFDB]/30 border-b border-[#C8DFDB] text-[#3368A0] text-xs font-semibold flex items-center justify-between">
          <span>TA office hours session scheduled for student.</span>
          <span className="text-[11px] font-mono text-[#66A3BF]">Synced</span>
        </div>
      )}

      {/* Roster Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#C8DFDB]/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-[#C8DFDB]/10">
              <th
                className="py-3 px-5 cursor-pointer hover:text-slate-800 transition"
                onClick={() => handleSort('name')}
              >
                Student Name {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="py-3 px-5 cursor-pointer hover:text-slate-800 transition"
                onClick={() => handleSort('predictedGrade')}
              >
                Projected {sortField === 'predictedGrade' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="py-3 px-5 cursor-pointer hover:text-slate-800 transition"
                onClick={() => handleSort('attendanceRate')}
              >
                Attendance {sortField === 'attendanceRate' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="py-3 px-5">Deficits</th>
              <th className="py-3 px-5">Risk Tier</th>
              <th className="py-3 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#C8DFDB]/40 text-xs text-slate-800">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-slate-400">
                  No students found.
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
                    className="hover:bg-[#C8DFDB]/15 cursor-pointer transition-colors group"
                  >
                    {/* Name */}
                    <td className="py-3 px-5">
                      <div className="font-bold text-slate-900 group-hover:text-[#3368A0] transition-colors">
                        {student.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {student.id}
                      </div>
                    </td>

                    {/* Predicted Grade */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${getScoreColor(student.predictedGrade)}`}>
                          {student.predictedGrade}%
                        </span>
                        {hasRemediationActive && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                            Lock Active
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Attendance */}
                    <td className="py-3 px-5">
                      <div className="font-semibold text-slate-700">
                        {student.attendanceRate}%
                      </div>
                      <div className="w-14 bg-[#C8DFDB]/50 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-[#66A3BF] h-full rounded-full"
                          style={{ width: `${student.attendanceRate}%` }}
                        />
                      </div>
                    </td>

                    {/* Prerequisite Deficits */}
                    <td className="py-3 px-5">
                      {student.activeDeficits.length === 0 ? (
                        <span className="text-slate-400 font-normal">
                          None
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {student.activeDeficits.slice(0, 2).map((d) => (
                            <span
                              key={d}
                              className="text-[10px] font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200"
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
                    <td className="py-3 px-5">
                      {getRiskBadge(student.riskTier)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => handleDispatchTA(e, student.id)}
                        className="text-xs font-bold text-white bg-[#3368A0] hover:bg-[#2b5887] px-3 py-1 rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        Dispatch TA
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
