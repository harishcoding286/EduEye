// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Google Calendar OAuth Callback + Event Push
// GET /api/gcal-sync/callback?code=...
// Exchanges the auth code for tokens, then POSTs all schedule events to
// the student's primary Google Calendar.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server';
import { generateAdaptiveSchedule } from '@/engine/adaptiveScheduler';
import { computeStudentAnalytics } from '@/engine/studentAnalytics';
import db from '@/data/student_database.json';
import scheduleDb from '@/data/student_schedule.json';
import type { StudentDatabase } from '@/types/student-db';
import type { StudentScheduleDB, ScheduledEvent } from '@/types/schedule';

export const runtime = 'nodejs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
}

async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${APP_URL}/api/gcal-sync/callback`,
      grant_type: 'authorization_code',
    }),
  });
  return res.json() as Promise<TokenResponse>;
}

import { syncScheduleToGCal } from '@/lib/gcalService';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${APP_URL}/schedule?gcal=error&reason=not_configured`);
  }

  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${APP_URL}/schedule?gcal=error&reason=no_code`);
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    if (!tokens.access_token) {
      return NextResponse.redirect(`${APP_URL}/schedule?gcal=error&reason=token_failed`);
    }

    // Generate the 7-day adaptive schedule
    const data = db as StudentDatabase;
    const analytics = computeStudentAnalytics(data);
    const typedScheduleDb = scheduleDb as StudentScheduleDB;
    const scheduleRecord = typedScheduleDb[data.student.id];

    if (!scheduleRecord) {
      return NextResponse.redirect(`${APP_URL}/schedule?gcal=error&reason=no_schedule`);
    }

    const result = generateAdaptiveSchedule(
      data.student.id,
      scheduleRecord,
      analytics.subjects,
      new Date(),
    );

    // Sync focus and revision events while omitting any existing events on the same hour
    const syncRes = await syncScheduleToGCal(tokens.access_token, result.events);

    const response = NextResponse.redirect(
      `${APP_URL}/schedule?gcal=success&synced=${syncRes.synced}&omitted=${syncRes.omitted}`,
    );

    // Store token in httpOnly cookie so dynamic Gemini updates can push without re-authenticating
    response.cookies.set('gcal_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokens.expires_in || 3600,
    });

    if (tokens.refresh_token) {
      response.cookies.set('gcal_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 3600,
      });
    }

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[gcal-sync/callback]', msg);
    return NextResponse.redirect(`${APP_URL}/schedule?gcal=error&reason=push_failed`);
  }
}
