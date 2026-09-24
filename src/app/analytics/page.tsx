import type { Metadata } from 'next';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';
import { computeStudentAnalytics } from '@/engine/studentAnalytics';
import db from '@/data/student_database.json';
import type { StudentDatabase } from '@/types/student-db';

export const metadata: Metadata = {
  title: 'EduEye — Analytics',
};

export default function AnalyticsPage() {
  const data = db as StudentDatabase;
  const analytics = computeStudentAnalytics(data);

  return <AnalyticsView analytics={analytics} studentName={data.student.name} />;
}
