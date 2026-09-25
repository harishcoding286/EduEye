'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { GeneratedQuiz, QuizQuestion } from '@/types/student-db';
import { fetchQuizWithRetry } from '@/lib/fetchQuizWithRetry';

interface DuolingoQuizModalProps {
  subject: string;
  weakTopics: string[];
  avgScore: number;
  prefetchedQuiz?: GeneratedQuiz | null;
  onClose: () => void;
  onRemediated?: () => void;
  onQuizCompleted?: (score: number, total: number) => void;
}

type Phase = 'LOADING' | 'QUIZ' | 'COMPLETE' | 'ERROR';

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 0 : (current / total) * 100;
  return (
    <div className="w-full bg-[#C8DFDB]/40 rounded-full h-2.5 overflow-hidden">
      <div
        className="h-full bg-[#3368A0] rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct = total === 0 ? 0 : score / total;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#C8DFDB" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={score === total ? '#10B981' : score >= 6 ? '#3368A0' : '#F59E0B'}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-[#3368A0]">{score}</span>
        <span className="text-xs text-slate-500 font-bold">/ {total}</span>
      </div>
    </div>
  );
}

export function DuolingoQuizModal({
  subject,
  weakTopics,
  avgScore,
  prefetchedQuiz,
  onClose,
  onQuizCompleted,
}: DuolingoQuizModalProps) {
  const [phase, setPhase] = useState<Phase>('LOADING');
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const loadQuiz = useCallback(async () => {
    // If a prefetched quiz is already available, use it immediately
    if (prefetchedQuiz?.questions?.length) {
      setQuiz(prefetchedQuiz);
      setPhase('QUIZ');
      return;
    }

    setPhase('LOADING');
    setErrorMsg('');

    try {
      const data = await fetchQuizWithRetry(
        { subject, weakTopics, avgScore },
        8 // max 8 attempts
      );
      setQuiz(data);
      setPhase('QUIZ');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(msg);
      setPhase('ERROR');
    }
  }, [subject, weakTopics, avgScore, prefetchedQuiz]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const questions: QuizQuestion[] = quiz?.questions ?? [];
  const totalQ = questions.length || 10;
  const currentQ: QuizQuestion | undefined = questions[currentIdx];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === currentQ?.correctIndex) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < totalQ) {
      setCurrentIdx((prev) => prev + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      // Completed quiz
      setPhase('COMPLETE');
      onQuizCompleted?.(correctCount, totalQ);

      // Increment learning streak in localStorage
      if (typeof window !== 'undefined') {
        const currentStreak = parseInt(localStorage.getItem('edueye_learning_streak') || '3', 10);
        const newStreak = currentStreak + 1;
        localStorage.setItem('edueye_learning_streak', String(newStreak));
        window.dispatchEvent(new Event('edueye_streak_updated'));
      }
    }
  };

  const handleRetake = () => {
    setCurrentIdx(0);
    setSelected(null);
    setAnswered(false);
    setCorrectCount(0);
    setPhase('QUIZ');
  };

  const isCorrect = answered && selected === currentQ?.correctIndex;

  // Completion status messaging per requirements
  const getCompletionMessage = () => {
    if (correctCount === totalQ) {
      return {
        heading: 'perfect! good job!',
        sub: 'You answered all questions correctly.',
        color: 'text-emerald-700',
      };
    }
    if (correctCount >= 6) {
      return {
        heading: 'good job keep practicing',
        sub: `You scored ${correctCount}/${totalQ}. Great effort!`,
        color: 'text-[#3368A0]',
      };
    }
    return {
      heading: 'try harder, i believe in you!',
      sub: `You scored ${correctCount}/${totalQ}. Retake the drill to build your fundamentals.`,
      color: 'text-amber-700',
    };
  };

  const completionInfo = getCompletionMessage();
  const canRetake = correctCount <= 5;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl border border-[#C8DFDB] rounded-3xl shadow-[0_24px_60px_rgba(51,104,160,0.2)] overflow-hidden flex flex-col">
        {/* ── HEADER ── */}
        <div className="bg-[#C8DFDB]/25 border-b border-[#C8DFDB]/60 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66A3BF]">
              AI Diagnostic Drill (10 Questions)
            </p>
            <h2 className="text-base font-black text-[#3368A0] tracking-tight">
              {subject}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-[#C8DFDB] flex items-center justify-center text-slate-500 hover:text-slate-800 transition text-lg font-bold cursor-pointer"
            aria-label="Close quiz"
          >
            ×
          </button>
        </div>

        {/* ── LOADING ── */}
        {phase === 'LOADING' && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 px-8">
            <div className="w-10 h-10 border-4 border-[#C8DFDB] border-t-[#3368A0] rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold text-[#3368A0]">Generating your personalized quiz...</p>
              <p className="text-xs text-slate-500 mt-1">Gemini AI is crafting 10 questions tailored to your weak areas</p>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === 'ERROR' && (
          <div className="flex flex-col items-center justify-center py-12 px-8 gap-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
              <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-rose-800">Quiz Generation Failed</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={loadQuiz}
              className="px-5 py-2 rounded-xl text-xs font-black text-white bg-[#3368A0] hover:bg-[#2b5887] transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── ACTIVE QUIZ ── */}
        {phase === 'QUIZ' && currentQ && (
          <div className="flex flex-col flex-1">
            {/* Progress & count */}
            <div className="px-6 pt-4 pb-2 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>Question {currentIdx + 1} of {totalQ}</span>
                <span className="text-[#3368A0] font-black">{correctCount} correct</span>
              </div>
              <ProgressBar current={currentIdx + (answered ? 1 : 0)} total={totalQ} />
            </div>

            {/* Question prompt */}
            <div className="px-6 py-4 flex-1">
              <p className="text-sm font-black text-slate-900 leading-snug">
                {currentQ.questionText}
              </p>
            </div>

            {/* 4 Options */}
            <div className="px-6 pb-4 grid grid-cols-1 gap-2.5">
              {currentQ.options.map((opt, i) => {
                let btnStyle =
                  'bg-white border-[#C8DFDB] text-slate-800 hover:border-[#3368A0] hover:bg-[#C8DFDB]/10';

                if (answered) {
                  if (i === currentQ.correctIndex) {
                    btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                  } else if (i === selected) {
                    btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 line-through';
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={answered}
                    onClick={() => handleSelect(i)}
                    className={`w-full text-left px-4 py-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer disabled:cursor-default ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {answered && i === currentQ.correctIndex && (
                      <span className="text-emerald-600 font-black text-sm">✓</span>
                    )}
                    {answered && i === selected && i !== currentQ.correctIndex && (
                      <span className="text-rose-500 font-black text-sm">✗</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom feedback drawer */}
            {answered && (
              <div
                className={`px-6 py-4 border-t transition-all ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <p
                  className={`text-sm font-black mb-0.5 ${
                    isCorrect ? 'text-emerald-800' : 'text-rose-800'
                  }`}
                >
                  {isCorrect ? 'Nicely done!' : 'Not quite!'}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {currentQ.remediationInsight}
                </p>
                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-3 w-full py-2.5 rounded-xl text-xs font-black text-white bg-[#3368A0] hover:bg-[#2b5887] transition cursor-pointer"
                >
                  {currentIdx + 1 >= totalQ ? 'See Results' : 'Next Question →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── COMPLETE ── */}
        {phase === 'COMPLETE' && (
          <div className="flex flex-col items-center py-10 px-8 text-center gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#66A3BF] mb-1">
                Drill Complete
              </p>
              <h3 className={`text-xl font-black ${completionInfo.color}`}>
                {completionInfo.heading}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {completionInfo.sub}
              </p>
            </div>

            {/* Clean Score Ring without XP / Mastery */}
            <ScoreRing score={correctCount} total={totalQ} />

            <div className="flex gap-3 w-full mt-2">
              {canRetake ? (
                <>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-[#3368A0] hover:bg-[#2b5887] transition cursor-pointer"
                  >
                    Retake Quiz
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                  >
                    Back to Analytics
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-[#3368A0] hover:bg-[#2b5887] transition cursor-pointer"
                  >
                    Back to Analytics
                  </button>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold text-[#3368A0] hover:bg-[#C8DFDB]/30 border border-[#C8DFDB] transition cursor-pointer"
                  >
                    Practice Again
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
