import { adaptivePrompts, roleQuestions } from "./prompts";
import { QuestionPayload, InterviewSession } from "./schema";
import { withRetry, isTransientLLMError } from "./retry";

/**
 * Typed result returned by every lib/llm.ts function instead of
 * throwing on final failure. Calling routes inspect `.ok` and
 * branch to a fallback rather than crashing the interview.
 */
export type LLMResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; isTransient: boolean };

// Types for LLM responses
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

// ─────────────────────────────────────────────────────────────────────────
// LLM Provider functions (new - with retry + typed results)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Gets the current LLM provider based on environment variables
 */
export function llmProvider() {
  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }
  if (process.env.GEMINI_API_KEY) {
    return "gemini";
  }
  return "heuristic";
}

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
 * Builds the prompt for question generation
 */
function buildQuestionPrompt(session: InterviewSession): string {
  const turns = session.turns || [];
  const history = turns
    .map(t => `Q: ${t.question}\nA: ${t.answer}`)
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
  session: InterviewSession
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
function buildReportPrompt(session: InterviewSession): string {
  const turns = session.turns || [];
  const history = turns
    .map(t => `Q: ${t.question}\nA: ${t.answer}\nScores: ${JSON.stringify(t.scores)}`)
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

/**
 * Parses the LLM response for question generation
 */
function parseQuestionResponse(response: string): string {
  // Clean up the response - remove any markdown or extra formatting
  return response.trim();
}

/**
 * Parses the LLM response for score evaluation
 */
function parseScoreResponse(response: string): RawScores {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(response);
    return {
      clarity: Number(parsed.clarity) || 5,
      relevance: Number(parsed.relevance) || 5,
      depth: Number(parsed.depth) || 5,
      confidence: Number(parsed.confidence) || 5,
      overall: Number(parsed.overall) || 5,
    };
  } catch {
    // Fallback if parsing fails
    return {
      clarity: 5,
      relevance: 5,
      depth: 5,
      confidence: 5,
      overall: 5,
    };
  }
}

/**
 * Parses the LLM response for report generation
 */
function parseReportResponse(response: string): FinalReport {
  try {
    const parsed = JSON.parse(response);
    return {
      overall_score: Number(parsed.overall_score) || 5,
      skill_wise_scores: parsed.skill_wise_scores || {},
      top_strengths: Array.isArray(parsed.top_strengths) ? parsed.top_strengths : [],
      top_gaps: Array.isArray(parsed.top_gaps) ? parsed.top_gaps : [],
      next_7_days_plan: Array.isArray(parsed.next_7_days_plan) ? parsed.next_7_days_plan : [
        "Review STAR framework responses from this session.",
        "Practice one behavioral story per day with metrics.",
        "Record and review a mock answer for clarity and pacing.",
        "Pick two focus skills and draft impact bullet points.",
        "Schedule a peer mock interview and gather feedback.",
        "Refine weak answers with concrete outcomes.",
        "Re-run the interview and compare scores.",
      ],
    };
  } catch {
    // Fallback report
    return {
      overall_score: 5,
      skill_wise_scores: {},
      top_strengths: ["Communication", "Technical knowledge", "Problem solving"],
      top_gaps: ["Structure answers better", "Add more metrics", "Be more concise"],
      next_7_days_plan: [
        "Review STAR framework responses from this session.",
        "Practice one behavioral story per day with metrics.",
        "Record and review a mock answer for clarity and pacing.",
        "Pick two focus skills and draft impact bullet points.",
        "Schedule a peer mock interview and gather feedback.",
        "Refine weak answers with concrete outcomes.",
        "Re-run the interview and compare scores.",
      ],
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Public API Functions with Retry + Typed Results
// ─────────────────────────────────────────────────────────────────────────

/**
 * Generates the next adaptive interview question.
 * Returns a typed result — never throws on LLM failure.
 */
export async function generateLLMQuestion(
  session: InterviewSession
): Promise<LLMResult<string>> {
  try {
    const question = await withRetry(
      async () => {
        const response = await callLLMProvider(buildQuestionPrompt(session));
        return parseQuestionResponse(response);
      },
      { maxAttempts: 3, baseDelayMs: 500 }
    );

    return { ok: true, data: question };
  } catch (error) {
    console.error("[generateLLMQuestion] Final failure after retries:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown LLM error",
      isTransient: isTransientLLMError(error),
    };
  }
}

/**
 * Evaluates a candidate's answer — returns scores.
 * Returns a typed result — never throws on LLM failure.
 */
export async function evaluateAnswerWithLLM(
  question: string,
  answer: string,
  session: InterviewSession
): Promise<LLMResult<RawScores>> {
  try {
    const scores = await withRetry(
      async () => {
        const response = await callLLMProvider(buildEvaluationPrompt(question, answer, session));
        return parseScoreResponse(response);
      },
      { maxAttempts: 3, baseDelayMs: 500 }
    );

    return { ok: true, data: scores };
  } catch (error) {
    console.error("[evaluateAnswerWithLLM] Final failure after retries:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown LLM error",
      isTransient: isTransientLLMError(error),
    };
  }
}

/**
 * Generates the final structured interview report.
 * Returns a typed result — never throws on LLM failure.
 */
export async function generateReportWithLLM(
  session: InterviewSession
): Promise<LLMResult<FinalReport>> {
  try {
    const report = await withRetry(
      async () => {
        const response = await callLLMProvider(buildReportPrompt(session));
        return parseReportResponse(response);
      },
      { maxAttempts: 3, baseDelayMs: 500 }
    );

    return { ok: true, data: report };
  } catch (error) {
    console.error("[generateReportWithLLM] Final failure after retries:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown LLM error",
      isTransient: isTransientLLMError(error),
    };
  }
}