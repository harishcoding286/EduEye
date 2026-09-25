'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import type { PluginDef } from '@fullcalendar/core';
import type { AdaptiveScheduleResult, ScheduledEvent } from '@/types/schedule';
import { ScheduleDiffBanner } from './ScheduleDiffBanner';
import { RebalanceModal } from './RebalanceModal';
import { downloadICS } from '@/lib/icsExport';

// FullCalendar dynamically imported — avoids SSR window errors
const FullCalendar = dynamic(() => import('@fullcalendar/react').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#C8DFDB] border-t-[#3368A0] rounded-full animate-spin" />
    </div>
  ),
});

interface WeeklyCalendarViewProps {
  initialResult: AdaptiveScheduleResult;
  studentName: string;
  studentId: string;
  onRebalance: () => AdaptiveScheduleResult;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function KPIChip({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-2.5 border flex flex-col gap-0.5 ${
      accent ? 'bg-[#3368A0] border-[#3368A0] text-white' : 'bg-white/80 border-white/90 text-slate-900'
    }`}>
      <span className={`text-[9px] font-black uppercase tracking-widest ${accent ? 'text-[#C8DFDB]' : 'text-[#66A3BF]'}`}>
        {label}
      </span>
      <span className={`text-lg font-black ${accent ? 'text-white' : 'text-[#3368A0]'}`}>{value}</span>
    </div>
  );
}

// Legend item
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-full border border-white/40 shrink-0" style={{ background: color }} />
      <span className="text-[10px] font-bold text-slate-600">{label}</span>
    </div>
  );
}

export function WeeklyCalendarView({
  initialResult,
  studentName,
  studentId,
  onRebalance,
}: WeeklyCalendarViewProps) {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<AdaptiveScheduleResult>(initialResult);
  const [showDiffs, setShowDiffs] = useState(initialResult.diffs.length > 0);
  const [isRebalanceModalOpen, setIsRebalanceModalOpen] = useState(false);
  const [gcalStatus, setGcalStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [gcalMessage, setGcalMessage] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<ScheduledEvent | null>(null);
  const [pluginsLoaded, setPluginsLoaded] = useState(false);
  const [plugins, setPlugins] = useState<PluginDef[]>([]);

  // Dynamically load FullCalendar plugins client-side
  useEffect(() => {
    Promise.all([
      import('@fullcalendar/timegrid'),
      import('@fullcalendar/daygrid'),
      import('@fullcalendar/interaction'),
    ]).then(([tg, dg, ia]) => {
      setPlugins([tg.default, dg.default, ia.default]);
      setPluginsLoaded(true);
    });
  }, []);

  // Handle Google Calendar redirect status
  useEffect(() => {
    const gcal = searchParams.get('gcal');
    const synced = searchParams.get('synced');
    const reason = searchParams.get('reason');
    if (gcal === 'success') {
      setGcalStatus('success');
      setGcalMessage(`${synced} focus events synced to Google Calendar.`);
    } else if (gcal === 'error') {
      setGcalStatus('error');
      const messages: Record<string, string> = {
        not_configured: 'Add GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET to .env.local to enable sync.',
        token_failed: 'OAuth token exchange failed. Try again.',
        push_failed: 'Events generated but push to Google Calendar failed.',
      };
      setGcalMessage(messages[reason ?? ''] ?? 'Google Calendar sync failed.');
    }
  }, [searchParams]);

  const handleRebalance = useCallback(() => {
    const newResult = onRebalance();
    setResult(newResult);
    setShowDiffs(newResult.diffs.length > 0);
    setSelectedEvent(null);
  }, [onRebalance]);

  const handleGCalSync = useCallback(() => {
    setGcalStatus('syncing');
    // Redirect to OAuth flow; page will return with ?gcal=success or ?gcal=error
    window.location.href = '/api/gcal-sync';
  }, []);

  const handleExportICS = useCallback(() => {
    downloadICS(result.events, `edueye-${result.weekStart}.ics`);
  }, [result]);

  const fcEvents = result.events.map((ev) => ({
    id: ev.id,
    title: ev.title,
    start: ev.start,
    end: ev.end,
    backgroundColor: ev.color,
    textColor: ev.textColor,
    borderColor: ev.borderColor,
    extendedProps: ev,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-5">

      {/* Header */}
      <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#66A3BF] mb-0.5">
            Adaptive Schedule
          </p>
          <h1 className="text-2xl font-black text-[#3368A0] tracking-tight">
            {studentName} — 7-Day AI Planner
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatDate(result.weekStart)} — {formatDate(result.weekEnd)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Re-balance button */}
          <button
            type="button"
            onClick={() => setIsRebalanceModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-black text-white bg-[#3368A0] hover:bg-[#2b5887] transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Re-balance with AI
          </button>

          {/* Google Calendar Sync */}
          <button
            type="button"
            onClick={handleGCalSync}
            disabled={gcalStatus === 'syncing'}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#3368A0] bg-white/90 hover:bg-[#C8DFDB]/40 border border-[#C8DFDB] transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {gcalStatus === 'syncing' ? 'Syncing...' : 'Sync to Google Calendar'}
          </button>

          {/* ICS Export */}
          <button
            type="button"
            onClick={handleExportICS}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#66A3BF] bg-[#C8DFDB]/30 hover:bg-[#C8DFDB]/60 border border-[#C8DFDB] transition cursor-pointer shadow-sm"
          >
            Export .ics
          </button>
        </div>
      </div>

      {/* Google Calendar status toast */}
      {gcalStatus !== 'idle' && (
        <div className={`rounded-2xl px-5 py-3 border text-xs font-bold flex items-center justify-between ${
          gcalStatus === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{gcalMessage}</span>
          <button type="button" onClick={() => setGcalStatus('idle')} className="text-lg font-black leading-none ml-4 cursor-pointer opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* KPI Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPIChip label="Critical Subject" value={result.criticalSubject} accent />
        <KPIChip label="Focus Sprints" value={`${result.focusSlotsInjected} injected`} />
        <KPIChip label="Auto-rescheduled" value={result.diffs.length} />
        <KPIChip label="Planning Horizon" value="7 days" />
      </div>

      {/* Diff Banner */}
      {showDiffs && (result.diffs.length > 0 || !!result.aiRationale) && (
        <ScheduleDiffBanner
          diffs={result.diffs}
          aiRationale={result.aiRationale}
          onDismiss={() => setShowDiffs(false)}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-1">
        <LegendDot color="#3368A0" label="College Lectures" />
        <LegendDot color="#C8DFDB" label="Personal / Lunch / Rest" />
        <LegendDot color="#ef4444" label="Critical Focus Sprint" />
        <LegendDot color="#f87171" label="Remediation Sprint" />
        <LegendDot color="#66A3BF" label="Auto-rescheduled" />
      </div>

      {/* Calendar */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] p-5 fullcalendar-aero-container">
        {pluginsLoaded && plugins.length === 3 && (
          <FullCalendar
            plugins={plugins}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay',
            }}
            events={fcEvents}
            initialDate={result.weekStart}
            slotMinTime="06:00:00"
            slotMaxTime="23:00:00"
            slotDuration="00:30:00"
            height="auto"
            nowIndicator
            eventClick={({ event }) => {
              setSelectedEvent(event.extendedProps as ScheduledEvent);
            }}
            eventContent={(arg) => (
              <div className="px-1 py-0.5 overflow-hidden">
                <div className="text-[10px] font-black leading-tight truncate">{arg.event.title}</div>
                {arg.event.extendedProps?.topic && (
                  <div className="text-[9px] opacity-80 truncate">{arg.event.extendedProps.topic}</div>
                )}
              </div>
            )}
          />
        )}
      </div>

      {/* Event Detail Panel */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#C8DFDB] shadow-[0_24px_60px_rgba(51,104,160,0.2)] p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <div
                  className="w-3 h-3 rounded-full mb-2"
                  style={{ background: selectedEvent.color }}
                />
                <h3 className="text-base font-black text-slate-900">{selectedEvent.title}</h3>
                {selectedEvent.topic && (
                  <p className="text-xs text-[#66A3BF] mt-0.5 font-medium">{selectedEvent.topic}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#C8DFDB]/20 border border-[#C8DFDB]/60 p-3">
                <div className="text-[9px] font-black uppercase text-[#66A3BF] tracking-wider">Start</div>
                <div className="text-sm font-bold text-[#3368A0] mt-0.5">
                  {new Date(selectedEvent.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="rounded-xl bg-[#C8DFDB]/20 border border-[#C8DFDB]/60 p-3">
                <div className="text-[9px] font-black uppercase text-[#66A3BF] tracking-wider">End</div>
                <div className="text-sm font-bold text-[#3368A0] mt-0.5">
                  {new Date(selectedEvent.end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {selectedEvent.alertScore != null && (
                <div className="rounded-xl bg-[#C8DFDB]/20 border border-[#C8DFDB]/60 p-3 col-span-2">
                  <div className="text-[9px] font-black uppercase text-[#66A3BF] tracking-wider mb-1">
                    Cognitive Alertness
                  </div>
                  <div className="w-full bg-[#C8DFDB]/40 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-[#3368A0] rounded-full"
                      style={{ width: `${selectedEvent.alertScore}%` }}
                    />
                  </div>
                  <div className="text-xs font-bold text-[#3368A0] mt-1">{selectedEvent.alertScore}%</div>
                </div>
              )}
              {selectedEvent.isRescheduled && (
                <div className="col-span-2 rounded-xl bg-[#66A3BF]/10 border border-[#66A3BF]/30 p-3">
                  <div className="text-[9px] font-black uppercase text-[#66A3BF] tracking-wider mb-1">
                    Auto-rescheduled
                  </div>
                  <p className="text-[11px] text-slate-600">{selectedEvent.diffReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Rebalance Modal */}
      <RebalanceModal
        isOpen={isRebalanceModalOpen}
        onClose={() => setIsRebalanceModalOpen(false)}
        currentSchedule={result}
        studentId={studentId}
        onScheduleUpdated={(newSchedule) => {
          setResult(newSchedule);
          setShowDiffs(true);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}
