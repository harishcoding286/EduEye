'use client';

import React from 'react';
import type { ScheduleDiff } from '@/types/schedule';

interface ScheduleDiffBannerProps {
  diffs: ScheduleDiff[];
  onDismiss: () => void;
}

function formatTime(iso: string): string {
  const t = iso.slice(11, 16); // "09:30"
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function ScheduleDiffBanner({ diffs, onDismiss }: ScheduleDiffBannerProps) {
  if (diffs.length === 0) return null;

  return (
    <div className="rounded-3xl bg-[#66A3BF]/10 border border-[#66A3BF]/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#66A3BF]/15 border-b border-[#66A3BF]/30">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-[#66A3BF] flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#3368A0]">
              Schedule Re-balance
            </p>
            <p className="text-xs font-bold text-slate-700">
              {diffs.length} event{diffs.length > 1 ? 's' : ''} automatically rescheduled
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="w-7 h-7 rounded-xl hover:bg-[#C8DFDB]/60 flex items-center justify-center text-slate-500 hover:text-slate-800 transition text-lg font-bold cursor-pointer"
        >
          ×
        </button>
      </div>

      {/* Diff list */}
      <ul className="divide-y divide-[#C8DFDB]/50">
        {diffs.map((diff) => (
          <li key={diff.eventId} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Event name */}
            <span className="text-xs font-black text-slate-800 min-w-[140px]">
              {diff.eventTitle}
            </span>

            {/* Arrow with times */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-700 font-bold border border-rose-200 line-through">
                {formatTime(diff.fromStart)}
              </span>
              <svg className="w-4 h-4 text-[#66A3BF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                {formatTime(diff.toStart)}
              </span>
            </div>

            {/* Reason */}
            <p className="text-[10px] text-[#66A3BF] font-medium sm:ml-auto max-w-xs">
              {diff.reason}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
