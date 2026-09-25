// ─────────────────────────────────────────────────────────────────────────────
// EduEye — AI Schedule Rebalance API Route
// POST /api/rebalance-schedule
// Ingests student academic telemetry, baseline commitments, and user feedback
// to prompt Gemini 3.8 Flash for a personalized, cognitively-optimized schedule.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import db from '@/data/student_database.json';
import scheduleDb from '@/data/student_schedule.json';
import { computeStudentAnalytics } from '@/engine/studentAnalytics';
import { getAlertnessScore } from '@/engine/adaptiveScheduler';
import type { StudentDatabase } from '@/types/student-db';
import type {
  StudentScheduleDB,
  ScheduledEvent,
  ScheduleDiff,
  AdaptiveScheduleResult,
} from '@/types/schedule';

export const runtime = 'nodejs';

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CLASS:            { bg: '#3368A0', text: '#ffffff', border: '#2b5887' },
  PERSONAL:         { bg: '#C8DFDB', text: '#3368A0', border: '#aed0cb' },
  REMEDIATION_LOCK: { bg: '#f87171', text: '#ffffff', border: '#ef4444' },
  CRITICAL_FOCUS:   { bg: '#ef4444', text: '#ffffff', border: '#dc2626' },
  RESCHEDULED:      { bg: '#66A3BF', text: '#ffffff', border: '#4e8fa8' },
};

