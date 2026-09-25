// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Unified Data Service (Supabase + Local Mock Fallback)
// Seamlessly queries Supabase PostgreSQL tables if configured in environment,
// otherwise gracefully falls back to local JSON mock databases.
// ─────────────────────────────────────────────────────────────────────────────

import { getSupabaseServerClient, isSupabaseServerConfigured } from './server';
import mockStudentDb from '@/data/student_database.json';
import mockScheduleDb from '@/data/student_schedule.json';
import type { StudentDatabase } from '@/types/student-db';
import type { StudentScheduleRecord, StudentScheduleDB, ScheduledEvent } from '@/types/schedule';

export async function getStudentData(studentId = 'stu_ram_001'): Promise<StudentDatabase> {
  const supabase = getSupabaseServerClient();

  if (isSupabaseServerConfigured && supabase) {
    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('student_id', studentId);

      if (!studentError && !subjectsError && student && subjects) {
        return {
          student: {
            id: student.id,
            name: student.name,
            rollNumber: student.roll_no || student.roll_number || '21BCE1042',
            semester: student.semester,
            academicYear: student.academic_year || '2025-2026',
            branch: student.branch,
            daysAttended: student.days_attended,
            totalWorkingDays: student.total_working_days,
          },
          subjects: subjects.map((s) => ({
            id: s.id,
            code: s.code,
            name: s.name,
            credits: Number(s.credits) || 4,
            faculty: s.faculty,
            cat1Score: Number(s.cat1_score),
            cat2Score: Number(s.cat2_score),
            maxCATScore: Number(s.max_cat_score) || 50,
            totalAssignments: Number(s.total_assignments) || 5,
            submittedOnTime: Number(s.submitted_on_time) || 4,
            conceptWeaknesses: s.concept_weaknesses || [],
            keyTopics: s.key_topics || [],
          })),
        };
      }
    } catch (err) {
      console.warn('[dataService] Supabase student query failed, using local mock fallback:', err);
    }
  }

  return mockStudentDb as StudentDatabase;
}

export async function getStudentSchedule(studentId = 'stu_ram_001'): Promise<StudentScheduleRecord> {
  const supabase = getSupabaseServerClient();

  if (isSupabaseServerConfigured && supabase) {
    try {
      const { data: schedule, error } = await supabase
        .from('student_schedules')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (!error && schedule) {
        return {
          studentId: schedule.student_id,
          chronotype: schedule.chronotype,
          timezone: schedule.timezone,
          weeklyBaselineEvents: schedule.weekly_baseline_events || [],
          upcomingExams: schedule.upcoming_exams || [],
        };
      }
    } catch (err) {
      console.warn('[dataService] Supabase schedule query failed, using local mock fallback:', err);
    }
  }

  const typedDb = mockScheduleDb as StudentScheduleDB;
  return typedDb[studentId];
}

export async function saveCalendarEvents(
  studentId: string,
  events: ScheduledEvent[]
): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  if (isSupabaseServerConfigured && supabase) {
    try {
      const rows = events.map((e) => ({
        id: e.id,
        student_id: studentId,
        title: e.title,
        start_time: e.start,
        end_time: e.end,
        category: e.category,
        topic: e.topic || null,
        alert_score: e.alertScore || null,
        is_rescheduled: !!e.isRescheduled,
        diff_reason: e.diffReason || null,
      }));

      const { error } = await supabase
        .from('calendar_events')
        .upsert(rows, { onConflict: 'id' });

      if (!error) return true;
    } catch (err) {
      console.warn('[dataService] Failed to persist calendar events in Supabase:', err);
    }
  }

  return false;
}
