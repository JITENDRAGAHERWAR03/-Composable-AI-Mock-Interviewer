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
