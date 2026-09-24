'use client';

import React, { useState } from 'react';
import type { CalendarEvent, DiagnosticQuiz, StudentProfile } from '@/types';
import { initialStudent, eigenvectorsQuiz } from '@/data/seedData';
import { findOptimalStudySlot } from '@/engine/cognitiveScheduler';
import { StudentHealthCard } from './StudentHealthCard';
import { ScheduleGrid } from './ScheduleGrid';
import { RemediationModal } from './RemediationModal';

export interface StudentPortalProps {
  profile?: StudentProfile;
  quiz?: DiagnosticQuiz;
  onProfileUpdate?: (updated: StudentProfile) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  profile: propProfile,
  quiz = eigenvectorsQuiz,
  onProfileUpdate,
  onEventClick: propOnEventClick,
}) => {
  // Local state initialized with props or default seed Alex Rivera
  const [localProfile, setLocalProfile] = useState<StudentProfile>(() => {
    return propProfile ? structuredClone(propProfile) : structuredClone(initialStudent);
  });

  const activeProfile = propProfile || localProfile;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const updateProfile = (newProfile: StudentProfile) => {
    setLocalProfile(newProfile);
    if (onProfileUpdate) {
      onProfileUpdate(newProfile);
    }
  };

  // Handle Event Click on the Schedule Grid
  const handleEventClick = (event: CalendarEvent) => {
    if (propOnEventClick) {
      propOnEventClick(event);
    }

    // If an amber/remediation event is clicked, open the micro-drill modal
    if (event.category === 'REMEDIATION_LOCK' && event.status === 'SCHEDULED') {
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  };

  // Simulate Pop Quiz Ingestion Drop (38% Eigenvalues)
  const handleSimulateDrop = () => {
    // 1. Autonomous schedule slot calculation
    const slot = findOptimalStudySlot(activeProfile.calendarEvents, 45);

    const newRemediationEvent: CalendarEvent = {
      id: `evt_rem_${Date.now()}`,
      title: 'Eigenvalues & Eigenvectors Remediation Block',
      startTime: slot.startTime,
      endTime: slot.endTime,
      category: 'REMEDIATION_LOCK',
      status: 'SCHEDULED',
      topic: 'Eigenvalues & Eigenvectors',
    };

    // Filter out previous remediation locks to allow re-testing
    const filteredEvents = activeProfile.calendarEvents.filter(
      e => e.id !== newRemediationEvent.id
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

  // Handle Diagnostic Quiz Completion (3/3 Mastery)
  const handleQuizComplete = (score: number) => {
    setIsModalOpen(false);

    // Resolve deficit and mark remediation block as COMPLETED
    const updatedEvents = activeProfile.calendarEvents.map(evt => {
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
        d => d !== 'eigenvalues-eigenvectors'
      ),
      calendarEvents: updatedEvents,
    };

    updateProfile(updatedProfile);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Module 1 · FlowBuild
            </span>
            <span className="text-xs text-slate-400">Isolated Student Runtime</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            EduEye Student Health & Autonomous Execution Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cognitive scheduling heuristics with closed-loop prerequisite gap remediation.
          </p>
        </div>

        {/* Demo trigger quick action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateDrop}
            className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm"
          >
            ⚡ Test 60s Trigger (Pop Quiz Drop)
          </button>
        </div>
      </div>

      {/* Desktop 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: StudentHealthCard (~40% width -> 5 cols on lg) */}
        <div className="lg:col-span-5 w-full">
          <StudentHealthCard
            profile={activeProfile}
            onSimulateDrop={handleSimulateDrop}
          />
        </div>

        {/* Right Column: ScheduleGrid (~60% width -> 7 cols on lg) */}
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
