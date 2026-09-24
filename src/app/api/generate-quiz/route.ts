import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import type { GeneratedQuiz } from '@/types/student-db';

export const runtime = 'nodejs';

const QUIZ_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING, description: 'Subject name for the quiz' },
    questions: {
      type: Type.ARRAY,
      minItems: 5,
      maxItems: 5,
      items: {
        type: Type.OBJECT,
        properties: {
          questionText: {
            type: Type.STRING,
            description: 'The quiz question text',
          },
          options: {
            type: Type.ARRAY,
            minItems: 4,
            maxItems: 4,
            items: { type: Type.STRING },
            description: 'Exactly 4 answer choices',
          },
          correctIndex: {
            type: Type.INTEGER,
            description: 'Zero-based index of the correct answer (0–3)',
          },
          remediationInsight: {
            type: Type.STRING,
            description:
              'Friendly one-sentence explanation of the correct concept, displayed after answering',
          },
        },
        propertyOrdering: [
          'questionText',
          'options',
          'correctIndex',
          'remediationInsight',
        ],
        required: [
          'questionText',
          'options',
          'correctIndex',
          'remediationInsight',
        ],
      },
    },
  },
  propertyOrdering: ['subject', 'questions'],
  required: ['subject', 'questions'],
};

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured. Add it to your .env.local file.' },
      { status: 500 }
    );
  }

  let body: { subject: string; weakTopics: string[]; avgScore: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { subject, weakTopics, avgScore } = body;

  const prompt = `You are an expert academic tutor. A student named Ram is struggling with "${subject}".
His average CAT score in this subject is ${Math.round(avgScore)}%.
His known weak areas are: ${weakTopics.join(', ')}.

Generate exactly 5 diagnostic multiple-choice questions that:
- Target his specific weak concepts
- Test fundamental understanding, not trivia
- Have exactly 4 options each
- Include a friendly, encouraging one-sentence remediation insight after each answer
- Are appropriate for a semester-5 engineering student

Return valid JSON matching the provided schema exactly.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: QUIZ_SCHEMA,
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: 'No content generated from Gemini API.' },
        { status: 502 }
      );
    }

    const quiz = JSON.parse(text) as GeneratedQuiz;
    return NextResponse.json(quiz);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown error calling Gemini API';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
