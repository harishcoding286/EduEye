'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { SubjectAnalytics, StudentAnalytics } from '@/types/student-db';
import { DuolingoQuizModal } from './DuolingoQuizModal';

interface AnalyticsViewProps {
  analytics: StudentAnalytics;
  studentName: string;
}

// ── Subject Card ──────────────────────────────────────────────────────────────
function SubjectCard({
  subject,
  isCritical,
  onStartQuiz,
  isRemediated,
}: {
  subject: SubjectAnalytics;
  isCritical: boolean;
  onStartQuiz: () => void;
  isRemediated: boolean;
}) {
  const chartData = [
    { name: 'CAT 1', score: subject.cat1Score, max: subject.maxCATScore },
    { name: 'CAT 2', score: subject.cat2Score, max: subject.maxCATScore },
  ];

  const trendColor =
    subject.trend === 'IMPROVING'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : subject.trend === 'DECLINING'
      ? 'text-rose-700 bg-rose-50 border-rose-200'
      : 'text-[#3368A0] bg-[#C8DFDB]/30 border-[#C8DFDB]';

  const trendLabel =
    subject.trend === 'IMPROVING'
      ? `+${subject.catDelta} pts`
      : subject.trend === 'DECLINING'
      ? `${subject.catDelta} pts`
      : 'Stable';

  return (
    <div
      className={`rounded-3xl bg-white/85 backdrop-blur-xl border shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] p-6 flex flex-col gap-4 relative overflow-hidden transition-all ${
        isCritical
          ? 'border-rose-300 shadow-[0_12px_40px_-8px_rgba(220,38,38,0.15)]'
          : 'border-white'
      }`}
    >
      {/* Critical glow pulse ring */}
      {isCritical && (
        <div className="absolute -top-1 -right-1 w-5 h-5">
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500" />
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#66A3BF]">
              {subject.code}
            </span>
            {isCritical && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                Critical Deficit
              </span>
            )}
            {isRemediated && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                Remediated
              </span>
            )}
          </div>
          <h3 className="text-base font-black text-slate-900">{subject.name}</h3>
          <p className="text-[11px] text-slate-500">{subject.faculty}</p>
        </div>

        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border ${trendColor}`}>
          {trendLabel}
        </span>
      </div>

      {/* Scores row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'CAT 1', val: `${subject.cat1Score}/${subject.maxCATScore}` },
          { label: 'CAT 2', val: `${subject.cat2Score}/${subject.maxCATScore}` },
          {
            label: 'Assignments',
            val: `${Math.round(subject.assignmentRate)}%`,
          },
        ].map(({ label, val }) => (
          <div
            key={label}
            className="rounded-xl bg-[#C8DFDB]/20 border border-[#C8DFDB]/60 p-2.5 text-center"
          >
            <div className="text-[9px] font-black uppercase text-[#66A3BF] tracking-wider">
              {label}
            </div>
            <div className="text-sm font-black text-[#3368A0] mt-0.5">{val}</div>
          </div>
        ))}
      </div>

      {/* CAT trajectory mini-chart */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Score Trajectory
        </p>
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={chartData} barGap={8} barCategoryGap="40%">
            <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF2" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, subject.maxCATScore]} tick={{ fontSize: 9, fill: '#cbd5e1' }} axisLine={false} tickLine={false} width={22} />
            <ReferenceLine y={subject.maxCATScore * 0.6} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white border border-[#C8DFDB] rounded-xl p-2 shadow text-xs">
                    <span className="font-bold text-[#3368A0]">{payload[0].value}</span>
                    <span className="text-slate-500">/{subject.maxCATScore}</span>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="score"
              fill={isCritical ? '#f87171' : '#3368A0'}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weak topics */}
      {subject.conceptWeaknesses.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {subject.conceptWeaknesses.map((w) => (
            <span
              key={w}
              className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200"
            >
              {w}
            </span>
          ))}
        </div>
      )}

      {/* CTA for critical subject */}
      {isCritical && !isRemediated && (
        <button
          type="button"
          onClick={onStartQuiz}
          className="w-full py-2.5 rounded-xl text-xs font-black text-white bg-rose-500 hover:bg-rose-600 transition shadow-sm cursor-pointer"
        >
          Revision Quiz Ready — Start Now →
        </button>
      )}
      {isCritical && isRemediated && (
        <div className="w-full py-2.5 rounded-xl text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 text-center">
          Subject Remediated
        </div>
      )}
    </div>
  );
}

// ── Analytics View (page-level) ───────────────────────────────────────────────
export function AnalyticsView({ analytics, studentName }: AnalyticsViewProps) {
  const [quizOpen, setQuizOpen] = useState(false);
  const [isRemediated, setIsRemediated] = useState(false);

  const { criticalSubject, subjects } = analytics;

  return (
    <>
      {quizOpen && (
        <DuolingoQuizModal
          subject={criticalSubject.name}
          weakTopics={criticalSubject.conceptWeaknesses}
          avgScore={criticalSubject.avgCATScore}
          onClose={() => setQuizOpen(false)}
          onRemediated={() => setIsRemediated(true)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66A3BF] mb-0.5">
              Detailed Analytics
            </p>
            <h1 className="text-2xl font-black text-[#3368A0] tracking-tight">
              {studentName} — Subject Breakdown
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Granular CAT trajectory, assignment velocity & concept deficits
            </p>
          </div>
          <Link
            href="/dashboard"
            className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-bold text-[#3368A0] bg-[#C8DFDB]/30 hover:bg-[#C8DFDB]/50 border border-[#C8DFDB] transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Critical alert banner */}
        <div className="rounded-3xl bg-rose-50 border border-rose-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-rose-600 mb-0.5">
                Critical Concept Deficit Detected
              </p>
              <p className="text-sm font-bold text-rose-900">
                {criticalSubject.name} — CAT 1: {criticalSubject.cat1Score}/{criticalSubject.maxCATScore}, CAT 2: {criticalSubject.cat2Score}/{criticalSubject.maxCATScore}
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Avg score {criticalSubject.avgCATScore.toFixed(1)}% &amp; declining — AI diagnostic quiz is available.
              </p>
            </div>
          </div>

          {isRemediated ? (
            <div className="shrink-0 px-4 py-2 rounded-xl text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200">
              Remediated
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setQuizOpen(true)}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-black text-white bg-rose-500 hover:bg-rose-600 transition shadow-sm cursor-pointer"
            >
              Start Revision Quiz →
            </button>
          )}
        </div>

        {/* Subject grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjects.map((sub) => (
            <SubjectCard
              key={sub.id}
              subject={sub}
              isCritical={sub.id === criticalSubject.id}
              isRemediated={isRemediated && sub.id === criticalSubject.id}
              onStartQuiz={() => setQuizOpen(true)}
            />
          ))}
        </div>

        {/* Key topics reference */}
        <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#66A3BF] mb-3">
            Subject Key Topics Reference
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjects.map((sub) => (
              <div key={sub.id} className="rounded-2xl bg-[#C8DFDB]/20 border border-[#C8DFDB]/60 p-3.5">
                <p className="text-xs font-black text-[#3368A0] mb-2">{sub.name}</p>
                <ul className="space-y-1">
                  {sub.keyTopics.map((t) => (
                    <li key={t} className="text-[10px] text-slate-600 flex items-start gap-1.5">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#66A3BF] shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
