'use client';

import React, { useCallback, useMemo, Suspense } from 'react';
import { generateAdaptiveSchedule } from '@/engine/adaptiveScheduler';
import { WeeklyCalendarView } from '@/components/schedule/WeeklyCalendarView';
import type { StudentAnalytics } from '@/types/student-db';
import type { StudentScheduleRecord, AdaptiveScheduleResult } from '@/types/schedule';

interface ScheduleClientProps {
  studentName: string;
  analytics: StudentAnalytics;
  scheduleRecord: StudentScheduleRecord;
  studentId: string;
}

export function ScheduleClient({
  studentName,
  analytics,
  scheduleRecord,
  studentId,
}: ScheduleClientProps) {
  const initialResult = useMemo(
    () =>
      generateAdaptiveSchedule(
        studentId,
        scheduleRecord,
        analytics.subjects,
        new Date(),
      ),
    [studentId, scheduleRecord, analytics.subjects],
  );

  const handleRebalance = useCallback((): AdaptiveScheduleResult => {
    return generateAdaptiveSchedule(
      studentId,
      scheduleRecord,
      analytics.subjects,
      new Date(),
    );
  }, [studentId, scheduleRecord, analytics.subjects]);

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#C8DFDB] border-t-[#3368A0] rounded-full animate-spin" />
      </div>
    }>
      <WeeklyCalendarView
        initialResult={initialResult}
        studentName={studentName}
        onRebalance={handleRebalance}
      />
    </Suspense>
  );
}
