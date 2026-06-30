import { describe, it, expect, beforeEach, vi } from "vitest";
import { VercelKVSessionStore } from "../store.kv";

// Mock the entire module
vi.mock("@vercel/kv", () => {
  const mockData = new Map<string, any>();
  
  return {
    kv: {
      set: vi.fn().mockImplementation(async (key: string, value: any) => {
        mockData.set(key, value);
        return "OK";
      }),
      get: vi.fn().mockImplementation(async (key: string) => {
        return mockData.get(key) || null;
      }),
      del: vi.fn().mockImplementation(async (key: string) => {
        mockData.delete(key);
        return 1;
      }),
    },
  };
});

describe("VercelKVSessionStore — cross-instance state sharing", () => {
  let storeA: VercelKVSessionStore;
  let storeB: VercelKVSessionStore;

  beforeEach(async () => {
    // Clear the mock data between tests
    const { kv } = await import("@vercel/kv");
    (kv.set as any).mockClear();
    (kv.get as any).mockClear();
    (kv.del as any).mockClear();
    
    // Clear the mock data store
    // @ts-ignore - accessing private mock data for cleanup
    const mockData = new Map();
    // Replace the internal state of the mock
    (kv.set as any).mockImplementation(async (key: string, value: any) => {
      mockData.set(key, value);
      return "OK";
    });
    (kv.get as any).mockImplementation(async (key: string) => {
      return mockData.get(key) || null;
    });
    (kv.del as any).mockImplementation(async (key: string) => {
      mockData.delete(key);
      return 1;
    });
    
    // Create fresh store instances
    storeA = new VercelKVSessionStore();
    storeB = new VercelKVSessionStore();
  });

  it("creates a session on instance A", async () => {
    const session = await storeA.create({
      role: "Frontend Engineer",
      interviewType: "Tech",
      skills: ["React", "TypeScript"],
      weakSkills: [],
      strongSkills: [],
    });

    expect(session.id).toBeDefined();
    expect(session.role).toBe("Frontend Engineer");
    expect(session.interviewType).toBe("Tech");
    expect(session.skills).toEqual(["React", "TypeScript"]);
    expect(session.turns).toEqual([]);
    expect(session.status).toBe("active");
  });

  it("reads the session created by instance A from instance B (cross-instance read)", async () => {
    // Create session with instance A
    const createdSession = await storeA.create({
      role: "Backend Engineer",
      interviewType: "Tech",
      skills: ["Node.js", "PostgreSQL"],
      weakSkills: [],
      strongSkills: [],
    });

    // Read it with instance B
    const retrievedSession = await storeB.get(createdSession.id);

    expect(retrievedSession).toBeDefined();
    expect(retrievedSession?.id).toBe(createdSession.id);
    expect(retrievedSession?.role).toBe("Backend Engineer");
    expect(retrievedSession?.skills).toEqual(["Node.js", "PostgreSQL"]);
  });

  it("appends a turn on instance B and reads it back from instance A", async () => {
    // Create session with instance A
    const createdSession = await storeA.create({
      role: "Product Manager",
      interviewType: "HR",
      skills: ["Communication", "Strategic Planning"],
      weakSkills: [],
      strongSkills: [],
    });

    // Append turn with instance B
    const turn = {
      question: "Tell me about a time you led a team?",
      answer: "I led a cross-functional team of 8 people...",
      scores: {
        clarity: 8,
        relevance: 7,
        depth: 6,
        confidence: 9,
        overall: 7.5,
      },
      timestamp: Date.now(),
    };

    const updatedSession = await storeB.appendTurn(createdSession.id, turn);
    
    expect(updatedSession.turns).toHaveLength(1);
    expect(updatedSession.turns[0].question).toBe(turn.question);

    // Read back with instance A
    const finalSession = await storeA.get(createdSession.id);
    expect(finalSession?.turns).toHaveLength(1);
    expect(finalSession?.turns[0].answer).toBe(turn.answer);
  });

  it("returns null for a non-existent or expired session", async () => {
    const session = await storeA.get("non-existent-id");
    expect(session).toBeNull();
  });
});