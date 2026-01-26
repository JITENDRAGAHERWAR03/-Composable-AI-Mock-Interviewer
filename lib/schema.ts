export type InterviewRole = "hr" | "tech" | "behavioral";

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
