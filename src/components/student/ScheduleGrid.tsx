'use client';

import React, { useState } from 'react';
import type { CalendarEvent } from '@/types';
import { FullCalendarView } from './FullCalendarView';

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
  const [viewMode, setViewMode] = useState<'FLUID' | 'FULLCALENDAR'>('FLUID');

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] p-7 flex flex-col h-full w-full relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#C8DFDB]/60 mb-5 gap-3">
        <div>
          <span className="text-[10px] font-black tracking-wider uppercase text-[#66A3BF] block mb-0.5">
            Planner
          </span>
          <h2 className="text-xl font-black text-[#3368A0] tracking-tight">
            Today's Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimal cognitive slots and preserved lunch rest.
          </p>
        </div>

        {/* View Switcher & Legend */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="inline-flex rounded-xl bg-[#C8DFDB]/30 p-1 border border-[#C8DFDB] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('FLUID')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'FLUID'
                  ? 'bg-[#3368A0] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('FULLCALENDAR')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'FULLCALENDAR'
                  ? 'bg-[#3368A0] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FullCalendar
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#3368A0]/10 text-[#3368A0] border border-[#3368A0]/20">
              Lecture
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#C8DFDB]/40 text-slate-700 border border-[#C8DFDB]">
              Rest
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              Remediation
            </span>
          </div>
        </div>
      </div>

      {/* View Rendering */}
      {viewMode === 'FULLCALENDAR' ? (
        <div className="flex-1 overflow-y-auto">
          <FullCalendarView events={events} onEventClick={onEventClick} />
        </div>
      ) : (
        <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
          {sortedEvents.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-semibold">
              No events scheduled for today.
            </div>
          ) : (
            sortedEvents.map((event) => {
              const isRemediation = event.category === 'REMEDIATION_LOCK';
              const isClass = event.category === 'CLASS';
              const isCompleted = event.status === 'COMPLETED';

              const startTime = formatTime(event.startTime);
              const endTime = formatTime(event.endTime);

              // ── Remediation Focus Block ──
              if (isRemediation) {
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`p-4 rounded-2xl transition-all cursor-pointer relative overflow-hidden group border ${
                      isCompleted
                        ? 'bg-[#C8DFDB]/20 border-[#C8DFDB] hover:bg-[#C8DFDB]/30'
                        : 'bg-amber-50/70 border-amber-300 hover:border-amber-400 hover:bg-amber-50'
                    }`}
                  >
                    <div
                      className={`absolute top-0 left-0 bottom-0 w-2 ${
                        isCompleted ? 'bg-[#3368A0]' : 'bg-amber-500'
                      }`}
                    />

                    <div className="flex items-center justify-between gap-4 pl-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              isCompleted
                                ? 'bg-[#C8DFDB]/60 text-[#3368A0] border-[#C8DFDB]'
                                : 'bg-amber-200 text-amber-900 border-amber-300'
                            }`}
                          >
                            {isCompleted ? 'Deficit Cleared' : '45-Min Focus Sprint'}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700">
                            {startTime} – {endTime}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                          {event.title}
                        </h3>

                        {event.topic && (
                          <p className="text-xs text-slate-600 font-medium">
                            Topic: <span className="font-bold text-slate-800">{event.topic}</span>
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        {isCompleted ? (
                          <span className="text-xs font-bold text-[#3368A0] bg-white px-3 py-1.5 rounded-xl border border-[#C8DFDB]">
                            Mastered (+30 pts)
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="text-xs font-bold text-white bg-[#3368A0] hover:bg-[#2b5887] px-3.5 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            Start Micro-Drill →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // ── Class Event Card ──
              if (isClass) {
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="p-3.5 rounded-2xl border border-[#C8DFDB] bg-white/70 hover:bg-white transition-all cursor-pointer pl-4 relative shadow-sm group"
                  >
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#3368A0] rounded-l-2xl" />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#3368A0] uppercase tracking-wider bg-[#3368A0]/10 px-2 py-0.5 rounded-md border border-[#3368A0]/20">
                            Lecture
                          </span>
                          <span className="text-xs font-mono text-slate-600">
                            {startTime} – {endTime}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-xs mt-1">{event.title}</h3>
                        {event.topic && (
                          <span className="text-[11px] text-slate-500 font-normal">Topic: {event.topic}</span>
                        )}
                      </div>
                      {event.status === 'COMPLETED' ? (
                        <span className="text-xs text-[#3368A0] font-bold bg-[#C8DFDB]/30 px-2.5 py-0.5 rounded-lg border border-[#C8DFDB]">
                          Attended
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Scheduled</span>
                      )}
                    </div>
                  </div>
                );
              }

              // ── Personal / Rest Event Card ──
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-white/50 hover:bg-white/75 transition-all cursor-pointer pl-4 relative shadow-xs group"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#66A3BF] rounded-l-2xl" />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#66A3BF] uppercase tracking-wider bg-[#C8DFDB]/30 px-2 py-0.5 rounded-md border border-[#C8DFDB]">
                          Rest / Personal
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {startTime} – {endTime}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-700 text-xs mt-1">{event.title}</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Protected</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Hourly Reference Markers */}
      <div className="pt-4 border-t border-[#C8DFDB]/60 mt-4">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
          <span>08:00</span>
          <span>10:00</span>
          <span className="text-[#3368A0]">12:00 (Lunch)</span>
          <span className="text-[#66A3BF]">14:00 (Focus Slot)</span>
          <span>16:00</span>
          <span>18:00</span>
          <span>20:00</span>
        </div>
      </div>
    </div>
  );
};
