import { describe, it, expect } from "vitest";
import { NEUTRAL_FALLBACK_SCORE } from "../schema";

describe("Schema", () => {
  it("should have neutral fallback scores", () => {
    expect(NEUTRAL_FALLBACK_SCORE).toBeDefined();
    expect(NEUTRAL_FALLBACK_SCORE.clarity).toBe(5);
    expect(NEUTRAL_FALLBACK_SCORE.relevance).toBe(5);
    expect(NEUTRAL_FALLBACK_SCORE.depth).toBe(5);
    expect(NEUTRAL_FALLBACK_SCORE.confidence).toBe(5);
    expect(NEUTRAL_FALLBACK_SCORE.overall).toBe(5);
  });
});