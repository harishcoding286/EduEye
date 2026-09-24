// ─────────────────────────────────────────────────────────────────────────────
// EduEye — Quiz fetch with exponential back-off retry
// Retries automatically on HTTP 503 (model overloaded) up to maxAttempts.
// ─────────────────────────────────────────────────────────────────────────────
import type { GeneratedQuiz } from '@/types/student-db';

interface QuizRequestBody {
  subject: string;
  weakTopics: string[];
  avgScore: number;
}

const BASE_DELAY_MS = 1_500;   // first retry waits 1.5 s
const MAX_DELAY_MS  = 20_000;  // cap at 20 s per retry

export async function fetchQuizWithRetry(
  body: QuizRequestBody,
  maxAttempts = 6,
  onAttempt?: (attempt: number, delay: number) => void,
): Promise<GeneratedQuiz> {
  let attempt = 0;

  while (true) {
    const res = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = (await res.json()) as GeneratedQuiz;
      return data;
    }

    const payload = await res.json().catch(() => ({})) as { error?: string };

    // Only retry on 503 (model overloaded / high demand)
    if (res.status !== 503 || attempt + 1 >= maxAttempts) {
      throw new Error(payload.error ?? `HTTP ${res.status}`);
    }

    attempt++;
    const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
    onAttempt?.(attempt, delay);
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }
}
