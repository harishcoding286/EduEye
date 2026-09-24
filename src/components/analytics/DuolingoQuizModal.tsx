'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { GeneratedQuiz, QuizQuestion } from '@/types/student-db';

interface DuolingoQuizModalProps {
  subject: string;
  weakTopics: string[];
  avgScore: number;
  onClose: () => void;
  onRemediated: () => void;
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

function XPRing({ score, total }: { score: number; total: number }) {
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
          stroke="#3368A0"
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
  onClose,
  onRemediated,
}: DuolingoQuizModalProps) {
  const [phase, setPhase] = useState<Phase>('LOADING');
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const fetchQuiz = useCallback(async () => {
    setPhase('LOADING');
    setErrorMsg('');
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, weakTopics, avgScore }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to generate quiz');
      }
      setQuiz(data as GeneratedQuiz);
      setPhase('QUIZ');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setPhase('ERROR');
    }
  }, [subject, weakTopics, avgScore]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const currentQ: QuizQuestion | undefined = quiz?.questions[currentIdx];
  const totalQ = quiz?.questions.length ?? 5;

  function handleSelect(idx: number) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (currentQ && idx === currentQ.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  }

  function handleNext() {
    if (currentIdx + 1 >= totalQ) {
      setPhase('COMPLETE');
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  }

  const isCorrect = answered && selected === currentQ?.correctIndex;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl border border-[#C8DFDB] rounded-3xl shadow-[0_24px_60px_rgba(51,104,160,0.2)] overflow-hidden flex flex-col">
        {/* ── HEADER ── */}
        <div className="bg-[#C8DFDB]/25 border-b border-[#C8DFDB]/60 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66A3BF]">
              AI Diagnostic Drill
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
              <p className="text-xs text-slate-500 mt-1">Gemini AI is crafting 5 questions tailored to your weak areas</p>
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
              <p className="text-sm font-bold text-rose-700">Could not load quiz</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={fetchQuiz}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#3368A0] hover:bg-[#2b5887] transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── QUIZ ── */}
        {phase === 'QUIZ' && currentQ && (
          <div className="flex flex-col">
            {/* Progress */}
            <div className="px-6 pt-5 pb-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span>Question {currentIdx + 1} of {totalQ}</span>
                <span className="text-[#3368A0]">{correctCount} correct</span>
              </div>
              <ProgressBar current={currentIdx + (answered ? 1 : 0)} total={totalQ} />
            </div>

            {/* Question */}
            <div className="px-6 pb-4">
              <h3 className="text-sm font-bold text-slate-900 leading-relaxed">
                {currentQ.questionText}
              </h3>
            </div>

            {/* Options */}
            <div className="px-6 pb-3 space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const isThisCorrect = idx === currentQ.correctIndex;
                const isThisSelected = idx === selected;

                let baseStyle =
                  'border-[#C8DFDB] bg-white hover:border-[#66A3BF] hover:bg-[#C8DFDB]/10';

                if (answered) {
                  if (isThisCorrect) {
                    baseStyle =
                      'border-emerald-400 bg-emerald-50 text-emerald-900';
                  } else if (isThisSelected) {
                    baseStyle = 'border-rose-400 bg-rose-50 text-rose-900';
                  } else {
                    baseStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={answered}
                    onClick={() => handleSelect(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3 text-sm font-medium cursor-pointer active:scale-[0.98] hover:scale-[1.01] ${baseStyle}`}
                  >
                    <span className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black text-slate-700 flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                    {answered && isThisCorrect && (
                      <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Correct
                      </span>
                    )}
                    {answered && isThisSelected && !isThisCorrect && (
                      <span className="ml-auto text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                        Wrong
                      </span>
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
                {!isCorrect && (
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {currentQ.remediationInsight}
                  </p>
                )}
                {isCorrect && (
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    {currentQ.remediationInsight}
                  </p>
                )}
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
              <h3 className="text-xl font-black text-slate-900">
                {correctCount >= 4 ? 'Excellent Work!' : correctCount >= 3 ? 'Good Effort!' : 'Keep Practicing!'}
              </h3>
            </div>

            <XPRing score={correctCount} total={totalQ} />

            <div className="flex items-center gap-4 text-center">
              <div className="px-4 py-2 rounded-xl bg-[#C8DFDB]/30 border border-[#C8DFDB]">
                <div className="text-[10px] font-black text-[#66A3BF] uppercase">Mastery</div>
                <div className="text-lg font-black text-[#3368A0]">
                  {Math.round((correctCount / totalQ) * 100)}%
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#C8DFDB]/30 border border-[#C8DFDB]">
                <div className="text-[10px] font-black text-[#66A3BF] uppercase">XP Earned</div>
                <div className="text-lg font-black text-[#3368A0]">
                  +{correctCount * 20}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {correctCount >= 4
                ? `Great progress on ${subject}! Your understanding of core concepts has improved.`
                : `Review the concepts above and try again to strengthen your understanding of ${subject}.`}
            </p>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              >
                Back to Analytics
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemediated();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-[#3368A0] hover:bg-[#2b5887] transition cursor-pointer"
              >
                Mark as Remediated
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
