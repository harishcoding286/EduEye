'use client';

import React, { useState } from 'react';
import type { AdaptiveScheduleResult } from '@/types/schedule';

interface RebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchedule: AdaptiveScheduleResult;
  studentId: string;
  onScheduleUpdated: (newSchedule: AdaptiveScheduleResult) => void;
}

const PRESET_SUGGESTIONS = [
  'Shift heavy study sprints to early mornings (08:00 AM)',
  'I have sports / football practice on Wed & Fri from 17:00 to 19:00',
  'Add extra focus time for Linear Algebra eigenvalues',
  'Experiencing fatigue after 17:30, please keep late evenings free',
  'Need lighter load on weekends due to family commitments',
];

export function RebalanceModal({
  isOpen,
  onClose,
  currentSchedule,
  studentId,
  onScheduleUpdated,
}: RebalanceModalProps) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/rebalance-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentFeedback: feedback.trim(),
          studentId,
          currentSchedule,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to re-balance schedule with AI.');
      }

      onScheduleUpdated(data as AdaptiveScheduleResult);
      onClose();
    } catch (err: unknown) {
      console.error('Rebalance error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error during rebalancing.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: string) => {
    setFeedback((prev) => (prev ? `${prev}. ${preset}` : preset));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl bg-white/95 backdrop-blur-2xl border border-white shadow-[0_24px_60px_rgba(51,104,160,0.2)] p-6 sm:p-7 flex flex-col gap-4 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl hover:bg-[#C8DFDB]/40 text-slate-500 hover:text-slate-800 transition flex items-center justify-center text-lg font-bold cursor-pointer disabled:opacity-50"
        >
          ×
        </button>

        {/* Header */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#66A3BF]">
            Gemini Cognitive Engine
          </span>
          <h2 className="text-xl font-black text-[#3368A0] tracking-tight mt-0.5">
            Re-balance Schedule with AI
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Tell Gemini what is wrong with your current timetable, your lifestyle constraints, or when you feel most alert. Gemini will restructure your schedule while guaranteeing that deficit subjects receive priority remediation.
          </p>
        </div>

        {/* Preset chips */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
            Quick Prompts:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_SUGGESTIONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-[#C8DFDB]/30 hover:bg-[#C8DFDB]/60 text-[#3368A0] border border-[#C8DFDB] transition cursor-pointer text-left"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="student-feedback" className="text-xs font-bold text-slate-700">
              What should be adjusted in your schedule?
            </label>
            <textarea
              id="student-feedback"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={loading}
              placeholder="e.g., I have football practice on Wednesday and Friday 5:00-7:00 PM. I get sleepy after 5 PM, so please move Linear Algebra focus sessions to morning around 8:00 AM before college..."
              className="w-full rounded-2xl border border-[#C8DFDB] bg-white/80 p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3368A0] transition resize-none disabled:bg-slate-100"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-transparent transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#3368A0] hover:bg-[#2b5887] transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  Gemini is Re-balancing...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Optimize with Gemini
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
