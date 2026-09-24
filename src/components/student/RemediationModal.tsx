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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white/90 backdrop-blur-3xl border border-white/90 shadow-[0_25px_60px_-15px_rgba(0,120,255,0.2)] rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Modal Top Bar: Serene Liquid Glass Header */}
        <div className="bg-gradient-to-r from-blue-50/80 via-white/80 to-indigo-50/80 border-b border-slate-200/60 px-8 py-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-0.5">
              Targeted Concept Calibration
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 capitalize tracking-tight">
              Micro-Drill: {quiz.targetConcept.replace(/-/g, ' ')}
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono text-xs bg-white/80 border border-slate-200/80 px-3.5 py-1.5 rounded-xl shadow-sm">
              <span className="text-slate-400">⏱</span>
              <span className={timeLeft < 60 ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold'}>
                {formatTimer(timeLeft)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors text-lg font-bold leading-none"
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
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-semibold">
                <span>
                  Question {currentIndex + 1} of {quiz.questions.length}
                </span>
                <span className="text-slate-400">
                  Target: 3/3 Mastery
                </span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${((currentIndex + 1) / quiz.questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* Question Text */}
              <h4 className="text-lg font-extrabold text-slate-900 mb-5 leading-snug">
                {currentQ.questionText}
              </h4>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;

                  let optionStyle =
                    'border-slate-200/80 bg-white/70 hover:bg-white text-slate-800 hover:border-slate-300 shadow-sm';

                  if (hasAnsweredCurrent) {
                    if (isCorrect) {
                      optionStyle =
                        'border-emerald-500 bg-emerald-50/90 text-emerald-950 font-semibold shadow-[0_4px_16px_rgba(16,185,129,0.15)]';
                    } else if (isSelected && !isCorrect) {
                      optionStyle =
                        'border-rose-400 bg-rose-50/90 text-rose-950 font-semibold shadow-[0_4px_16px_rgba(244,63,94,0.15)]';
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
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-sm ${optionStyle}`}
                    >
                      <span className="flex items-center gap-3.5">
                        <span className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </span>

                      {hasAnsweredCurrent && isCorrect && (
                        <span className="text-emerald-700 font-extrabold text-xs uppercase tracking-wide">
                          ✓ Correct
                        </span>
                      )}
                      {hasAnsweredCurrent && isSelected && !isCorrect && (
                        <span className="text-rose-600 font-extrabold text-xs uppercase tracking-wide">
                          ✕ Incorrect
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Remediation Insight */}
              {hasAnsweredCurrent && (
                <div className="mt-6 p-5 rounded-2xl bg-amber-50/90 border border-amber-300/80 text-amber-950 text-xs leading-relaxed animate-in fade-in duration-200">
                  <div className="font-extrabold text-amber-900 uppercase tracking-wider text-[10px] mb-1">
                    💡 Remediation Insight
                  </div>
                  {currentQ.remediationInsight}
                </div>
              )}

              {/* Next/Finish Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  disabled={!hasAnsweredCurrent}
                  onClick={handleNext}
                  className={`px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-md ${
                    hasAnsweredCurrent
                      ? 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-105 active:scale-95'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isLastQuestion ? 'Review Mastery →' : 'Next Question →'}
                </button>
              </div>
            </div>
          ) : (
            /* Completion View */
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl mb-4 shadow-sm border border-emerald-200">
                {correctCount === quiz.questions.length ? '🎯' : '📊'}
              </div>

              <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                {correctCount === quiz.questions.length
                  ? '3/3 Mastery Achieved'
                  : `Drill Completed: ${correctCount}/${quiz.questions.length}`}
              </h4>

              <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                {correctCount === quiz.questions.length
                  ? 'Prerequisite deficit calibrated successfully. Predicted grade restored to 84% (Optimal) and calendar focus block unlocked.'
                  : 'Review the remediation insights to reinforce prerequisite foundations.'}
              </p>

              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-sm mx-auto text-xs text-slate-700 flex justify-around">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total Questions</div>
                  <div className="text-lg font-black text-slate-900">{quiz.questions.length}</div>
                </div>
                <div className="border-r border-slate-200" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Accuracy</div>
                  <div className="text-lg font-black text-emerald-600">
                    {Math.round((correctCount / quiz.questions.length) * 100)}%
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-6 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-[0_8px_20px_-4px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95 transition-all"
                >
                  Apply Resolution &amp; Return to Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
