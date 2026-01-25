import { InterviewSession, InterviewRole } from "./schema";

const sessions = new Map<string, InterviewSession>();

const presets: Record<string, string> = {
  frontend:
    "Frontend Engineer. Skills: React, TypeScript, accessibility, performance, design collaboration.",
  backend:
    "Backend Engineer. Skills: Node.js, APIs, databases, scalability, reliability, security.",
  pm: "Product Manager. Skills: discovery, metrics, stakeholder alignment, roadmap planning.",
};

const focusFromContext = (context: string) =>
  context
    .toLowerCase()
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2)
    .slice(0, 6);

const createId = () =>
  `session_${Math.random().toString(36).slice(2, 8)}_${Date.now()}`;

export function createSession({
  role,
  context,
  preset,
  turns = 5,
}: {
  role: InterviewRole;
  context: string;
  preset: string | null;
  turns?: number;
}): InterviewSession {
  const resolvedContext = preset ? presets[preset] || context : context;
  const session: InterviewSession = {
    id: createId(),
    role,
    context: resolvedContext,
    preset,
    turns,
    currentTurn: 0,
    answers: [],
    memory: [],
    scores: [],
    lastQuestion: null,
    focusAreas: focusFromContext(resolvedContext),
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string) {
  return sessions.get(id) || null;
}

export function saveSession(session: InterviewSession) {
  sessions.set(session.id, session);
}

export function listPresets() {
  return presets;
}
