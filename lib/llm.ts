import { adaptivePrompts, roleQuestions } from "./prompts";
import { CandidateProfile, QuestionPayload } from "./schema";

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
  profile,
}: {
  role: "hr" | "tech" | "behavioral";
  context: string;
  focusAreas: string[];
  lastAnswer: string | null;
  usedQuestions: Set<string>;
  turn: number;
  profile?: CandidateProfile | null;
}): QuestionPayload {
  const profileSkills = profile?.skills?.length ? profile.skills : [];
  const profileProjects = profile?.projects?.length ? profile.projects : [];

  if (profileProjects.length > 0) {
    const project = profileProjects[turn % profileProjects.length];
    const question = `Tell me about your project ${project.name}. What was the goal, your role, and the impact?`;
    if (!usedQuestions.has(question)) {
      return {
        id: `project_${turn}`,
        question,
        rationale:
          "Resume-based project question. Follow up: ask about tradeoffs or metrics.",
      };
    }
  }

  if (profileSkills.length > 0) {
    const skill = profileSkills[turn % profileSkills.length];
    const question = `Describe a time you used ${skill} to solve a problem. What tradeoffs did you consider?`;
    if (!usedQuestions.has(question)) {
      return {
        id: `skill_${turn}`,
        question,
        rationale:
          "Resume-based skill prompt. Follow up: ask for a specific example and measurable result.",
      };
    }
  }

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
