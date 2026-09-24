import type { Metadata } from 'next';
import { DashboardView } from '@/components/analytics/DashboardView';
import { computeStudentAnalytics } from '@/engine/studentAnalytics';
import db from '@/data/student_database.json';
import type { StudentDatabase } from '@/types/student-db';

export const metadata: Metadata = {
  title: 'EduEye — Dashboard',
};

export default function DashboardPage() {
  const data = db as StudentDatabase;
  const analytics = computeStudentAnalytics(data);

  return <DashboardView analytics={analytics} studentName={data.student.name} />;
}