// Compact, targeted schema: Gemini only outputs the changed events and focus sessions
// rather than regenerating 50 static lectures, preventing token cutoff.
const REBALANCE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    aiRationale: {
      type: Type.STRING,
      description:
        'Concise 1-2 sentence explanation of how the schedule was adapted to respect the student feedback while prioritizing remediation for low-scoring subjects.',
    },
    diffs: {
      type: Type.ARRAY,
      description: 'List of events that were moved, shifted, or rescheduled relative to the original timetable',
      items: {
        type: Type.OBJECT,
        properties: {
          eventId: { type: Type.STRING, description: 'ID of the changed event' },
          eventTitle: { type: Type.STRING, description: 'Title of the event' },
          fromStart: { type: Type.STRING, description: 'Original start ISO string' },
          fromEnd: { type: Type.STRING, description: 'Original end ISO string' },
          toStart: { type: Type.STRING, description: 'New start ISO string' },
          toEnd: { type: Type.STRING, description: 'New end ISO string' },
          reason: { type: Type.STRING, description: 'Explanation for why this event was shifted' },
        },
        propertyOrdering: [
          'eventId',
          'eventTitle',
          'fromStart',
          'fromEnd',
          'toStart',
          'toEnd',
          'reason',
        ],
        required: [
          'eventId',
          'eventTitle',
          'fromStart',
          'fromEnd',
          'toStart',
          'toEnd',
          'reason',
        ],
      },
    },
    rescheduledEvents: {
      type: Type.ARRAY,
      description: 'List of existing non-academic events (e.g. gym, study group) that were shifted to new times to accommodate the student request or study sessions',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Exact ID of the event from the provided current schedule' },
          start: { type: Type.STRING, description: 'New ISO datetime YYYY-MM-DDTHH:MM:SS' },
          end: { type: Type.STRING, description: 'New ISO datetime YYYY-MM-DDTHH:MM:SS' },
          diffReason: { type: Type.STRING, description: 'Short note explaining the shift' },
        },
        propertyOrdering: ['id', 'start', 'end', 'diffReason'],
        required: ['id', 'start', 'end'],
      },
    },
    focusSprints: {
      type: Type.ARRAY,
      description: 'High-priority remediation study sessions (60-90 min each) placed during optimal cognitive hours respecting student feedback',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Unique identifier, e.g. sprint_la_1' },
          title: { type: Type.STRING, description: 'e.g. Linear Algebra — Focus Sprint' },
          start: { type: Type.STRING, description: 'ISO datetime YYYY-MM-DDTHH:MM:SS' },
          end: { type: Type.STRING, description: 'ISO datetime YYYY-MM-DDTHH:MM:SS' },
          topic: { type: Type.STRING, description: 'Specific concept targeted, e.g. Eigenvalues or Null Space' },
        },
        propertyOrdering: ['id', 'title', 'start', 'end', 'topic'],
        required: ['id', 'title', 'start', 'end', 'topic'],
      },
    },
  },
  propertyOrdering: ['aiRationale', 'diffs', 'rescheduledEvents', 'focusSprints'],
  required: ['aiRationale', 'diffs', 'rescheduledEvents', 'focusSprints'],
};

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured in .env.local.' },
      { status: 500 }
    );
  }

  let body: {
    studentFeedback?: string;
    studentId?: string;
    currentSchedule?: AdaptiveScheduleResult;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const studentFeedback = (body.studentFeedback || '').trim();
  const studentId = body.studentId || 'stu_ram_001';

  // Read mock database context
  const typedDb = db as StudentDatabase;
  const typedScheduleDb = scheduleDb as StudentScheduleDB;
  const scheduleRecord = typedScheduleDb[studentId];
  const analytics = computeStudentAnalytics(typedDb);

  if (!scheduleRecord) {
    return NextResponse.json(
      { error: `No schedule record found for student ${studentId}` },
      { status: 404 }
    );
  }

  const criticalSubject = analytics.criticalSubject;
  const chronotype = scheduleRecord.chronotype;

  // Build current schedule reference
  const currentEvents: ScheduledEvent[] = body.currentSchedule?.events || [];
  const weekStart = body.currentSchedule?.weekStart || new Date().toISOString().slice(0, 10);
  const weekEnd = body.currentSchedule?.weekEnd || '';

  // Extract flexible personal events that could be rescheduled if needed
  const flexibleEvents = currentEvents.filter((e) => e.category === 'PERSONAL' && !e.title.toLowerCase().includes('lunch') && !e.title.toLowerCase().includes('rest'));

  const prompt = `You are the EduEye Principal Cognitive Scheduling AI.
Your objective is to re-balance an engineering student's 7-day academic and personal schedule by incorporating the student's personal feedback while guaranteeing that their critical academic deficits are remediated during optimal mental alertness hours.

--- STUDENT TELEMETRY ---
Name: ${typedDb.student.name} (${typedDb.student.branch}, Semester ${typedDb.student.semester})
Chronotype: ${chronotype} (Optimal mental alertness: 09:30-11:30 and 14:00-16:00. Postprandial dip at 13:00-14:00. Fatigue starts after 17:30).
Attendance: ${typedDb.student.daysAttended}/${typedDb.student.totalWorkingDays} days (${Math.round((typedDb.student.daysAttended / typedDb.student.totalWorkingDays) * 100)}%)

Academic Performance by Subject:
${analytics.subjects
  .map(
    (s) =>
      `- ${s.name} (${s.code}): CAT1=${s.cat1Score}/${s.maxCATScore}, CAT2=${s.cat2Score}/${s.maxCATScore} (Trend: ${s.trend}, Deficit Score: ${s.deficitScore.toFixed(
        1
      )}). Weaknesses: [${s.conceptWeaknesses.join(', ')}]`
  )
  .join('\n')}

CRITICAL DEFICIT SUBJECT: ${criticalSubject.name} (${criticalSubject.code})
- Weak concepts: ${criticalSubject.conceptWeaknesses.join(', ')}
- Trajectory: CAT2 dropped to ${criticalSubject.cat2Score}/${criticalSubject.maxCATScore}. Must receive 3-4 priority remediation focus sprints!

Upcoming High-Stakes Exams:
${scheduleRecord.upcomingExams
  .map((e) => `- ${e.subjectName} ${e.examType} on ${e.examDate} (Priority: ${e.priority})`)
  .join('\n')}

MANDATORY FIXED COMMITMENTS (DO NOT SCHEDULE STUDY DURING THESE TIMES):
- College Lectures: 09:30 - 13:00 (Mon to Fri) - Category: CLASS
- Lunch: 13:00 - 14:00 (Daily) - Category: PERSONAL
- Rest / Sleep: 22:00 - 23:59 (Daily) - Category: PERSONAL

FLEXIBLE PERSONAL EVENTS IN CURRENT SCHEDULE:
${flexibleEvents.map((e) => `• id: "${e.id}", title: "${e.title}", current time: ${e.start} -> ${e.end}`).join('\n')}

Current Planning Horizon:
Week: ${weekStart} to ${weekEnd}

--- STUDENT'S COMPLAINT / ADVICE / CONSTRAINTS ---
"${studentFeedback || 'Please optimize my focus blocks for maximum retention before my upcoming exams and minimize fatigue.'}"

--- SCHEDULING DIRECTIVES ---
1. Address the student's specific feedback directly (e.g. sports practice, shifting study to mornings, avoiding late evenings, etc.).
2. Plan 4 to 6 focused study sprint blocks in "focusSprints" (60-90 min each) targeting the critical deficit subject ("${criticalSubject.name}") and other weak areas, placed in optimal cognitive alertness hours that do not clash with College (09:30-13:00) or Lunch (13:00-14:00).
3. If any flexible personal event clashes with the student's requested preferences or ideal study slots, place its new time in "rescheduledEvents" and record it in "diffs".
4. All datetime strings MUST be formatted as ISO-8601 strings (YYYY-MM-DDTHH:MM:SS) within the 7-day week starting ${weekStart}.
5. Provide a clear, encouraging "aiRationale" explaining how the timetable was restructured.

Return valid JSON adhering to the schema.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: REBALANCE_SCHEMA,
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    });

    let text = response.text?.trim() || '{}';
    // Remove accidental markdown fences if returned
    if (text.startsWith('```json')) {
      text = text.slice(7);
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
    text = text.trim();

    const parsed = JSON.parse(text) as {
      aiRationale: string;
      diffs: ScheduleDiff[];
      rescheduledEvents?: Array<{
        id: string;
        start: string;
        end: string;
        diffReason?: string;
      }>;
      focusSprints?: Array<{
        id: string;
        title: string;
        start: string;
        end: string;
        topic?: string;
      }>;
    };

    // Deterministic merge with existing schedule:
    // 1. Map rescheduled events
    const rescheduledMap = new Map((parsed.rescheduledEvents || []).map((r) => [r.id, r]));

    // 2. Keep baseline CLASS and PERSONAL events, updating any that moved
    const updatedBaseEvents = currentEvents
      .filter((e) => e.category !== 'REMEDIATION_LOCK')
      .map((ev) => {
        const resched = rescheduledMap.get(ev.id);
        if (resched) {
          return {
            ...ev,
            start: resched.start,
            end: resched.end,
            isRescheduled: true,
            diffReason: resched.diffReason || 'Shifted by AI to accommodate preferences',
            color: EVENT_COLORS.RESCHEDULED.bg,
            textColor: EVENT_COLORS.RESCHEDULED.text,
            borderColor: EVENT_COLORS.RESCHEDULED.border,
          };
        }
        return ev;
      });

    // 3. Inject new focus sprints planned by Gemini
    const newFocusEvents: ScheduledEvent[] = (parsed.focusSprints || []).map((sprint, idx) => {
      const isCritical =
        sprint.title.toLowerCase().includes(criticalSubject.name.toLowerCase()) ||
        sprint.topic?.toLowerCase().includes(criticalSubject.name.toLowerCase());

      const colors = isCritical ? EVENT_COLORS.CRITICAL_FOCUS : EVENT_COLORS.REMEDIATION_LOCK;

      const startHour = new Date(sprint.start).getHours();
      const startMin = new Date(sprint.start).getMinutes();
      const minsFromMidnight = isNaN(startHour) ? 600 : startHour * 60 + startMin;
      const alertScore = getAlertnessScore(minsFromMidnight, chronotype);

      return {
        id: sprint.id || `sprint_gemini_${idx}`,
        title: sprint.title,
        start: sprint.start,
        end: sprint.end,
        category: 'REMEDIATION_LOCK',
        color: colors.bg,
        textColor: colors.text,
        borderColor: colors.border,
        topic: sprint.topic || criticalSubject.name,
        alertScore,
      };
    });

    const finalEvents = [...updatedBaseEvents, ...newFocusEvents];
    const focusCount = finalEvents.filter((e) => e.category === 'REMEDIATION_LOCK').length;

    const result: AdaptiveScheduleResult = {
      events: finalEvents,
      diffs: parsed.diffs || [],
      criticalSubject: criticalSubject.name,
      focusSlotsInjected: focusCount,
      weekStart,
      weekEnd,
      aiRationale: parsed.aiRationale || 'Schedule successfully re-balanced by Gemini AI.',
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown AI error';
    console.error('Error generating rebalanced schedule with Gemini:', err);
    return NextResponse.json(
      { error: `Gemini rebalance failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
