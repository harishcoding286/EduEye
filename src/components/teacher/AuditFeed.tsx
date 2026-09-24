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

  // Relative time formatter helper
  const getRelativeTime = (timestampIso: string): string => {
    try {
      const date = new Date(timestampIso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);

      // If created recently in session (less than 2 hours or same day)
      if (diffSec < 45) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;

      // Fallback to time string
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Today';
    }
  };

  const getActionBadge = (actionType: AuditLog['actionType']) => {
    switch (actionType) {
      case 'AUTO_SCHEDULED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            AUTO_SCHEDULED
          </span>
        );
      case 'QUIZ_RESOLVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            QUIZ_RESOLVED
          </span>
        );
      case 'TA_ESCALATED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200">
            TA_ESCALATED
          </span>
        );
      default:
        return null;
    }
  };

  const getActionIcon = (actionType: AuditLog['actionType']) => {
    switch (actionType) {
      case 'AUTO_SCHEDULED':
        return '🤖';
      case 'QUIZ_RESOLVED':
        return '✅';
      case 'TA_ESCALATED':
        return '🚨';
      default:
        return '📌';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Autonomous Audit Feed</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </h2>
          <p className="text-[11px] text-slate-500">Immutable ledger of AI actions & resolutions</p>
        </div>
        <span className="text-[10px] font-mono font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full">
          {logs.length} events
        </span>
      </div>

      {/* Feed list */}
      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[580px] p-2 space-y-1">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No audit log entries recorded yet.
          </div>
        ) : (
          logs.map((log) => {
            const studentName = studentNameMap.get(log.studentId) || log.studentId;
            const relativeTime = getRelativeTime(log.timestamp);
            const timeString = new Date(log.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={log.id}
                className="p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm" title={log.actionType}>
                      {getActionIcon(log.actionType)}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {studentName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({log.studentId})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-600">{relativeTime}</span>
                    <span className="text-[10px] opacity-70">({timeString})</span>
                  </div>
                </div>

                <div className="mb-2">{getActionBadge(log.actionType)}</div>

                <p className="text-xs text-slate-600 leading-relaxed font-sans line-clamp-3 group-hover:line-clamp-none transition-all">
                  {log.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AuditFeed;
