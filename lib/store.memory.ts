// lib/store.memory.ts

import { randomUUID } from "crypto";
import type { SessionStore, InterviewSession, QuestionAnswerTurn } from "./store";

/**
 * In-memory implementation — module-level Map.
 *
 * ⚠️ NOT SAFE for Vercel serverless deployment. Each function invocation
 * may run in a different isolated instance, and this Map will not be
 * shared across them. Use only for local development without a KV store
 * configured. See issue #44 for full context.
 */
export class InMemorySessionStore implements SessionStore {
  private sessions = new Map<string, InterviewSession>();

  async create(
    input: Omit<InterviewSession, "id" | "createdAt" | "updatedAt" | "turns" | "status">
  ): Promise<InterviewSession> {
    const now = Date.now();
    const session: InterviewSession = {
      id: randomUUID(),
      ...input,
      turns: [],
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async get(sessionId: string): Promise<InterviewSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async update(sessionId: string, session: InterviewSession): Promise<void> {
    session.updatedAt = Date.now();
    this.sessions.set(sessionId, session);
  }

  async appendTurn(sessionId: string, turn: QuestionAnswerTurn): Promise<InterviewSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    session.turns.push(turn);
    session.updatedAt = Date.now();
    this.sessions.set(sessionId, session);
    return session;
  }

  async complete(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = "completed";
      session.updatedAt = Date.now();
      this.sessions.set(sessionId, session);
    }
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}