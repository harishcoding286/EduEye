'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { StudentAnalytics, SubjectAnalytics, GeneratedQuiz } from '@/types/student-db';
import { DuolingoQuizModal } from './DuolingoQuizModal';
import { fetchQuizWithRetry } from '@/lib/fetchQuizWithRetry';

interface AnalyticsViewProps {
  analytics: StudentAnalytics;
  studentName: string;
}

// ── Fire Streak Badge ────────────────────────────────────────────────────────
function StreakBadge({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black shadow-sm shrink-0">
      <svg className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
        <path d="M12 23c-4.97 0-9-4.03-9-9 0-4.08 2.68-7.79 6.64-9.19.46-.16.94.13 1.05.61.05.21.01.44-.12.61-.96 1.34-1.57 3.01-1.57 4.97 0 .55.45 1 1 1s1-.45 1-1c0-1.88.62-3.66 1.76-5.11.23-.29.62-.39.96-.24.34.15.54.51.49.88-.34 2.45.31 4.97 1.79 6.89.28.36.78.47 1.18.26.4-.21.61-.68.49-1.12-.48-1.78-.3-3.66.52-5.3.16-.32.52-.51.88-.45.36.05.66.32.72.68 1.13 6.62-3.13 12.38-8.8 12.38z" />
      </svg>
      <span>{days} Day Streak</span>
    </div>
  );
}

