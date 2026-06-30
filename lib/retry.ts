// lib/retry.ts

/**
 * Minimal exponential backoff retry wrapper — no new dependency needed.
 * Used by lib/llm.ts to handle transient LLM provider failures
 * (rate limits, 5xx, network timeouts) without crashing the interview flow.
 */

export interface RetryOptions {
  maxAttempts?: number;     // default 3 (1 initial + 2 retries)
  baseDelayMs?: number;     // default 500ms
  maxDelayMs?: number;      // default 4000ms — cap backoff growth
  isRetryable?: (error: unknown) => boolean;
}

const DEFAULT_RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

/**
 * Determines if an error from the Gemini/OpenAI SDK represents a
 * transient failure worth retrying, vs a permanent failure (bad
 * API key, invalid request) that should fail immediately.
 */
export function isTransientLLMError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as { status?: number; code?: string; message?: string };

  // HTTP status-based detection (works for both Gemini and OpenAI SDKs)
  if (err.status && DEFAULT_RETRYABLE_STATUS_CODES.has(err.status)) {
    return true;
  }

  // Network-level transient errors
  if (err.code === "ECONNRESET" || err.code === "ETIMEDOUT" || err.code === "ENOTFOUND") {
    return true;
  }

  // Message-based fallback (some SDKs don't expose status cleanly)
  const message = err.message?.toLowerCase() ?? "";
  if (
    message.includes("rate limit") ||
    message.includes("timeout") ||
    message.includes("503") ||
    message.includes("overloaded")
  ) {
    return true;
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes `fn` with exponential backoff retry on transient failures.
 *
 * Usage:
 *   const result = await withRetry(() => callGemini(prompt));
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 4000,
    isRetryable = isTransientLLMError,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === maxAttempts;
      const shouldRetry = !isLastAttempt && isRetryable(error);

      if (!shouldRetry) {
        throw error;
      }

      // Exponential backoff with jitter: base * 2^(attempt-1) + random(0-100ms)
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100,
        maxDelayMs
      );

      console.warn(
        `[LLM Retry] Attempt ${attempt}/${maxAttempts} failed (${
          (error as Error)?.message ?? "unknown error"
        }). Retrying in ${Math.round(delay)}ms...`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}