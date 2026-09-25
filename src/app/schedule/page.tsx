import type { Metadata } from 'next';
import { ScheduleClient } from '@/components/schedule/ScheduleClient';
import { computeStudentAnalytics } from '@/engine/studentAnalytics';
import db from '@/data/student_database.json';
import scheduleDb from '@/data/student_schedule.json';
import type { StudentDatabase } from '@/types/student-db';
import type { StudentScheduleDB } from '@/types/schedule';

export const metadata: Metadata = {
  title: 'EduEye — Adaptive Schedule',
};

export default function SchedulePage() {
  const data = db as StudentDatabase;
  const analytics = computeStudentAnalytics(data);
  const typedScheduleDb = scheduleDb as StudentScheduleDB;
  const scheduleRecord = typedScheduleDb[data.student.id];

  if (!scheduleRecord) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-12 text-center">
        <p className="text-sm font-bold text-rose-600">
          No schedule record found for student {data.student.id}.
        </p>
      </div>
    );
  }

  return (
    <ScheduleClient
      studentName={data.student.name}
      analytics={analytics}
      scheduleRecord={scheduleRecord}
      studentId={data.student.id}
    />
  );
}
