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
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#C8DFDB]/50 text-[#3368A0] border border-[#C8DFDB]">
            AUTO_SCHEDULED
          </span>
        );
      case 'QUIZ_RESOLVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#3368A0]/10 text-[#3368A0] border border-[#3368A0]/20">
            QUIZ_RESOLVED
          </span>
        );
      case 'TA_ESCALATED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            TA_ESCALATED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
            {actionType}
          </span>
        );
    }
  };

  return (
    <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] overflow-hidden flex flex-col h-full relative">
      {/* Header */}
      <div className="p-5 border-b border-[#C8DFDB]/60 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Audit Feed</span>
            <span className="inline-flex rounded-full h-2 w-2 bg-[#3368A0]"></span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Execution telemetry stream</p>
        </div>
        <span className="text-[10px] font-mono font-bold bg-[#C8DFDB]/30 text-[#3368A0] px-2.5 py-0.5 rounded-full border border-[#C8DFDB]">
          {logs.length} events
        </span>
      </div>

      {/* Feed list */}
      <div className="divide-y divide-[#C8DFDB]/40 overflow-y-auto max-h-[580px] p-3 space-y-2">
        {logs.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No audit log entries recorded.
          </div>
        ) : (
          logs.map((log) => {
            const studentName = studentNameMap.get(log.studentId) || log.studentId;
            const relativeTime = getRelativeTime(log.timestamp);

            return (
              <div
                key={log.id}
                className="p-3.5 rounded-xl hover:bg-[#C8DFDB]/15 transition-all flex items-start gap-3 bg-white/70 border border-[#C8DFDB]/60 shadow-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {studentName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {relativeTime}
                    </span>
                  </div>

                  <div className="mb-1.5">
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
