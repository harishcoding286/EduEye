/**
 * EduEye Client API Gateway
 * Interfaces the Next.js frontend with the FastAPI (Python) backend:
 * - XGBoost / Scikit-Learn risk predictions
 * - Groq / OpenAI GPT-4o-mini structured diagnostic quizzes (Instructor/Pydantic)
 * - Cognitive scheduler & Google Calendar API
 * - Canvas LMS / Google Classroom REST webhooks
 * - Resend / SendGrid TA escalation triage
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { method: 'GET' });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline / mock fallback
  }
  return null;
}

export async function predictRiskML(studentPayload: any) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/predict-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentPayload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[ApiClient] FastAPI ML endpoint unavailable, using local calculation:', err);
  }
  return null;
}

export async function generateDynamicQuiz(concept: string, course = 'Linear Algebra', score = 38.0) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/generate-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept, course, student_score: score }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[ApiClient] FastAPI Instructor/Groq quiz generation unavailable, using local fallback:', err);
  }
  return null;
}

export async function requestCognitiveSlot(studentId: string, topic: string, events: any[]) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/schedule-remediation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        target_topic: topic,
        duration_minutes: 45,
        existing_events: events,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[ApiClient] FastAPI Cognitive Scheduler unavailable, using local engine:', err);
  }
  return null;
}

export async function triggerTAEscalation(studentName: string, studentId: string, topic: string, grade: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/escalate-ta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        student_name: studentName,
        course_name: 'Linear Algebra (MATH-204)',
        deficit_topic: topic,
        predicted_grade: grade,
        lag_hours: 48.0,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[ApiClient] FastAPI TA Escalation unavailable:', err);
  }
  return null;
}

export async function dispatchLMSWebhook(topic: string, score: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/lms/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'canvas',
        student_id: 'std_101',
        course_id: 'math204',
        course_name: 'Linear Algebra',
        assignment_id: `asmt_${Date.now()}`,
        assignment_title: `${topic} Pop Quiz`,
        topic: topic,
        score: score,
        max_score: 100.0,
        due_date: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[ApiClient] LMS Webhook endpoint unavailable:', err);
  }
  return null;
}
