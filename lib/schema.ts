export type InterviewRole = "hr" | "tech" | "behavioral";

export type QuestionPayload = {
  id: string;
  question: string;
  rationale: string;
};

export type ProjectSummary = {
  name: string;
  stack: string[];
  highlights: string[];
};

export type CandidateProfile = {
  role: string;
  skills: string[];
  projects: ProjectSummary[];
  keywords: string[];
  rawText?: string;
};

export type EvaluationPayload = {
  score: number;
  feedback: string;
  reasons: {
    clarity: string;
    relevance: string;
    depth: string;
    confidence: string;
  };
  strengths: string[];
  improvements: string[];
  followup_suggestion?: string;
};

export type AnswerRecord = {
  questionId: string;
  question: string;
  answer: string;
  turnIndex?: number;
  focus_skill?: string;
  difficulty?: string;
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
  profile?: CandidateProfile | null;
};
