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
      description: 'List of events that were moved, rescheduled, or adjusted',
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
    revisedEvents: {
      type: Type.ARRAY,
      description: 'Full list of revised scheduled events for the 7-day period',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Event identifier' },
          title: { type: Type.STRING, description: 'Display title' },
          start: { type: Type.STRING, description: 'ISO datetime YYYY-MM-DDTHH:MM:SS' },
          end: { type: Type.STRING, description: 'ISO datetime YYYY-MM-DDTHH:MM:SS' },
          category: {
            type: Type.STRING,
            description: 'CLASS, PERSONAL, or REMEDIATION_LOCK',
          },
          topic: { type: Type.STRING, description: 'Course or concept topic' },
          isRescheduled: {
            type: Type.BOOLEAN,
            description: 'Whether this event was rescheduled or shifted',
          },
          diffReason: {
            type: Type.STRING,
            description: 'Short reason for change if rescheduled',
          },
        },
        propertyOrdering: [
          'id',
          'title',
          'start',
          'end',
          'category',
          'topic',
          'isRescheduled',
          'diffReason',
        ],
        required: ['id', 'title', 'start', 'end', 'category'],
      },
    },
  },
  propertyOrdering: ['aiRationale', 'diffs', 'revisedEvents'],
  required: ['aiRationale', 'diffs', 'revisedEvents'],
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
  const currentEvents = body.currentSchedule?.events || [];
  const weekStart = body.currentSchedule?.weekStart || new Date().toISOString().slice(0, 10);
  const weekEnd = body.currentSchedule?.weekEnd || '';

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
- Trajectory: CAT2 dropped to ${criticalSubject.cat2Score}/${criticalSubject.maxCATScore}. Must receive priority remediation focus sprints!

Upcoming High-Stakes Exams:
${scheduleRecord.upcomingExams
  .map((e) => `- ${e.subjectName} ${e.examType} on ${e.examDate} (Priority: ${e.priority})`)
  .join('\n')}

Baseline Commitments (Fixed or Routine):
- College Lectures: 09:30 - 13:00 (Mon to Fri) - Category: CLASS (Mandatory, DO NOT MOVE)
- Lunch: 13:00 - 14:00 (Daily) - Category: PERSONAL (Mandatory break, DO NOT OVERWRITE)
- Rest / Sleep: 22:00 - 23:59 (Daily) - Category: PERSONAL
- Flexible Activities: Gym (Mon/Wed/Fri 07:00-08:00), CS Study Group (Wed 17:00-18:30)

Current Planning Horizon:
Week: ${weekStart} to ${weekEnd}

CURRENT SCHEDULE SUMMARY (${currentEvents.length} events):
${currentEvents
  .slice(0, 30)
  .map((e) => `• [${e.category}] ${e.title} (${e.start} -> ${e.end}) ${e.topic ? 'Topic: ' + e.topic : ''}`)
  .join('\n')}

--- STUDENT'S COMPLAINT / ADVICE / CONSTRAINTS ---
"${studentFeedback || 'Please optimize my focus blocks for maximum retention before my upcoming exams and minimize fatigue.'}"

--- SCHEDULING DIRECTIVES ---
1. Address the student's specific feedback directly (e.g. if they mention sports, evening tiredness, preferred study hours, or shifting specific subjects, accommodate their request).
2. DO NOT move or delete mandatory College Lecture blocks (09:30 - 13:00 on weekdays) or Lunch (13:00 - 14:00).
3. Ensure the critical deficit subject ("${criticalSubject.name}") gets at least 3-4 high-priority Focus Sprint sessions ("REMEDIATION_LOCK", 60-90 min each) scheduled during the student's prime cognitive alertness hours.
4. If shifting or rescheduling any flexible PERSONAL event (e.g. Gym, Study group) to accommodate study sessions or student preferences, record it explicitly in "diffs" with a clear human-readable reason.
5. All dates in revisedEvents MUST be valid ISO-8601 strings in the 7-day period starting from ${weekStart}.
6. Provide a concise, professional, encouraging "aiRationale" explaining the adjustments.

Return valid JSON adhering to the schema.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: REBALANCE_SCHEMA,
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text) as {
      aiRationale: string;
      diffs: ScheduleDiff[];
      revisedEvents: Array<{
        id: string;
        title: string;
        start: string;
        end: string;
        category: 'CLASS' | 'PERSONAL' | 'REMEDIATION_LOCK';
        topic?: string;
        isRescheduled?: boolean;
        diffReason?: string;
      }>;
    };

    // Post-process and ensure correct styling tokens adhering to 60-20-20 palette
    const formattedEvents: ScheduledEvent[] = (parsed.revisedEvents || []).map((ev, idx) => {
      const isCritical =
        ev.category === 'REMEDIATION_LOCK' &&
        (ev.title.toLowerCase().includes(criticalSubject.name.toLowerCase()) ||
          ev.topic?.toLowerCase().includes(criticalSubject.name.toLowerCase()));

      let colorToken = EVENT_COLORS[ev.category] || EVENT_COLORS.PERSONAL;
      if (isCritical) {
        colorToken = EVENT_COLORS.CRITICAL_FOCUS;
      } else if (ev.isRescheduled) {
        colorToken = EVENT_COLORS.RESCHEDULED;
      }

      // Compute cognitive alertness score if not provided
      const startHour = new Date(ev.start).getHours();
      const startMin = new Date(ev.start).getMinutes();
      const minsFromMidnight = isNaN(startHour) ? 600 : startHour * 60 + startMin;
      const alertScore = getAlertnessScore(minsFromMidnight, chronotype);

      return {
        id: ev.id || `rebalanced_${idx}`,
        title: ev.title,
        start: ev.start,
        end: ev.end,
        category: ev.category,
        color: colorToken.bg,
        textColor: colorToken.text,
        borderColor: colorToken.border,
        topic: ev.topic || null,
        alertScore,
        isRescheduled: !!ev.isRescheduled,
        diffReason: ev.diffReason,
      };
    });

    const focusCount = formattedEvents.filter((e) => e.category === 'REMEDIATION_LOCK').length;

    const result: AdaptiveScheduleResult = {
      events: formattedEvents.length > 0 ? formattedEvents : currentEvents,
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
