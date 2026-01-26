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

  const clarityReason =
    lengthScore >= 3
      ? "Structured response with clear context and outcomes."
      : lengthScore >= 2
        ? "Mostly clear but could use more structure."
        : "Hard to follow due to limited detail.";
  const relevanceReason =
    relevanceScore >= 2
      ? "Directly ties to the role focus areas."
      : relevanceScore >= 1
        ? "Some relevance, but needs stronger alignment."
        : "Connection to the role focus areas is unclear.";
  const depthReason =
    lengthScore >= 3
      ? "Provides reasoning and supporting details."
      : lengthScore >= 2
        ? "Covers basics but lacks deeper insights."
        : "Surface-level response without depth.";
  const confidenceReason =
    words.length >= 60
      ? "Delivered with enough substance to feel confident."
      : words.length >= 30
        ? "Some confidence, but could be more decisive."
        : "Feels tentative due to brevity.";

  return {
    score,
    feedback: tipsByScore[score],
    reasons: {
      clarity: clarityReason,
      relevance: relevanceReason,
      depth: depthReason,
      confidence: confidenceReason,
    },
    strengths,
    improvements,
    followup_suggestion: "Share one metric or result that proves impact.",
  };
}
