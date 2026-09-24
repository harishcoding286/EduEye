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
  const [timeLeft, setTimeLeft] = useState(240); // 4-minute countdown timer

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedOption(null);
      setAnswers({});
      setIsCompleted(false);
      setTimeLeft(240);
    }
  }, [isOpen]);

  // Subtle 4-minute countdown timer
  useEffect(() => {
    if (!isOpen || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
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
    if (hasAnsweredCurrent) return; // Prevent changing answer after instant feedback
    setSelectedOption(idx);
    setAnswers(prev => ({ ...prev, [currentIndex]: idx }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setIsCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
    }
  };

  // Calculate final score
  const correctCount = Object.entries(answers).filter(
    ([qIdx, selected]) => quiz.questions[Number(qIdx)]?.correctIndex === selected
  ).length;

  const handleFinish = () => {
    onComplete(correctCount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Interactive Micro-Drill
            </span>
            <h3 className="text-base font-bold capitalize">
              Concept Calibration: {quiz.targetConcept.replace(/-/g, ' ')}
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">⏱</span>
              <span className={timeLeft < 60 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {formatTimer(timeLeft)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors text-xl font-bold leading-none"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {!isCompleted ? (
            <div>
              {/* Stepper progress */}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4 font-medium">
                <span>
                  Question {currentIndex + 1} of {quiz.questions.length}
                </span>
                <span className="text-slate-400">
                  Target: 3/3 Mastery
                </span>
              </div>

              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-6">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / quiz.questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* Question Text */}
              <h4 className="text-base font-bold text-slate-900 mb-4 leading-snug">
                {currentQ.questionText}
              </h4>

              {/* Options list */}
              <div className="space-y-2.5">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;

                  let optionStyle =
                    'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 hover:border-slate-300';

                  if (hasAnsweredCurrent) {
                    if (isCorrect) {
                      // Correct option always shows emerald
                      optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium shadow-sm';
                    } else if (isSelected && !isCorrect) {
                      // User selected incorrect option
                      optionStyle = 'border-rose-500 bg-rose-50 text-rose-950 font-medium';
                    } else {
                      optionStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={hasAnsweredCurrent}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center justify-between text-sm ${optionStyle}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </span>

                      {hasAnsweredCurrent && isCorrect && (
                        <span className="text-emerald-600 font-bold text-xs uppercase tracking-wide">
                          ✓ Correct
                        </span>
                      )}
                      {hasAnsweredCurrent && isSelected && !isCorrect && (
                        <span className="text-rose-600 font-bold text-xs uppercase tracking-wide">
                          ✕ Incorrect
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Feedback Remediation Insight */}
              {hasAnsweredCurrent && (
                <div className="mt-5 p-4 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="font-bold text-amber-900 uppercase tracking-wider text-[10px] mb-1">
                    💡 Remediation Insight
                  </div>
                  {currentQ.remediationInsight}
                </div>
              )}

              {/* Next/Finish button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={!hasAnsweredCurrent}
                  onClick={handleNext}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    hasAnsweredCurrent
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
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
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl mb-4">
                {correctCount === quiz.questions.length ? '🎯' : '📊'}
              </div>

              <h4 className="text-xl font-black text-slate-900">
                {correctCount === quiz.questions.length
                  ? 'Mastery Achieved: 3/3'
                  : `Drill Completed: ${correctCount}/${quiz.questions.length}`}
              </h4>

              <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                {correctCount === quiz.questions.length
                  ? 'Prerequisite deficit calibrated successfully. Cognitive scheduler will mark the calendar block as COMPLETED and restore predicted grade to Optimal.'
                  : 'Review the remediation insights above before retaking the diagnostic calibration.'}
              </p>

              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-sm mx-auto text-xs text-slate-700 flex justify-around">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Questions</div>
                  <div className="text-lg font-bold text-slate-900">{quiz.questions.length}</div>
                </div>
                <div className="border-r border-slate-200" />
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Score Achieved</div>
                  <div className="text-lg font-bold text-emerald-600">
                    {Math.round((correctCount / quiz.questions.length) * 100)}%
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md active:scale-95"
                >
                  Apply Resolution & Return to Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
