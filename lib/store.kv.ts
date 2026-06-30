// lib/store.kv.ts

import { kv } from "@vercel/kv";
import { randomUUID } from "crypto";
import type { SessionStore, InterviewSession, QuestionAnswerTurn } from "./store";

const SESSION_TTL_SECONDS = 60 * 60 * 6; // 6 hours — plenty for one interview sitting
const KEY_PREFIX = "interview-session:";

function sessionKey(id: string): string {
  return `${KEY_PREFIX}${id}`;
}

/**
 * Vercel KV (Redis-compatible) implementation of SessionStore.
 *
 * Safe for serverless: every read/write goes through the shared KV
 * instance, so any function invocation — regardless of which
 * underlying compute instance handles it — sees the same state.
 *
 * Sessions auto-expire after SESSION_TTL_SECONDS to avoid unbounded
 * storage growth from abandoned interviews.
 */
export class VercelKVSessionStore implements SessionStore {

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

    await kv.set(sessionKey(session.id), session, {
      ex: SESSION_TTL_SECONDS,
    });

    return session;
  }

  async get(sessionId: string): Promise<InterviewSession | null> {
    const session = await kv.get<InterviewSession>(sessionKey(sessionId));
    return session ?? null;
  }

  async update(sessionId: string, session: InterviewSession): Promise<void> {
    session.updatedAt = Date.now();
    // Refresh TTL on every write — keeps active sessions alive
    await kv.set(sessionKey(sessionId), session, {
      ex: SESSION_TTL_SECONDS,
    });
  }

  /**
   * Atomic-ish append: read-modify-write under Redis.
   * Vercel KV (Upstash Redis under the hood) does not expose native
   * JSON path operations on the free tier, so we do an optimistic
   * read-modify-write. For this app's concurrency profile (one user,
   * one session, sequential turns) this is sufficient — a future
   * improvement could use a Lua script for true atomicity if needed.
   */
  async appendTurn(sessionId: string, turn: QuestionAnswerTurn): Promise<InterviewSession> {
    const session = await this.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.turns.push(turn);
    session.updatedAt = Date.now();

    await kv.set(sessionKey(sessionId), session, {
      ex: SESSION_TTL_SECONDS,
    });

    return session;
  }

  async complete(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    if (session) {
      session.status = "completed";
      session.updatedAt = Date.now();
      // Extend TTL slightly on completion so the report remains
      // fetchable for a short window after the interview ends
      await kv.set(sessionKey(sessionId), session, {
        ex: SESSION_TTL_SECONDS,
      });
    }
  }

  async delete(sessionId: string): Promise<void> {
    await kv.del(sessionKey(sessionId));
  }
}