import { adaptivePrompts, roleQuestions } from "./prompts";
import { QuestionPayload } from "./schema";

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
    const focus = focusAreas[turn % focusAreas.length];
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
