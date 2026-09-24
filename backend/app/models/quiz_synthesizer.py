"""
EduEye Autonomous Diagnostic Micro-Drill Synthesizer
Uses Groq / OpenAI GPT-4o-mini with Instructor / Pydantic for structured generation.
"""

import os
from typing import List, Optional
from pydantic import BaseModel, Field


class QuizQuestion(BaseModel):
    id: str = Field(description="Unique question identifier, e.g. q1, q2")
    questionText: str = Field(description="Clear, conceptually precise diagnostic question targeting the student gap")
    options: List[str] = Field(description="Exactly four multiple-choice answer choices (A, B, C, D)", min_length=4, max_length=4)
    correctIndex: int = Field(description="Zero-based index of the single correct option (0, 1, 2, or 3)", ge=0, le=3)
    remediationInsight: str = Field(description="1-2 sentence actionable explanation of the underlying concept and why the trap answer is incorrect")


class DiagnosticQuiz(BaseModel):
    id: str
    targetConcept: str
    estimatedMinutes: int = 5
    questions: List[QuizQuestion] = Field(description="Exactly 3 targeted diagnostic practice sprint questions", min_length=3, max_length=3)
    generatedBy: str = "EduEye-Instructor-Synthesizer"


class QuizSynthesisRequest(BaseModel):
    concept: str
    course: Optional[str] = "Linear Algebra"
    student_score: Optional[float] = 38.0
    provider: Optional[str] = "auto"  # "groq" | "openai" | "auto"


# High-fidelity domain fallbacks when offline or no API keys present
CURATED_FALLBACK_DRILLS = {
    "eigenvalues-eigenvectors": [
        QuizQuestion(
            id="q1",
            questionText="If A is an n x n matrix with eigenvalue λ and corresponding eigenvector v, what is the geometric effect of multiplying A by v?",
            options=[
                "v is rotated by 90 degrees in the column space",
                "v is scaled by a scalar factor λ along its own span without changing direction (except sign)",
                "v is projected onto the nullspace of matrix A",
                "The norm of v becomes zero regardless of λ"
            ],
            correctIndex=1,
            remediationInsight="Recall Av = λv. Multiplication by A does not rotate v off its line; it merely stretches, compresses, or reverses it by scalar λ."
        ),
        QuizQuestion(
            id="q2",
            questionText="To find the eigenvalues of an n x n square matrix A, which characteristic equation must be solved?",
            options=[
                "det(A - λI) = 0",
                "trace(A) * λ = det(A)",
                "(A + λI) * v = 0 with v = 0",
                "rank(A - λI) = n"
            ],
            correctIndex=0,
            remediationInsight="For (A - λI)v = 0 to have non-trivial solutions (v ≠ 0), the matrix (A - λI) must be singular, meaning det(A - λI) = 0."
        ),
        QuizQuestion(
            id="q3",
            questionText="Suppose matrix A has eigenvalues λ₁ = 2 and λ₂ = 5. What are the eigenvalues of matrix A²?",
            options=[
                "λ₁ = 4 and λ₂ = 10",
                "λ₁ = √2 and λ₂ = √5",
                "λ₁ = 4 and λ₂ = 25",
                "The eigenvalues cannot be determined without knowing matrix A"
            ],
            correctIndex=2,
            remediationInsight="If Av = λv, then A²v = A(Av) = A(λv) = λ(Av) = λ²v. Thus the eigenvalues of A² are 2² = 4 and 5² = 25."
        )
    ]
}


class QuizSynthesizer:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

    def generate_quiz(self, req: QuizSynthesisRequest) -> DiagnosticQuiz:
        normalized_concept = req.concept.strip().lower().replace(" ", "-")

        # 1. Attempt generation via Groq + Instructor
        if (req.provider in ["auto", "groq"]) and self.groq_api_key:
            try:
                import groq
                import instructor

                client = instructor.from_groq(groq.Groq(api_key=self.groq_api_key))
                prompt = (
                    f"Create an interactive 3-question diagnostic practice sprint for a student who scored {req.student_score}% "
                    f"in {req.course} on the prerequisite concept: '{req.concept}'. "
                    f"Target the exact failure point with step-by-step remediation insights for common misconceptions."
                )

                quiz = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    response_model=DiagnosticQuiz,
                    messages=[
                        {"role": "system", "content": "You are an expert cognitive remediation professor synthesizing precise diagnostic micro-drills."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2
                )
                quiz.id = f"quiz_{normalized_concept}_{int(os.times().elapsed)}"
                quiz.targetConcept = req.concept
                quiz.generatedBy = "Groq-LLaMA-3.3-Instructor"
                return quiz
            except Exception as e:
                print(f"[QuizSynthesizer] Groq synthesis fallback triggered: {e}")

        # 2. Attempt generation via OpenAI + Instructor (GPT-4o-mini)
        if (req.provider in ["auto", "openai"]) and self.openai_api_key:
            try:
                import openai
                import instructor

                client = instructor.from_openai(openai.OpenAI(api_key=self.openai_api_key))
                prompt = (
                    f"Synthesize an institutional 3-question diagnostic practice sprint for student prerequisite deficit '{req.concept}' "
                    f"in course '{req.course}' (scored {req.student_score}%). Target root-cause misconceptions with explanations."
                )

                quiz = client.chat.completions.create(
                    model="gpt-4o-mini",
                    response_model=DiagnosticQuiz,
                    messages=[
                        {"role": "system", "content": "You are an expert cognitive science professor generating structured diagnostic quizzes."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2
                )
                quiz.id = f"quiz_{normalized_concept}_{int(os.times().elapsed)}"
                quiz.targetConcept = req.concept
                quiz.generatedBy = "OpenAI-GPT-4o-mini-Instructor"
                return quiz
            except Exception as e:
                print(f"[QuizSynthesizer] OpenAI synthesis fallback triggered: {e}")

        # 3. High-Fidelity Domain Fallback
        questions = CURATED_FALLBACK_DRILLS.get(
            normalized_concept,
            CURATED_FALLBACK_DRILLS["eigenvalues-eigenvectors"]
        )

        return DiagnosticQuiz(
            id=f"quiz_curated_{normalized_concept}",
            targetConcept=req.concept,
            estimatedMinutes=5,
            questions=questions,
            generatedBy="EduEye-Instructor-Curated"
        )


quiz_synthesizer = QuizSynthesizer()
