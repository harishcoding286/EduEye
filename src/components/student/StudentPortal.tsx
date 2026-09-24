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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
      {/* Minimal Greeting Banner */}
      <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white p-6 shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#66A3BF]">
              Student Portal
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono text-slate-500">MATH-204</span>
          </div>

          <h1 className="text-2xl font-black text-[#3368A0] tracking-tight">
            {activeProfile.name}
          </h1>

          <p className="text-xs text-slate-600 mt-0.5">
            Cognitive focus schedule active. Lunch break and high-energy slots protected.
          </p>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={handleSimulateDrop}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#3368A0] hover:bg-[#2b5887] transition-all cursor-pointer shadow-sm"
          >
            Simulate Quiz Drop (38%)
          </button>
        </div>
      </div>

      {/* 2-Column Layout (40% / 60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 w-full">
          <StudentHealthCard
            profile={activeProfile}
            onSimulateDrop={handleSimulateDrop}
          />
        </div>

        {/* Right Column (7 cols) */}
        <div className="lg:col-span-7 w-full">
          <ScheduleGrid
            events={activeProfile.calendarEvents}
            onEventClick={handleEventClick}
          />
        </div>
      </div>

      {/* Micro-Drill Modal */}
      <RemediationModal
        quiz={quiz}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleQuizComplete}
      />
    </div>
  );
};
