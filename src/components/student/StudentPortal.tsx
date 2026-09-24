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
    <div className="max-w-7xl mx-auto px-8 py-10 min-h-screen flex flex-col gap-8">
      {/* Spacious, Serene Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/50">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600 bg-blue-100/60 px-3 py-0.5 rounded-full border border-blue-200/50">
              Student Execution Terminal
            </span>
            <span className="text-xs text-slate-400 font-mono">Real-Time Cognitive Feedback</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Academic Health &amp; Dynamic Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Autonomous prerequisite gap isolation with chronobiological focus slot allocation.
          </p>
        </div>

        {/* Header Action Pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSimulateDrop}
            className="px-4 py-2.5 text-xs font-bold text-slate-800 bg-white/80 hover:bg-white border border-slate-200/80 rounded-2xl transition-all shadow-sm hover:shadow hover:scale-[1.01] active:scale-[0.99]"
          >
            ⚡ Test Ingestion (Pop Quiz 38%)
          </button>
        </div>
      </div>

      {/* Desktop 2-Column Layout (40% / 60%) with gap-8 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3 Clear, Well-Spaced Cards (~40% width -> 5 cols on lg) */}
        <div className="lg:col-span-5 w-full">
          <StudentHealthCard
            profile={activeProfile}
            onSimulateDrop={handleSimulateDrop}
          />
        </div>

        {/* Right Column: Spacious Calendar Grid (~60% width -> 7 cols on lg) */}
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