// ── Individual Subject Card ──────────────────────────────────────────────────
function SubjectCard({
  subject,
  isCritical,
  onStartQuiz,
  quizReady,
  streak,
}: {
  subject: SubjectAnalytics;
  isCritical: boolean;
  onStartQuiz: () => void;
  quizReady: boolean;
  streak: number;
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

  // Textual trend without numbers or "pts"
  const trendLabel =
    subject.trend === 'IMPROVING'
      ? 'Improving'
      : subject.trend === 'DECLINING'
      ? 'Declining'
      : 'Stable';

  return (
    <div
      className={`rounded-3xl bg-white/85 backdrop-blur-xl border shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] p-6 flex flex-col gap-4 relative overflow-hidden transition-all ${
        isCritical
          ? 'border-rose-300 shadow-[0_12px_40px_-8px_rgba(220,38,38,0.15)]'
          : 'border-white'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#66A3BF]">
              {subject.code}
            </span>
            {isCritical && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                Critical Deficit
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

      {/* Mini Trajectory Chart */}
      <div>
        <p className="text-[10px] font-black uppercase text-[#66A3BF] tracking-wider mb-2">
          Assessment Trajectory
        </p>
        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#66A3BF', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 50]}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(val) => [`${val} / 50`, 'Score']}
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid #C8DFDB',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              />
              <Bar
                dataKey="score"
                fill={isCritical ? '#f87171' : '#3368A0'}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weak concepts */}
      {subject.conceptWeaknesses.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase text-[#66A3BF] tracking-wider mb-1.5">
            Weak Concepts Identified
          </p>
          <div className="flex flex-wrap gap-1.5">
            {subject.conceptWeaknesses.map((c) => (
              <span
                key={c}
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quiz launch button with Streak */}
      {isCritical && (
        <div className="flex items-center gap-2 mt-1">
          <StreakBadge days={streak} />
          <button
            type="button"
            onClick={onStartQuiz}
            disabled={!quizReady}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black text-white transition shadow-sm flex items-center justify-center gap-2 ${
              quizReady
                ? 'bg-rose-500 hover:bg-rose-600 cursor-pointer'
                : 'bg-rose-300 cursor-not-allowed'
            }`}
          >
            {quizReady ? (
              'Revision Quiz Ready →'
            ) : (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                Preparing quiz...
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Analytics View (page-level) ───────────────────────────────────────────────
export function AnalyticsView({ analytics, studentName }: AnalyticsViewProps) {
  const [quizOpen, setQuizOpen] = useState(false);
  const [streak, setStreak] = useState<number>(3);

  // Initialize and listen for streak updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('edueye_learning_streak');
      if (saved) {
        setStreak(parseInt(saved, 10));
      } else {
        localStorage.setItem('edueye_learning_streak', '3');
      }

      const handleStreakUpdate = () => {
        const updated = localStorage.getItem('edueye_learning_streak');
        if (updated) setStreak(parseInt(updated, 10));
      };

      window.addEventListener('edueye_streak_updated', handleStreakUpdate);
      return () => window.removeEventListener('edueye_streak_updated', handleStreakUpdate);
    }
  }, []);

  // ── Prefetch state ────────────────────────────────────────────────────────
  const [prefetchedQuiz, setPrefetchedQuiz] = useState<GeneratedQuiz | null>(null);
  const [prefetchStatus, setPrefetchStatus] = useState<
    'idle' | 'loading' | 'retrying' | 'ready' | 'error'
  >('idle');
  const [retryInfo, setRetryInfo] = useState<{ attempt: number; delayMs: number } | null>(null);

  const { criticalSubject, subjects } = analytics;

  const runPrefetch = useCallback(async () => {
    setPrefetchStatus('loading');
    setRetryInfo(null);

    try {
      const quiz = await fetchQuizWithRetry(
        {
          subject: criticalSubject.name,
          weakTopics: criticalSubject.conceptWeaknesses,
          avgScore: criticalSubject.avgCATScore,
        },
        8, // max 8 attempts
        (attempt, delayMs) => {
          setPrefetchStatus('retrying');
          setRetryInfo({ attempt, delayMs });
        }
      );
      setPrefetchedQuiz(quiz);
      setPrefetchStatus('ready');
    } catch {
      setPrefetchStatus('error');
    }
  }, [criticalSubject]);

  useEffect(() => {
    runPrefetch();
  }, [runPrefetch]);

  const quizReady = prefetchStatus === 'ready' && prefetchedQuiz !== null;

  return (
    <>
      {quizOpen && (
        <DuolingoQuizModal
          subject={criticalSubject.name}
          weakTopics={criticalSubject.conceptWeaknesses}
          avgScore={criticalSubject.avgCATScore}
          prefetchedQuiz={prefetchedQuiz}
          onClose={() => setQuizOpen(false)}
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
              Granular CAT trajectory, assignment velocity &amp; concept deficits
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
              {/* Prefetch status indicator */}
              <p className="text-[11px] text-rose-700 mt-0.5">
                {prefetchStatus === 'loading' && 'Preparing AI diagnostic drill (10 questions)...'}
                {prefetchStatus === 'retrying' && retryInfo && (
                  `High demand — retrying quiz generation (attempt ${retryInfo.attempt})...`
                )}
                {prefetchStatus === 'ready' && 'AI diagnostic drill is ready (10 questions) — click to start immediately.'}
                {prefetchStatus === 'error' && 'Quiz generation failed. You can retry from inside the quiz.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <StreakBadge days={streak} />
            <button
              type="button"
              onClick={() => setQuizOpen(true)}
              disabled={!quizReady && prefetchStatus !== 'error'}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-black text-white transition shadow-sm flex items-center gap-2 ${
                quizReady || prefetchStatus === 'error'
                  ? 'bg-rose-500 hover:bg-rose-600 cursor-pointer'
                  : 'bg-rose-300 cursor-not-allowed'
              }`}
            >
              {prefetchStatus === 'loading' || prefetchStatus === 'retrying' ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  Preparing...
                </>
              ) : (
                'Start Revision Quiz →'
              )}
            </button>
          </div>
        </div>

        {/* Subject grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjects.map((sub) => (
            <SubjectCard
              key={sub.id}
              subject={sub}
              isCritical={sub.id === criticalSubject.id}
              onStartQuiz={() => setQuizOpen(true)}
              quizReady={quizReady || prefetchStatus === 'error'}
              streak={streak}
            />
          ))}
        </div>
      </div>
    </>
  );
}
