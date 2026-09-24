'use client';

import React from 'react';
import type { CalendarEvent } from '@/types';

export interface ScheduleGridProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

/**
 * Formats ISO string (e.g. "2026-09-24T09:00:00.000Z") to "09:00"
 */
function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const mins = d.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
  } catch {
    return isoString;
  }
}

const HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00',
];

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ events, onEventClick }) => {
  // Sort events chronologically
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Today's Dynamic Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">Chronobiological execution view (08:00 – 20:00)</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Class
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-400"></span> Personal
          </span>
          <span className="flex items-center gap-1.5 font-medium text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span> Remediation
          </span>
        </div>
      </div>

      {/* Time Grid / Agenda Hybrid */}
      <div className="space-y-3 overflow-y-auto pr-1 flex-1">
        {sortedEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No events scheduled for today.
          </div>
        ) : (
          sortedEvents.map(event => {
            const isRemediation = event.category === 'REMEDIATION_LOCK';
            const isClass = event.category === 'CLASS';
            const isPersonal = event.category === 'PERSONAL';
            const isCompleted = event.status === 'COMPLETED';

            const startTime = formatTime(event.startTime);
            const endTime = formatTime(event.endTime);

            if (isRemediation) {
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                    isCompleted
                      ? 'bg-emerald-50/80 border-emerald-400/80 hover:bg-emerald-100/70 shadow-sm'
                      : 'bg-amber-50/90 border-amber-400 animate-pulse-fast shadow-md hover:shadow-lg hover:border-amber-500'
                  }`}
                >
                  {/* Status indicator bar */}
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />

                  <div className="flex items-start justify-between gap-3 pl-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-200 text-emerald-800'
                              : 'bg-amber-200 text-amber-900 animate-pulse'
                          }`}
                        >
                          {isCompleted ? '✓ Remediated' : '🎯 Focus Sprint'}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-600">
                          {startTime} – {endTime}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base mt-1.5 group-hover:text-amber-900">
                        {event.title}
                      </h3>

                      {event.topic && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          Target Deficit: <span className="font-semibold text-slate-800">{event.topic}</span>
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      {isCompleted ? (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                          Score Restored
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-200/90 px-3 py-1.5 rounded-lg group-hover:bg-amber-300 transition-colors">
                          Start Drill →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            if (isClass) {
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="p-3.5 rounded-xl border border-blue-200/70 bg-gradient-to-r from-blue-50/60 to-slate-50 hover:bg-blue-50 transition-all cursor-pointer pl-4 relative"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500 rounded-l-xl" />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide bg-blue-100/70 px-2 py-0.5 rounded">
                          Class
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {startTime} – {endTime}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-800 text-sm mt-1">{event.title}</h3>
                      {event.topic && (
                        <span className="text-xs text-slate-500">Topic: {event.topic}</span>
                      )}
                    </div>
                    {event.status === 'COMPLETED' && (
                      <span className="text-xs text-slate-400 font-medium">Completed</span>
                    )}
                  </div>
                </div>
              );
            }

            // 'PERSONAL'
            return (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-100/70 transition-all cursor-pointer pl-4 relative"
              >
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-zinc-400 rounded-l-xl" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wide bg-zinc-200/70 px-2 py-0.5 rounded">
                        Personal
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {startTime} – {endTime}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-700 text-sm mt-1">{event.title}</h3>
                  </div>
                  <span className="text-xs text-zinc-400">Scheduled</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Hourly Reference Markers */}
      <div className="pt-4 border-t border-slate-100 mt-4">
        <div className="flex justify-between text-[11px] text-slate-400 font-mono overflow-x-auto pb-1">
          {HOURS.filter((_, idx) => idx % 2 === 0).map(h => (
            <span key={h}>{h}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
