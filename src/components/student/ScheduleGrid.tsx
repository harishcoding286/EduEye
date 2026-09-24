'use client';

import React from 'react';
import type { CalendarEvent } from '@/types';

export interface ScheduleGridProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

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

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ events, onEventClick }) => {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="bg-white/65 backdrop-blur-2xl border border-white/80 shadow-[0_16px_40px_-12px_rgba(0,120,255,0.08)] rounded-3xl p-8 flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200/60 mb-6">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 block mb-0.5">
            Chronobiological Life Schedule
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Today's Timeline
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Active focus windows and cognitive fatigue mitigation buffer
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span> Class
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Personal
          </span>
          <span className="flex items-center gap-1.5 font-bold text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span> Focus Sprint
          </span>
        </div>
      </div>

      {/* Spacious Event Timeline with generous h-16 row rhythm */}
      <div className="space-y-4 overflow-y-auto pr-1 flex-1">
        {sortedEvents.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">
            No events scheduled for today.
          </div>
        ) : (
          sortedEvents.map((event) => {
            const isRemediation = event.category === 'REMEDIATION_LOCK';
            const isClass = event.category === 'CLASS';
            const isCompleted = event.status === 'COMPLETED';

            const startTime = formatTime(event.startTime);
            const endTime = formatTime(event.endTime);

            // ── Selective High-Gloss 3D Highlight: Remediation Focus Block ──
            if (isRemediation) {
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`min-h-[5rem] p-5 rounded-3xl transition-all cursor-pointer relative overflow-hidden group border ${
                    isCompleted
                      ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-400/15 to-emerald-500/10 border-emerald-400/60 shadow-[0_12px_28px_-6px_rgba(16,185,129,0.18)] hover:bg-emerald-500/15'
                      : 'bg-gradient-to-r from-amber-400/15 via-amber-300/25 to-amber-400/20 border-amber-400/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_16px_36px_-8px_rgba(245,158,11,0.32)] hover:border-amber-500'
                  }`}
                >
                  {/* Top Specular Gloss Line */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

                  {/* Left Accent Bar */}
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-2 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                    }`}
                  />

                  <div className="flex items-center justify-between gap-4 pl-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-200/90 text-emerald-900 border border-emerald-300'
                              : 'bg-amber-300/90 text-amber-950 border border-amber-400/80 animate-pulse'
                          }`}
                        >
                          {isCompleted ? '✅ Resolved' : '🎯 Focus Sprint'}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {startTime} – {endTime}
                        </span>
                        <span className="text-[11px] text-slate-500 hidden sm:inline">
                          (45 min cognitive window)
                        </span>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base tracking-tight group-hover:text-amber-950 transition-colors">
                        {event.title}
                      </h3>

                      {event.topic && (
                        <p className="text-xs text-slate-600">
                          Isolated Gap: <span className="font-semibold text-slate-800">{event.topic}</span>
                        </p>
                      )}
                    </div>

                    {/* High-Gloss Action Button */}
                    <div className="shrink-0 text-right">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3.5 py-2 rounded-2xl border border-emerald-300/70 shadow-sm">
                          ✅ Resolved
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-4 py-2.5 rounded-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_6px_18px_rgba(245,158,11,0.35)] transition-all group-hover:scale-105 active:scale-95"
                        >
                          Start Micro-Drill →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // ── Clean Class Event Card ──
            if (isClass) {
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="min-h-[4.5rem] p-4 rounded-2xl border border-slate-200/80 bg-white/70 hover:bg-white transition-all cursor-pointer pl-5 relative shadow-sm group"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-blue-500 rounded-l-2xl" />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/50">
                          Class
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-500">
                          {startTime} – {endTime}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm mt-1">{event.title}</h3>
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

            // ── Clean Personal Event Card ──
            return (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className="min-h-[4.5rem] p-4 rounded-2xl border border-slate-200/60 bg-white/50 hover:bg-white/80 transition-all cursor-pointer pl-5 relative shadow-sm group"
              >
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-slate-300 rounded-l-2xl" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-md">
                        Personal
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-500">
                        {startTime} – {endTime}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-700 text-sm mt-1">{event.title}</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Scheduled</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Hourly Reference Markers */}
      <div className="pt-6 border-t border-slate-200/50 mt-6">
        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>08:00</span>
          <span>10:00</span>
          <span>12:00 (Lunch)</span>
          <span>14:00 (Prime Focus)</span>
          <span>16:00</span>
          <span>18:00</span>
          <span>20:00</span>
        </div>
      </div>
    </div>
  );
};
