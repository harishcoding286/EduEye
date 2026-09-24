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
  const [timeLeft, setTimeLeft] = useState(240);

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
      <div className="bg-white/95 backdrop-blur-3xl border border-[#C8DFDB] shadow-[0_20px_50px_rgba(51,104,160,0.18)] rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col relative">
        {/* Modal Top Bar */}
        <div className="bg-[#C8DFDB]/25 border-b border-[#C8DFDB]/60 px-8 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#66A3BF] block mb-0.5">
              Concept Calibration
            </span>
            <h3 className="text-lg font-black text-[#3368A0] capitalize tracking-tight">
              Micro-Drill: {quiz.targetConcept.replace(/-/g, ' ')}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-xs bg-white/90 border border-[#C8DFDB] px-3 py-1 rounded-xl shadow-xs">
              <span className="text-slate-400">Time:</span>
              <span className={timeLeft < 60 ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold'}>
                {formatTimer(timeLeft)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-[#C8DFDB] flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors text-lg font-bold leading-none cursor-pointer"
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
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-bold">
                <span>
                  Question {currentIndex + 1} of {quiz.questions.length}
                </span>
                <span className="text-[#3368A0]">
                  Target: 3/3 Mastery
                </span>
              </div>

              <div className="w-full bg-[#C8DFDB]/40 h-2 rounded-full overflow-hidden mb-6">
                <div
                  className="bg-[#3368A0] h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${((currentIndex + 1) / quiz.questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* Question Text */}
              <h4 className="text-base font-bold text-slate-900 mb-4 leading-snug">
                {currentQ.questionText}
              </h4>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;

                  let optionStyle =
                    'border-[#C8DFDB] bg-white hover:border-[#66A3BF] text-slate-800';

                  if (hasAnsweredCurrent) {
                    if (isCorrect) {
                      optionStyle =
                        'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                    } else if (isSelected && !isCorrect) {
                      optionStyle =
                        'border-rose-400 bg-rose-50 text-rose-950 font-bold';
                    } else {
                      optionStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={hasAnsweredCurrent}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between text-xs ${optionStyle} cursor-pointer`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="font-medium">{option}</span>
                      </span>

                      {hasAnsweredCurrent && isCorrect && (
                        <span className="text-emerald-700 font-bold text-[11px] uppercase tracking-wide bg-emerald-100 px-2 py-0.5 rounded-md">
                          Correct
                        </span>
                      )}
                      {hasAnsweredCurrent && isSelected && !isCorrect && (
                        <span className="text-rose-600 font-bold text-[11px] uppercase tracking-wide bg-rose-100 px-2 py-0.5 rounded-md">
                          Incorrect
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Remediation Insight */}
              {hasAnsweredCurrent && (
                <div className="mt-4 p-3.5 rounded-xl bg-[#C8DFDB]/20 border border-[#C8DFDB] text-slate-800 text-xs leading-relaxed animate-in fade-in duration-200">
                  <div className="font-bold text-[#3368A0] uppercase tracking-wider text-[10px] mb-0.5">
                    Concept Note
                  </div>
                  {currentQ.remediationInsight}
                </div>
              )}

              {/* Next Button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={!hasAnsweredCurrent}
                  onClick={handleNext}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    hasAnsweredCurrent
                      ? 'bg-[#3368A0] hover:bg-[#2b5887] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isLastQuestion ? 'Review Mastery →' : 'Next Question →'}
                </button>
              </div>
            </div>
          ) : (
            /* Completion View */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-[#C8DFDB]/40 border border-[#C8DFDB] text-[#3368A0] flex items-center justify-center mx-auto text-xl font-black mb-3">
                {correctCount === quiz.questions.length ? '100%' : `${Math.round((correctCount / quiz.questions.length) * 100)}%`}
              </div>

              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                {correctCount === quiz.questions.length
                  ? 'Mastery Achieved'
                  : `Drill Completed: ${correctCount}/${quiz.questions.length}`}
              </h4>

              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                {correctCount === quiz.questions.length
                  ? 'Prerequisite deficit resolved. Predicted grade restored to 84% (Optimal) and focus slot updated.'
                  : 'Prerequisite topic reviewed. Review the concept notes above for reference.'}
              </p>

              <div className="mt-5 p-3 rounded-xl bg-[#C8DFDB]/20 border border-[#C8DFDB] max-w-xs mx-auto text-xs text-slate-700 flex justify-around">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Questions</div>
                  <div className="text-base font-bold text-slate-900">{quiz.questions.length}</div>
                </div>
                <div className="border-r border-[#C8DFDB]" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Mastery</div>
                  <div className="text-base font-bold text-[#3368A0]">
                    {Math.round((correctCount / quiz.questions.length) * 100)}%
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#3368A0] hover:bg-[#2b5887] transition-all cursor-pointer shadow-sm"
                >
                  Apply &amp; Return to Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
