export type InterviewRole = "hr" | "tech" | "behavioral";
import { z } from "zod";

export type QuestionPayload = {
  id: string;
  question: string;
  rationale: string;
};

export type EvaluationPayload = {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
};

export type AnswerRecord = {
  questionId: string;
  question: string;
  answer: string;
  evaluation: EvaluationPayload;
};

export type InterviewSession = {
  id: string;
  role: InterviewRole;
  context: string;
  preset: string | null;
  turns: number;
  currentTurn: number;
  answers: AnswerRecord[];
  memory: string[];
  scores: number[];
  lastQuestion: QuestionPayload | null;
  focusAreas: string[];
};

/**
 * Schema for a single generated interview question.
 */
export const QuestionResponseSchema = z.object({
  question: z.string().min(10, "Question text too short to be valid"),
});

export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;

/**
 * Schema for the per-answer evaluation scores returned by the LLM.
 * All scores are integers 0-10.
 */
export const ScoreResponseSchema = z.object({
  clarity: z.number().min(0).max(10),
  relevance: z.number().min(0).max(10),
  depth: z.number().min(0).max(10),
  confidence: z.number().min(0).max(10),
  overall: z.number().min(0).max(10),
  strengths: z.array(z.string()).optional().default([]),
  improvements: z.array(z.string()).optional().default([]),
});

export type ScoreResponse = z.infer<typeof ScoreResponseSchema>;

/**
 * Schema for the final structured interview report.
 */
export const FinalReportSchema = z.object({
  overallScore: z.number().min(0).max(10),
  skillBreakdown: z.array(
    z.object({
      skill: z.string(),
      score: z.number().min(0).max(10),
    })
  ),
  topStrengths: z.array(z.string()).min(1),
  topGaps: z.array(z.string()).min(1),
  improvementPlan: z.array(z.string()).min(1).max(7), // 7-day plan
});

export type FinalReport = z.infer<typeof FinalReportSchema>;

/**
 * Neutral fallback score used when LLM output fails validation even
 * after a retry. Flagged so the UI/report can indicate automated
 * scoring was unavailable for this specific answer, rather than
 * silently showing a fabricated-looking score.
 */
export const NEUTRAL_FALLBACK_SCORE: ScoreResponse = {
  clarity: 5,
  relevance: 5,
  depth: 5,
  confidence: 5,
  overall: 5,
  strengths: [],
  improvements: ["Automated scoring unavailable for this answer."],
};