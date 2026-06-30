import { adaptivePrompts, roleQuestions } from "./prompts";
import { QuestionPayload } from "./schema";
import { withRetry, isTransientLLMError } from "./retry";
import {
  validateLLMOutput,
  type ValidationResult,
} from "./parseStructuredOutput";
import {
  QuestionResponseSchema,
  ScoreResponseSchema,
  FinalReportSchema,
  NEUTRAL_FALLBACK_SCORE,
  type ScoreResponse,
  type FinalReport,
} from "./schema";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export type LLMResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; isTransient: boolean };

export interface RawScores {
  clarity: number;
  relevance: number;
  depth: number;
  confidence: number;
  overall: number;
}

export interface FinalReport {
  overall_score: number;
  skill_wise_scores: Record<string, number>;
  top_strengths: string[];
  top_gaps: string[];
  next_7_days_plan: string[];
}

// ─────────────────────────────────────────────────────────────────────────
// Heuristic/rule-based question generation (existing)
// ─────────────────────────────────────────────────────────────────────────

const pickAdaptive = (answer: string) => {
  const normalized = answer.toLowerCase();
  return adaptivePrompts.find((prompt) =>
    prompt.trigger.some((token) => normalized.includes(token))
  );
};

export function generateQuestion({
  role,
  context,
  focusAreas,
  lastAnswer,
  usedQuestions,
  turn,
}: {
  role: "hr" | "tech" | "behavioral";
  context: string;
  focusAreas: string[];
  lastAnswer: string | null;
  usedQuestions: Set<string>;
  turn: number;
}): QuestionPayload {
  if (lastAnswer) {
    const adaptive = pickAdaptive(lastAnswer);
    if (adaptive && !usedQuestions.has(adaptive.question)) {
      return {
        id: `adaptive_${turn}`,
        question: adaptive.question,
        rationale: adaptive.rationale,
      };
    }
  }

  if (focusAreas.length > 0) {
    const focus = focusAreas[(turn - 1) % focusAreas.length];
    const question = `How have you applied ${focus} in your recent work?`;
    if (!usedQuestions.has(question)) {
      return {
        id: `focus_${turn}`,
        question,
        rationale: `Focus on ${focus} based on candidate context.`,
      };
    }
  }

  const base = roleQuestions[role] || [];
  const fallback = base.find((q) => !usedQuestions.has(q));
  if (fallback) {
    return {
      id: `role_${turn}`,
      question: fallback,
      rationale: `Role-based question for ${role} interview type.`,
    };
  }

  return {
    id: `general_${turn}`,
    question: "Tell me about a project you are proud of.",
    rationale: "General fallback to keep the flow moving.",
  };
}

export function llmProvider() {
  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }
  if (process.env.GEMINI_API_KEY) {
    return "gemini";
  }
  return "heuristic";
}

// ─────────────────────────────────────────────────────────────────────────
// LLM Provider Functions with Validation
// ─────────────────────────────────────────────────────────────────────────

/**
 * Internal function to call the LLM provider
 * This would need to be implemented based on your actual LLM setup
 */
async function callLLMProvider(prompt: string): Promise<string> {
  // TODO: Implement actual LLM call based on your provider
  // This is a placeholder - you'll need to implement this based on
  // whether you're using OpenAI, Gemini, or another provider
  
  const provider = llmProvider();
  
  if (provider === "openai") {
    // Call OpenAI API
    // const response = await openai.chat.completions.create({...});
    // return response.choices[0].message.content;
    throw new Error("OpenAI provider not yet implemented");
  } else if (provider === "gemini") {
    // Call Gemini API
    // const response = await gemini.generateContent(prompt);
    // return response.text();
    throw new Error("Gemini provider not yet implemented");
  } else {
    // Fallback to heuristic (existing logic)
    // Return a basic response for testing
    return "Basic heuristic response";
  }
}

/**
 * Returns a suffix to enforce strict JSON output
 */
function strictJSONSuffix(): string {
  return "\n\nIMPORTANT: Return ONLY valid JSON matching the exact shape specified above. No markdown code fences, no commentary, no explanation text before or after the JSON.";
}

/**
 * Generic helper: calls the LLM, validates the response against the
 * given schema, and retries ONCE with a stricter "return ONLY valid
 * JSON" prompt reinforcement if validation fails (distinct from the
 * transient-error retry in withRetry — this retry is for malformed
 * JSON, not provider errors).
 */
