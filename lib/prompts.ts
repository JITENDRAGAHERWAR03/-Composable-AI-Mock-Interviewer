import { InterviewRole } from "./schema";

export const roleQuestions: Record<InterviewRole, string[]> = {
  hr: [
    "Tell me about yourself and what you are looking for in your next role.",
    "What motivates you at work and how do you stay engaged?",
    "Describe a time you handled feedback from a manager.",
    "How do you prioritize when multiple deadlines collide?",
    "What company values matter most to you?",
  ],
  tech: [
    "Walk me through a recent technical project and your contributions.",
    "How do you balance speed and quality in engineering work?",
    "Describe a challenging bug and how you resolved it.",
    "How do you design for scalability and reliability?",
    "What does good testing strategy look like to you?",
  ],
  behavioral: [
    "Describe a time you led through ambiguity.",
    "Tell me about a conflict on your team and how you handled it.",
    "Share a time you received critical feedback and what you did next.",
    "Describe a moment you influenced without authority.",
    "How do you maintain resilience during setbacks?",
  ],
};

export const adaptivePrompts = [
  {
    trigger: ["lead", "mentor", "coach"],
    question: "You mentioned leadership. How do you coach or develop others?",
    rationale: "Follow up on leadership signals to deepen behavioral evidence.",
  },
  {
    trigger: ["performance", "optimize", "latency"],
    question: "How do you measure and improve performance in your work?",
    rationale: "Probe performance practices when optimization is mentioned.",
  },
  {
    trigger: ["collaboration", "team", "stakeholder"],
    question: "How do you keep stakeholders aligned throughout a project?",
    rationale: "Explore cross-functional alignment when collaboration appears.",
  },
  {
    trigger: ["user", "customer", "empathy"],
    question: "How do you incorporate user feedback into your decisions?",
    rationale: "Dig into user empathy and feedback loops.",
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Static Fallback Questions for LLM Failures
// ─────────────────────────────────────────────────────────────────────────

/**
 * Static fallback questions used when the LLM adapter fails after
 * all retries. Keeps the interview moving during a provider outage
 * instead of dead-ending the session. Tagged by role/type for a
 * reasonable (non-random) fallback selection.
 */
export const FALLBACK_QUESTIONS: Record<
  "HR" | "Tech" | "Behavioral",
  string[]
> = {
  HR: [
    "Tell me about yourself and why you're interested in this role.",
    "What are your salary expectations for this position?",
    "Where do you see yourself in five years?",
    "Why are you leaving your current position?",
    "What do you know about our company culture?",
  ],
  Tech: [
    "Walk me through how you would approach debugging a production issue.",
    "Describe a technical challenge you solved recently and your approach.",
    "How do you stay updated with new technologies in your field?",
    "Explain a system design decision you made and why.",
    "What's your process for writing maintainable, testable code?",
  ],
  Behavioral: [
    "Tell me about a time you faced conflict with a teammate and how you resolved it.",
    "Describe a situation where you had to meet a tight deadline.",
    "Give an example of when you took initiative on a project.",
    "Tell me about a time you received difficult feedback and how you responded.",
    "Describe a time you had to learn something completely new quickly.",
  ],
};

/**
 * Picks a fallback question not yet asked in this session, tagged
 * by the session's interview type.
 */
export function getFallbackQuestion(
  interviewType: "HR" | "Tech" | "Behavioral",
  alreadyAsked: string[]
): string {
  const pool = FALLBACK_QUESTIONS[interviewType] ?? FALLBACK_QUESTIONS.Tech;
  const unused = pool.filter((q) => !alreadyAsked.includes(q));
  const candidates = unused.length > 0 ? unused : pool; // recycle if exhausted
  return candidates[Math.floor(Math.random() * candidates.length)];
}