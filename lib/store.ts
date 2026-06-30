// lib/store.ts

/**
 * SessionStore — storage-agnostic interface for interview session state.
 *
 * This seam exists so the backing implementation (in-memory, Vercel KV,
 * Postgres, etc.) can be swapped without touching any API route.
 *
 * All route handlers (api/session/*) MUST go through this interface —
 * never reach into a module-level Map or object directly.
 */

export interface QuestionAnswerTurn {
  question: string;
  answer: string;
  scores: {
    clarity: number;
    relevance: number;
    depth: number;
    confidence: number;
    overall: number;
  } | null;
  timestamp: number;
}

export interface InterviewSession {
  id: string;
  role: string;
  interviewType: "HR" | "Tech" | "Behavioral";
  skills: string[];
  turns: QuestionAnswerTurn[];
  weakSkills: string[];
  strongSkills: string[];
  createdAt: number;
  updatedAt: number;
  status: "active" | "completed";
}

export interface SessionStore {
  /**
   * Create a new session and persist it. Returns the generated session.
   */
  create(input: Omit<InterviewSession, "id" | "createdAt" | "updatedAt" | "turns" | "status">): Promise<InterviewSession>;

  /**
   * Retrieve a session by ID. Returns null if not found or expired.
   */
  get(sessionId: string): Promise<InterviewSession | null>;

  /**
   * Persist an updated session (e.g. after a new turn is added).
   */
  update(sessionId: string, session: InterviewSession): Promise<void>;

  /**
   * Append a new Q&A turn to an existing session atomically.
   */
  appendTurn(sessionId: string, turn: QuestionAnswerTurn): Promise<InterviewSession>;

  /**
   * Mark a session as completed (used before generating final report).
   */
  complete(sessionId: string): Promise<void>;

  /**
   * Delete a session (cleanup / privacy request).
   */
  delete(sessionId: string): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────
// Active implementation — selected via factory below.
// Import from here in all API routes: `import { getSessionStore } from '@/lib/store'`
// ─────────────────────────────────────────────────────────────────────────

import { InMemorySessionStore } from "./store.memory";
import { VercelKVSessionStore } from "./store.kv";

let storeInstance: SessionStore | null = null;

/**
 * Factory — returns the configured SessionStore singleton.
 * Selects backend based on environment:
 *   - KV_REST_API_URL set → Vercel KV (production-ready, serverless-safe)
 *   - otherwise → in-memory (local dev only, single-process)
 */
export function getSessionStore(): SessionStore {
  if (storeInstance) return storeInstance;

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    storeInstance = new VercelKVSessionStore();
  } else {
    console.warn(
      "[SessionStore] KV_REST_API_URL not set — falling back to in-memory store. " +
      "This is NOT safe for production/serverless deployment. " +
      "See lib/store.kv.ts and .env.example for setup."
    );
    storeInstance = new InMemorySessionStore();
  }

  return storeInstance;
}