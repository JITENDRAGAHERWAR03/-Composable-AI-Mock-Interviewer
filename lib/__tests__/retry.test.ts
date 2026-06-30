import { describe, it, expect, vi } from "vitest";
import { withRetry, isTransientLLMError } from "../retry";

describe("isTransientLLMError", () => {
  it("identifies 429 rate limit as transient", () => {
    expect(isTransientLLMError({ status: 429 })).toBe(true);
  });

  it("identifies 503 as transient", () => {
    expect(isTransientLLMError({ status: 503 })).toBe(true);
  });

  it("identifies 400 bad request as NOT transient", () => {
    expect(isTransientLLMError({ status: 400 })).toBe(false);
  });

  it("identifies network timeout as transient", () => {
    expect(isTransientLLMError({ code: "ETIMEDOUT" })).toBe(true);
  });
});

describe("withRetry", () => {
  it("returns result immediately on first success", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withRetry(fn);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on transient error and eventually succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 429 })
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValueOnce("success after retries");

    const result = await withRetry(fn, { baseDelayMs: 10 });

    expect(result).toBe("success after retries");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws immediately on non-transient error without retrying", async () => {
    const fn = vi.fn().mockRejectedValue({ status: 400 });

    await expect(withRetry(fn, { baseDelayMs: 10 })).rejects.toEqual({ status: 400 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws after exhausting maxAttempts on persistent transient error", async () => {
    const fn = vi.fn().mockRejectedValue({ status: 503 });

    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 })
    ).rejects.toEqual({ status: 503 });

    expect(fn).toHaveBeenCalledTimes(3);
  });
});