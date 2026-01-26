import { EvaluationPayload } from "./schema";

const tipsByScore: Record<number, string> = {
  5: "Excellent answer. Highlight outcomes, scale, and measurable impact.",
  4: "Strong response. Add specific metrics to sharpen the result.",
  3: "Good start. Expand on your actions and the final outcome.",
  2: "Needs more detail. Use the STAR framework for clarity.",
  1: "Too brief. Add context, actions, and results to show impact.",
};

export function evaluateAnswer({
  answer,
  focusAreas,
  question,
}: {
  answer: string;
  focusAreas: string[];
  question: string;
}): EvaluationPayload {
  const words = answer.split(/\s+/).filter(Boolean);
  const lengthScore = Math.min(3, Math.floor(words.length / 25) + 1);
  const combined = `${question} ${focusAreas.join(" ")}`.toLowerCase();
  const relevanceHits = focusAreas.filter((keyword) =>
    answer.toLowerCase().includes(keyword)
  ).length;
  const relevanceScore = relevanceHits > 2 ? 2 : relevanceHits;
  const score = Math.max(1, Math.min(5, lengthScore + relevanceScore));

  const strengths = [] as string[];
  if (lengthScore >= 2) {
    strengths.push("Provides sufficient detail");
  }
  if (relevanceScore >= 1) {
    strengths.push("Connects to role focus areas");
  }
  if (strengths.length === 0) {
    strengths.push("Willing to engage with the question");
  }

  const improvements = [] as string[];
  if (lengthScore < 2) {
    improvements.push("Add more context and depth");
  }
  if (relevanceScore === 0) {
    improvements.push("Tie the answer to the role or skills");
  }
  if (improvements.length === 0) {
    improvements.push("Include measurable impact");
  }

  return {
    score,
    feedback: tipsByScore[score],
    strengths,
    improvements,
  };
}
