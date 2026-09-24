'use client';

import React, { useMemo } from 'react';
import type { AuditLog, StudentProfile } from '@/types';
import { useAppContext } from '@/context/AppContext';

export interface AuditFeedProps {
  logs?: AuditLog[];
  cohort?: StudentProfile[];
}

export function AuditFeed({ logs: propLogs, cohort: propCohort }: AuditFeedProps) {
  const { auditLogs: contextLogs, cohort: contextCohort } = useAppContext();

  const logs = propLogs ?? contextLogs;
  const cohort = propCohort ?? contextCohort;

  const studentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    cohort.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [cohort]);

  const getRelativeTime = (timestampIso: string): string => {
    try {
      const date = new Date(timestampIso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);

      if (diffSec < 45) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;

      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Today';
    }
  };

  const getActionBadge = (actionType: AuditLog['actionType']) => {
    switch (actionType) {
      case 'AUTO_SCHEDULED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
            AUTO_SCHEDULED
          </span>
        );
      case 'QUIZ_RESOLVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            QUIZ_RESOLVED
          </span>
        );
      case 'TA_ESCALATED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
            TA_ESCALATED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
            {actionType}
          </span>
        );
    }
  };

  return (
    <div className="bg-white/65 backdrop-blur-2xl border border-white/80 shadow-[0_16px_40px_-12px_rgba(0,120,255,0.08)] rounded-3xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200/60 flex items-center justify-between bg-white/40">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Autonomous Audit Feed</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Immutable ledger of engine actions &amp; resolutions</p>
        </div>
        <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200/60">
          {logs.length} events
        </span>
      </div>

      {/* Feed list */}
      <div className="divide-y divide-slate-100/90 overflow-y-auto max-h-[580px] p-4 space-y-2">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No audit log entries recorded yet.
          </div>
        ) : (
          logs.map((log) => {
            const studentName = studentNameMap.get(log.studentId) || log.studentId;
            const relativeTime = getRelativeTime(log.timestamp);

            return (
              <div
                key={log.id}
                className="p-4 rounded-2xl hover:bg-white/80 transition-colors flex items-start gap-3.5 bg-white/40 border border-slate-100/80"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-extrabold text-xs text-slate-900 truncate">
                      {studentName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {relativeTime}
                    </span>
                  </div>

                  <div className="mb-2">
                    {getActionBadge(log.actionType)}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {log.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AuditFeed;
