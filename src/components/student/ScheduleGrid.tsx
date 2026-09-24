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
    <div className="rounded-[2.2rem] bg-white/75 backdrop-blur-2xl border-2 border-white/95 shadow-[0_16px_40px_rgba(147,197,253,0.2),inset_0_2px_4px_rgba(255,255,255,0.95)] p-8 flex flex-col h-full w-full relative overflow-hidden">
      {/* Specular Top Sheen */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200/60 mb-6 gap-3">
        <div>
          <span className="text-[10px] font-black tracking-wider uppercase text-blue-500 block mb-0.5">
            Adaptive Day Planner ☁️
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Today's Schedule</span>
            <span className="text-xl">📅</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Smart cognitive slots &amp; guaranteed lunch recharge 🥪
          </p>
        </div>

        {/* Cute Legend */}
        <div className="flex items-center gap-3 text-xs font-black">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 shadow-sm">
            <span>🎒</span> Class
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 shadow-sm">
            <span>☕</span> Personal
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 shadow-sm">
            <span>⚡</span> Focus Sprint
          </span>
        </div>
      </div>

      {/* Spacious Event Timeline */}
      <div className="space-y-4 overflow-y-auto pr-1 flex-1">
        {sortedEvents.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-bold">
            No events scheduled for today. Time to relax! 🌈
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
                  className={`min-h-[5.5rem] p-5 rounded-3xl transition-all cursor-pointer relative overflow-hidden group border-2 ${
                    isCompleted
                      ? 'bg-gradient-to-r from-emerald-100/90 via-teal-50/90 to-emerald-100/80 border-emerald-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_12px_28px_rgba(16,185,129,0.2)] hover:scale-[1.01]'
                      : 'bg-gradient-to-r from-amber-100/95 via-yellow-50/95 to-amber-100/90 border-amber-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),0_14px_32px_rgba(245,158,11,0.32)] hover:scale-[1.01] hover:border-amber-500'
                  }`}
                >
                  {/* Top Specular Gloss Line */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/95 to-transparent pointer-events-none" />

                  {/* Left Accent Bar */}
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-2.5 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-b from-amber-400 to-amber-600 animate-pulse'
                    }`}
                  />

                  <div className="flex items-center justify-between gap-4 pl-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm ${
                            isCompleted
                              ? 'bg-emerald-200/90 text-emerald-950 border-emerald-300'
                              : 'bg-amber-300 text-amber-950 border-amber-400/90 animate-pulse'
                          }`}
                        >
                          {isCompleted ? '🌸 Deficit Mastered!' : '⚡ 45-Min Focus Sprint'}
                        </span>
                        <span className="text-xs font-mono font-black text-slate-800">
                          {startTime} – {endTime}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
                          (Cognitive Peak Slot ✨)
                        </span>
                      </div>

                      <h3 className="font-black text-slate-900 text-base tracking-tight group-hover:text-amber-950 transition-colors">
                        {event.title}
                      </h3>

                      {event.topic && (
                        <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <span>🎯 Target Topic:</span>
                          <span className="font-black text-slate-900">{event.topic}</span>
                        </p>
                      )}
                    </div>

                    {/* High-Gloss Action Button */}
                    <div className="shrink-0 text-right">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-900 bg-white/90 px-4 py-2 rounded-2xl border border-emerald-300 shadow-sm">
                          <span>✨</span> Mastered (+30 pts)
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 text-xs font-black text-slate-950 bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 px-4 py-2.5 rounded-2xl border border-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.9),0_6px_18px_rgba(245,158,11,0.35)] transition-all group-hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <span>✨</span> Start Micro-Drill →
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
                  className="min-h-[4.5rem] p-4 rounded-2xl border-2 border-white/90 bg-white/80 hover:bg-white transition-all cursor-pointer pl-5 relative shadow-[0_4px_16px_rgba(96,165,250,0.12)] group hover:scale-[1.01]"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-b from-sky-400 to-blue-500 rounded-l-2xl" />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider bg-blue-100/80 px-2.5 py-0.5 rounded-lg border border-blue-200/60">
                          🎒 Lecture
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-600">
                          {startTime} – {endTime}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-800 text-sm mt-1">{event.title}</h3>
                      {event.topic && (
                        <span className="text-xs font-medium text-slate-500">Topic: {event.topic}</span>
                      )}
                    </div>
                    {event.status === 'COMPLETED' ? (
                      <span className="text-xs text-emerald-600 font-black bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                        Attended ✓
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-bold">Upcoming ☁️</span>
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
                className="min-h-[4.5rem] p-4 rounded-2xl border-2 border-white/80 bg-white/60 hover:bg-white/85 transition-all cursor-pointer pl-5 relative shadow-sm group hover:scale-[1.01]"
              >
                <div className="absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-b from-purple-300 to-indigo-300 rounded-l-2xl" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider bg-purple-100/70 px-2.5 py-0.5 rounded-lg border border-purple-200/50">
                        ☕ Personal / Rest
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {startTime} – {endTime}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-700 text-sm mt-1">{event.title}</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">Protected 🛡️</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Hourly Reference Markers */}
      <div className="pt-5 border-t border-slate-200/60 mt-5">
        <div className="flex justify-between text-[10px] font-black text-slate-400 font-mono">
          <span>08:00</span>
          <span>10:00</span>
          <span className="text-amber-600">12:00 (Lunch 🥪)</span>
          <span className="text-blue-600">14:00 (Peak Focus ⚡)</span>
          <span>16:00</span>
          <span>18:00</span>
          <span>20:00</span>
        </div>
      </div>
    </div>
  );
};
