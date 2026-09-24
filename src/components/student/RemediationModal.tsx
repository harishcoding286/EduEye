'use client';

import React, { useState, useEffect } from 'react';
import type { DiagnosticQuiz } from '@/types';

export interface RemediationModalProps {
  quiz: DiagnosticQuiz;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (score: number) => void;
}

export const RemediationModal: React.FC<RemediationModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [qIndex: number]: number }>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(240); // 4-minute countdown

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedOption(null);
      setAnswers({});
      setIsCompleted(false);
      setTimeLeft(240);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isCompleted]);

  if (!isOpen) return null;

  const currentQ = quiz.questions[currentIndex];
  const hasAnsweredCurrent = selectedOption !== null;
  const isLastQuestion = currentIndex === quiz.questions.length - 1;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (idx: number) => {
    if (hasAnsweredCurrent) return;
    setSelectedOption(idx);
    setAnswers((prev) => ({ ...prev, [currentIndex]: idx }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setIsCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    }
  };

  const correctCount = Object.entries(answers).filter(
    ([qIdx, selected]) => quiz.questions[Number(qIdx)]?.correctIndex === selected
  ).length;

  const handleFinish = () => {
    onComplete(correctCount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-3xl border-2 border-white shadow-[0_25px_60px_rgba(59,130,246,0.25)] rounded-[2.5rem] w-full max-w-2xl overflow-hidden flex flex-col relative">
        {/* Specular sheen */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-sky-100/80 via-pink-50/80 to-purple-100/80 border-b border-white px-8 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-0.5">
              Targeted Concept Calibration 🫧
            </span>
            <h3 className="text-xl font-black text-slate-900 capitalize tracking-tight flex items-center gap-2">
              <span>Micro-Drill: {quiz.targetConcept.replace(/-/g, ' ')}</span>
              <span>🎯</span>
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-xs bg-white/90 border border-slate-200 px-3.5 py-1.5 rounded-2xl shadow-sm">
              <span className="text-amber-500">⏱</span>
              <span className={timeLeft < 60 ? 'text-rose-600 font-black' : 'text-slate-700 font-bold'}>
                {formatTimer(timeLeft)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-white/90 hover:bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors text-xl font-black leading-none shadow-sm cursor-pointer"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-8">
          {!isCompleted ? (
            <div>
              {/* Stepper Progress */}
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-black">
                <span>
                  Question {currentIndex + 1} of {quiz.questions.length} 🌸
                </span>
                <span className="text-blue-600">
                  Goal: 3/3 Mastery ✨
                </span>
              </div>

              <div className="w-full bg-slate-200/70 h-2.5 rounded-full overflow-hidden mb-6 p-[1px]">
                <div
                  className="bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 h-full transition-all duration-300 rounded-full shadow-sm"
                  style={{
                    width: `${((currentIndex + 1) / quiz.questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* Question Text */}
              <h4 className="text-lg font-black text-slate-900 mb-5 leading-snug">
                {currentQ.questionText}
              </h4>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;

                  let optionStyle =
                    'border-white/90 bg-white/80 hover:bg-white text-slate-800 hover:border-sky-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)]';

                  if (hasAnsweredCurrent) {
                    if (isCorrect) {
                      optionStyle =
                        'border-emerald-400 bg-emerald-100/90 text-emerald-950 font-black shadow-[0_4px_16px_rgba(16,185,129,0.2)]';
                    } else if (isSelected && !isCorrect) {
                      optionStyle =
                        'border-rose-400 bg-rose-100/90 text-rose-950 font-black shadow-[0_4px_16px_rgba(244,63,94,0.2)]';
                    } else {
                      optionStyle = 'border-slate-200/50 bg-slate-50/50 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={hasAnsweredCurrent}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-sm ${optionStyle} cursor-pointer`}
                    >
                      <span className="flex items-center gap-3.5">
                        <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-700 flex items-center justify-center shrink-0 shadow-inner">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="font-semibold">{option}</span>
                      </span>

                      {hasAnsweredCurrent && isCorrect && (
                        <span className="text-emerald-700 font-black text-xs uppercase tracking-wide bg-emerald-200/80 px-2.5 py-1 rounded-xl">
                          ✓ Correct
                        </span>
                      )}
                      {hasAnsweredCurrent && isSelected && !isCorrect && (
                        <span className="text-rose-600 font-black text-xs uppercase tracking-wide bg-rose-200/80 px-2.5 py-1 rounded-xl">
                          ✕ Incorrect
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Remediation Insight */}
              {hasAnsweredCurrent && (
                <div className="mt-5 p-4 rounded-2xl bg-amber-50/95 border-2 border-amber-200 text-amber-950 text-xs leading-relaxed animate-in fade-in duration-200 shadow-sm">
                  <div className="font-black text-amber-900 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                    <span>💡</span> Remediation Insight ✨
                  </div>
                  {currentQ.remediationInsight}
                </div>
              )}

              {/* Next/Finish Button */}
              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  disabled={!hasAnsweredCurrent}
                  onClick={handleNext}
                  className={`px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-md cursor-pointer ${
                    hasAnsweredCurrent
                      ? 'bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 text-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.8),0_6px_18px_rgba(37,99,235,0.35)] hover:scale-105 active:scale-95'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isLastQuestion ? 'Review Mastery 🌟 →' : 'Next Question ✨ →'}
                </button>
              </div>
            </div>
          ) : (
            /* Completion View */
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-100 to-teal-100 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto text-4xl mb-4 shadow-[0_12px_28px_rgba(16,185,129,0.2)]">
                {correctCount === quiz.questions.length ? '🌟' : '📊'}
              </div>

              <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                {correctCount === quiz.questions.length
                  ? '3/3 Perfect Mastery! 🎉'
                  : `Drill Completed: ${correctCount}/${quiz.questions.length}`}
              </h4>

              <p className="text-xs font-semibold text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                {correctCount === quiz.questions.length
                  ? 'Prerequisite deficit calibrated successfully! Predicted grade restored to 84% (Optimal) and calendar focus block unlocked! 🌸✨'
                  : 'Review the remediation insights above to reinforce your prerequisite foundations.'}
              </p>

              <div className="mt-6 p-4 rounded-2xl bg-sky-50/70 border border-sky-200 max-w-sm mx-auto text-xs text-slate-700 flex justify-around shadow-sm">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-black">Total Questions</div>
                  <div className="text-lg font-black text-slate-900">{quiz.questions.length}</div>
                </div>
                <div className="border-r border-slate-200" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-black">Mastery Score</div>
                  <div className="text-lg font-black text-emerald-600">
                    {Math.round((correctCount / quiz.questions.length) * 100)}%
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-6 py-3 rounded-2xl text-xs font-black text-emerald-950 bg-gradient-to-b from-emerald-200 via-emerald-300 to-teal-400 hover:from-emerald-100 hover:to-emerald-300 border border-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.9),0_8px_24px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Apply Resolution &amp; Return to Schedule ✨
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
