'use client';

import React, { useState, useEffect } from 'react';
import type { CalendarEvent, DiagnosticQuiz, StudentProfile } from '@/types';
import { initialStudent, eigenvectorsQuiz } from '@/data/seedData';
import { findOptimalStudySlot } from '@/engine/cognitiveScheduler';
import { StudentHealthCard } from './StudentHealthCard';
import { ScheduleGrid } from './ScheduleGrid';
import { RemediationModal } from './RemediationModal';

export interface StudentPortalProps {
  currentStudent?: StudentProfile;
  profile?: StudentProfile;
  quiz?: DiagnosticQuiz;
  onProfileUpdate?: (updated: StudentProfile) => void;
  onEventClick?: (event: CalendarEvent) => void;
  findOptimalSlot?: (events: CalendarEvent[], targetDurationMinutes?: number) => { startTime: string; endTime: string };
  onRemediationResolved?: (score: number) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentStudent,
  profile: propProfile,
  quiz = eigenvectorsQuiz,
  onProfileUpdate,
  onEventClick: propOnEventClick,
  findOptimalSlot = findOptimalStudySlot,
  onRemediationResolved,
}) => {
  const activeIncomingProfile = currentStudent || propProfile;

  const [localProfile, setLocalProfile] = useState<StudentProfile>(() => {
    return activeIncomingProfile
      ? structuredClone(activeIncomingProfile)
      : structuredClone(initialStudent);
  });

  useEffect(() => {
    if (activeIncomingProfile) {
      setLocalProfile(activeIncomingProfile);
    }
  }, [activeIncomingProfile]);

  const activeProfile = activeIncomingProfile || localProfile;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const updateProfile = (newProfile: StudentProfile) => {
    setLocalProfile(newProfile);
    if (onProfileUpdate) {
      onProfileUpdate(newProfile);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (propOnEventClick) {
      propOnEventClick(event);
    }

    if (event.category === 'REMEDIATION_LOCK' && event.status === 'SCHEDULED') {
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  };

  const handleSimulateDrop = () => {
    const slot = findOptimalSlot(activeProfile.calendarEvents, 45);

    const newRemediationEvent: CalendarEvent = {
      id: `evt_rem_${Date.now()}`,
      title: 'Eigenvalues & Eigenvectors Remediation Lock',
      startTime: slot.startTime,
      endTime: slot.endTime,
      category: 'REMEDIATION_LOCK',
      status: 'SCHEDULED',
      topic: 'Eigenvalues & Eigenvectors',
    };

    const filteredEvents = activeProfile.calendarEvents.filter(
      (e) => !(e.category === 'REMEDIATION_LOCK' && e.status === 'SCHEDULED')
    );

    const updatedProfile: StudentProfile = {
      ...activeProfile,
      predictedGrade: 54,
      riskTier: 'CRITICAL',
      activeDeficits: Array.from(
        new Set([...activeProfile.activeDeficits, 'eigenvalues-eigenvectors'])
      ),
      recentAssessments: [
        ...activeProfile.recentAssessments,
        {
          id: `asmt_drop_${Date.now()}`,
          course: 'Linear Algebra',
          topic: 'Eigenvalues & Eigenvectors',
          score: 38,
          maxScore: 100,
          submittedAt: new Date().toISOString(),
          expectedLagHours: 24,
          actualLagHours: 48,
        },
      ],
      calendarEvents: [...filteredEvents, newRemediationEvent],
    };

    updateProfile(updatedProfile);
  };

  const handleQuizComplete = (score: number) => {
    setIsModalOpen(false);

    if (onRemediationResolved) {
      onRemediationResolved(score);
    }

    const updatedEvents = activeProfile.calendarEvents.map((evt) => {
      if (
        evt.category === 'REMEDIATION_LOCK' ||
        (selectedEvent && evt.id === selectedEvent.id)
      ) {
        return { ...evt, status: 'COMPLETED' as const };
      }
      return evt;
    });

    const updatedProfile: StudentProfile = {
      ...activeProfile,
      predictedGrade: 84,
      riskTier: 'OPTIMAL',
      activeDeficits: activeProfile.activeDeficits.filter(
        (d) => d !== 'eigenvalues-eigenvectors' && d !== 'Eigenvectors'
      ),
      calendarEvents: updatedEvents,
    };

    updateProfile(updatedProfile);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
      {/* Playful Floating Glass Hero Greeting */}
      <div className="rounded-[2.2rem] bg-white/70 backdrop-blur-2xl border-2 border-white/95 p-7 shadow-[0_16px_40px_rgba(147,197,253,0.22),inset_0_2px_4px_rgba(255,255,255,0.9)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r from-pink-200 via-purple-200 to-sky-200 text-slate-800 border border-white shadow-sm flex items-center gap-1">
              <span>🌸</span> Welcome Back!
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono">Term 2026-Q3 🫧</span>
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Hi Alex!</span>
            <span className="text-2xl animate-bounce">✨</span>
          </h1>

          <p className="text-xs font-semibold text-slate-600 mt-1">
            Your AI study buddy scheduled optimal focus slots and protected your lunch hour! ☁️🥪
          </p>
        </div>

        {/* Quick Quiz Drop Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSimulateDrop}
            className="px-4 py-2.5 rounded-2xl text-xs font-extrabold text-slate-800 bg-white/90 hover:bg-white border-2 border-white shadow-[0_6px_16px_rgba(147,197,253,0.25)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>⚡</span> Test Quiz Drop (38% Eigenvalues)
          </button>
        </div>
      </div>

      {/* Desktop 2-Column Layout (40% / 60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (~40% width -> 5 cols on lg) */}
        <div className="lg:col-span-5 w-full">
          <StudentHealthCard
            profile={activeProfile}
            onSimulateDrop={handleSimulateDrop}
          />
        </div>

        {/* Right Column (~60% width -> 7 cols on lg) */}
        <div className="lg:col-span-7 w-full">
          <ScheduleGrid
            events={activeProfile.calendarEvents}
            onEventClick={handleEventClick}
          />
        </div>
      </div>

      {/* Interactive Micro-Drill Modal */}
      <RemediationModal
        quiz={quiz}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleQuizComplete}
      />
    </div>
  );
};
