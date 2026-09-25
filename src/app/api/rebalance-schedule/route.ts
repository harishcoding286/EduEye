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
      description: 'Balanced study sessions across the 7-day week: 90-120 min Deep Focus Sprints for the critical subject, and 30-45 min Quick Revisions for other subjects, strictly non-overlapping and outside sleep/college hours',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Unique identifier, e.g. sprint_la_1 or rev_os_1' },
          title: { type: Type.STRING, description: 'e.g. Linear Algebra — Deep Focus Sprint (2h) or Operating Systems — Review & Practice (40m)' },
          start: { type: Type.STRING, description: 'ISO datetime YYYY-MM-DDTHH:MM:SS' },
          end: { type: Type.STRING, description: 'ISO datetime YYYY-MM-DDTHH:MM:SS' },
          topic: { type: Type.STRING, description: 'Specific concept targeted' },
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
      { error: 'GEMINI_API_KEY is not configured. Please add it to your Vercel Environment Variables (or .env.local) and redeploy.' },
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
  const otherSubjects = analytics.subjects.filter((s) => s.id !== criticalSubject.id);
  const chronotype = scheduleRecord.chronotype;

  // Build current schedule reference
  const currentEvents: ScheduledEvent[] = body.currentSchedule?.events || [];
  const weekStart = body.currentSchedule?.weekStart || new Date().toISOString().slice(0, 10);
  const weekEnd = body.currentSchedule?.weekEnd || '';

  // Extract flexible personal events that could be rescheduled if needed
  const flexibleEvents = currentEvents.filter(
    (e) =>
      e.category === 'PERSONAL' &&
      !e.title.toLowerCase().includes('lunch') &&
      !e.title.toLowerCase().includes('rest') &&
      !e.title.toLowerCase().includes('sleep')
  );

  const prompt = `You are the EduEye Principal Cognitive Scheduling AI.
Your objective is to generate an optimal, scientifically balanced 7-day academic and personal schedule by incorporating the student's feedback while adhering to strict human cognitive and physiological constraints.

--- CRITICAL SCHEDULING RULES (MANDATORY) ---
1. STRICT SLEEP PROTECTION (8 HOURS MUST):
   - The student requires 8 hours of unbroken sleep every single night (22:30 to 07:30).
   - NEVER schedule any study session, revision, or rescheduled event between 22:30 and 07:30.
2. COLLEGE COMMITMENT PROTECTION:
   - College Lectures: 09:30 - 13:00 (Mon to Fri) - CATEGORY CLASS. NEVER touch or overlap college hours.
   - CS Lab Sessions: 14:00 - 16:00 (Tue, Thu) - CATEGORY CLASS. NEVER touch or overlap.
   - Lunch: 13:00 - 14:00 (Daily) - keep free for meals.
3. SUBJECT BALANCE DIRECTIVE:
   - CRITICAL DEFICIT SUBJECT (${criticalSubject.name}): Must receive high priority with 3 to 4 Deep Focus Sprint blocks (90-120 minutes each, e.g. 1.5 to 2 hours) during peak alertness hours (e.g. 17:30-19:30 or weekend mornings).
   - ALL OTHER SUBJECTS (${otherSubjects.map((s) => s.name).join(', ')}): MUST ALSO BE ALLOCATED ON THE SCHEDULE!
     Allocate at least 30 to 45 minutes of revision / active retrieval for each of these subjects across different days and different periods of the day (e.g., morning 08:00-08:45 before college, or late evening 20:15-21:00).
4. ABSOLUTE ZERO DUPLICATES / ZERO OVERLAPS:
   - If a task is allocated in a particular time slot, NO OTHER task may be placed in that same time slot.
   - No two events may share or overlap the same hour. Every event start and end time must be mutually exclusive.

--- STUDENT TELEMETRY ---
Name: ${typedDb.student.name} (${typedDb.student.branch}, Semester ${typedDb.student.semester})
Chronotype: ${chronotype} (Optimal mental alertness: 09:30-11:30 and 15:00-16:00. Post-lunch dip at 13:00-14:30. Fatigue starts after 18:00).
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
- Trajectory: CAT2 dropped to ${criticalSubject.cat2Score}/${criticalSubject.maxCATScore}. Must receive priority 90-120 min Deep Focus Sprints!

Upcoming High-Stakes Exams:
${scheduleRecord.upcomingExams
  .map((e) => `- ${e.subjectName} ${e.examType} on ${e.examDate} (Priority: ${e.priority})`)
  .join('\n')}

FLEXIBLE PERSONAL EVENTS IN CURRENT SCHEDULE:
${flexibleEvents.map((e) => `• id: "${e.id}", title: "${e.title}", current time: ${e.start} -> ${e.end}`).join('\n')}

Planning Horizon:
7-Day Window from ${weekStart} to ${weekEnd}.

--- STUDENT'S COMPLAINT / ADVICE / CONSTRAINTS ---
"${studentFeedback || 'Please optimize my schedule so critical subjects get 2 hours of focus and all other subjects get 30-45 mins of revision without touching sleep or college.'}"

Return valid JSON adhering to the schema. All datetimes must be in YYYY-MM-DDTHH:MM:SS format within the week window.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    let text = '';
    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseJsonSchema: REBALANCE_SCHEMA,
            temperature: 0.3,
            maxOutputTokens: 4096,
          },
        });
        text = response.text?.trim() || '';
        if (text) break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[rebalance-schedule] Model ${model} failed, attempting next fallback:`, lastError.message);
      }
    }

    if (!text) {
      throw lastError || new Error('All Gemini model fallbacks exhausted.');
    }

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

    // Build busy intervals map for each day to prevent ANY overlaps
    const busyIntervalsByDay = new Map<string, Array<{ startMins: number; endMins: number }>>();

    for (const base of updatedBaseEvents) {
      const day = base.start.slice(0, 10);
      const startH = parseInt(base.start.slice(11, 13), 10) || 0;
      const startM = parseInt(base.start.slice(14, 16), 10) || 0;
      const endH = parseInt(base.end.slice(11, 13), 10) || 0;
      const endM = parseInt(base.end.slice(14, 16), 10) || 0;
      if (!busyIntervalsByDay.has(day)) busyIntervalsByDay.set(day, []);
      busyIntervalsByDay.get(day)!.push({
        startMins: startH * 60 + startM,
        endMins: endH * 60 + endM,
      });
    }

    // 3. Inject new focus sprints planned by Gemini with strict anti-collision validation
    const newFocusEvents: ScheduledEvent[] = [];

    for (const [idx, sprint] of (parsed.focusSprints || []).entries()) {
      const day = sprint.start.slice(0, 10);
      const startH = parseInt(sprint.start.slice(11, 13), 10);
      const startM = parseInt(sprint.start.slice(14, 16), 10);
      const endH = parseInt(sprint.end.slice(11, 13), 10);
      const endM = parseInt(sprint.end.slice(14, 16), 10);

      const sprintStartMins = isNaN(startH) ? 1050 : startH * 60 + startM;
      const sprintEndMins = isNaN(endH) ? sprintStartMins + 90 : endH * 60 + endM;

      // 8-hour sleep window protection: strictly exclude 22:30 to 07:30
      if (sprintStartMins < 7 * 60 + 30 || sprintEndMins > 22 * 60 + 30) {
        continue;
      }

      // Check collision with already scheduled events on that day
      const dayBusy = busyIntervalsByDay.get(day) || [];
      const hasCollision = dayBusy.some(
        (b) => Math.max(sprintStartMins, b.startMins) < Math.min(sprintEndMins, b.endMins)
      );

      if (hasCollision) {
        continue; // Discard overlapping / duplicate tasks for that hour
      }

      // Register interval as busy
      dayBusy.push({ startMins: sprintStartMins, endMins: sprintEndMins });
      busyIntervalsByDay.set(day, dayBusy);

      const isCritical =
        sprint.title.toLowerCase().includes(criticalSubject.name.toLowerCase()) ||
        sprint.topic?.toLowerCase().includes(criticalSubject.name.toLowerCase());

      const colors = isCritical ? EVENT_COLORS.CRITICAL_FOCUS : EVENT_COLORS.REMEDIATION_LOCK;
      const midpoint = sprintStartMins + (sprintEndMins - sprintStartMins) / 2;
      const alertScore = getAlertnessScore(midpoint, chronotype);

      newFocusEvents.push({
        id: sprint.id || `sprint_gemini_${day}_${sprintStartMins}`,
        title: sprint.title,
        start: sprint.start,
        end: sprint.end,
        category: 'REMEDIATION_LOCK',
        color: colors.bg,
        textColor: colors.text,
        borderColor: colors.border,
        topic: sprint.topic || criticalSubject.name,
        alertScore,
      });
    }

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
