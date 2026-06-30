// lib/parseStructuredOutput.ts

import type { z } from "zod";

/**
 * Extracts a JSON object from raw LLM text output, tolerating:
 *  - Markdown code fences (```json ... ```)
 *  - Leading/trailing commentary text around the JSON block
 *  - Extra whitespace
 *
 * Returns null if no parseable JSON object can be located.
 */
export function extractJSON(rawText: string): unknown | null {
  // Strip markdown code fences if present
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1] : rawText;

  // Find the first { ... } block — handles leading/trailing prose
  const braceMatch = candidate.match(/\{[\s\S]*\}/);
  const jsonString = braceMatch ? braceMatch[0] : candidate.trim();

  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

export type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string; rawText: string };

/**
 * Extracts and validates LLM JSON output against a Zod schema.
 * This is the single function every lib/llm.ts call site should
 * route structured output through before trusting it.
 */
export function validateLLMOutput<T>(
  rawText: string,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  const extracted = extractJSON(rawText);

  if (extracted === null) {
    return {
      valid: false,
      error: "Could not extract valid JSON from LLM response",
      rawText,
    };
  }

  const result = schema.safeParse(extracted);

  if (!result.success) {
    return {
      valid: false,
      error: result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
      rawText,
    };
  }

  return { valid: true, data: result.data };
}