async function callAndValidate<T>(
  buildPrompt: (strict: boolean) => string,
  schema: import("zod").ZodSchema<T>
): Promise<LLMResult<T>> {
  try {
    const rawText = await withRetry(
      () => callLLMProvider(buildPrompt(false)),
      { maxAttempts: 3, baseDelayMs: 500 }
    );

    let validation: ValidationResult<T> = validateLLMOutput(rawText, schema);

    if (!validation.valid) {
      console.warn(
        `[Schema Validation] First attempt failed: ${validation.error}. Retrying with strict prompt...`
      );

      // Retry once with stricter prompt reinforcement
      const strictRawText = await withRetry(
        () => callLLMProvider(buildPrompt(true)),
        { maxAttempts: 2, baseDelayMs: 500 }
      );

      validation = validateLLMOutput(strictRawText, schema);
    }

    if (!validation.valid) {
      console.error(
        `[Schema Validation] Failed after strict retry: ${validation.error}`
      );
      return {
        ok: false,
        error: `Schema validation failed: ${validation.error}`,
        isTransient: false,
      };
    }

    return { ok: true, data: validation.data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown LLM error",
      isTransient: isTransientLLMError(error),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Prompt Builders
// ─────────────────────────────────────────────────────────────────────────

/**
 * Builds the prompt for question generation
 */
function buildQuestionPrompt(session: any): string {
  const turns = session.turns || [];
  const history = turns
    .map((t: any) => `Q: ${t.question}\nA: ${t.answer}`)
    .join("\n\n");
  
  return `
You are an expert interviewer. Generate the next interview question based on this context:

Role: ${session.role}
Interview Type: ${session.interviewType}
Skills: ${session.skills.join(", ")}
Previous conversation:
${history || "No previous conversation yet."}

Generate a single, relevant, and challenging interview question.
Return ONLY the question text, no additional formatting or commentary.
`;
}

/**
 * Builds the prompt for answer evaluation
 */
function buildEvaluationPrompt(
  question: string,
  answer: string,
  session: any
): string {
  return `
You are an expert interviewer evaluating a candidate's answer.

Question: ${question}
Candidate's Answer: ${answer}
Role: ${session.role}
Skills: ${session.skills.join(", ")}

Evaluate the answer on a scale of 1-10 for each category:
- clarity: How clear and well-structured is the answer?
- relevance: How relevant is the answer to the question?
- depth: How deep and insightful is the answer?
- confidence: How confident does the candidate sound?

Return a JSON object with these four scores and an overall score (average).
Example: {"clarity": 8, "relevance": 7, "depth": 6, "confidence": 9, "overall": 7.5}
`;
}

/**
 * Builds the prompt for report generation
 */
function buildReportPrompt(session: any): string {
  const turns = session.turns || [];
  const history = turns
    .map((t: any) => `Q: ${t.question}\nA: ${t.answer}\nScores: ${JSON.stringify(t.scores)}`)
    .join("\n\n");
  
  return `
You are an expert interviewer generating a final report for a mock interview session.

Session Details:
- Role: ${session.role}
- Type: ${session.interviewType}
- Skills: ${session.skills.join(", ")}

Interview History:
${history}

Generate a comprehensive report with:
1. overall_score (1-10)
2. skill_wise_scores (for each skill)
3. top_strengths (list of 3 strengths)
4. top_gaps (list of 3 areas for improvement)
5. next_7_days_plan (list of 7 action items)

Return a JSON object with these fields.
`;
}

// ─────────────────────────────────────────────────────────────────────────
// Public API Functions with Retry + Validation
// ─────────────────────────────────────────────────────────────────────────

/**
 * Generates the next adaptive interview question using LLM.
 * Returns a typed result — never throws on LLM failure.
 * Validates the response against QuestionResponseSchema.
 */
export async function generateLLMQuestion(
  session: any
): Promise<LLMResult<string>> {
  const result = await callAndValidate(
    (strict) =>
      buildQuestionPrompt(session) + (strict ? strictJSONSuffix() : ""),
    QuestionResponseSchema
  );

  if (!result.ok) return result;
  return { ok: true, data: result.data.question };
}

/**
 * Evaluates a candidate's answer using LLM — returns scores.
 * Returns a typed result — never throws on LLM failure.
 * Validates the response against ScoreResponseSchema.
 */
export async function evaluateAnswerWithLLM(
  question: string,
  answer: string,
  session: any
): Promise<LLMResult<ScoreResponse>> {
  return callAndValidate(
    (strict) =>
      buildEvaluationPrompt(question, answer, session) +
      (strict ? strictJSONSuffix() : ""),
    ScoreResponseSchema
  );
}

/**
 * Generates the final structured interview report using LLM.
 * Returns a typed result — never throws on LLM failure.
 * Validates the response against FinalReportSchema.
 */
export async function generateReportWithLLM(
  session: any
): Promise<LLMResult<FinalReport>> {
  return callAndValidate(
    (strict) => buildReportPrompt(session) + (strict ? strictJSONSuffix() : ""),
    FinalReportSchema
  );
}