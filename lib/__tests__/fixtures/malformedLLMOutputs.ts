// lib/__tests__/fixtures/malformedLLMOutputs.ts

export const MALFORMED_SCORE_OUTPUTS = {
  // Valid JSON with markdown code fences and trailing prose
  trailingProse: `
\`\`\`json
{
  "clarity": 7,
  "relevance": 8,
  "depth": 6,
  "confidence": 7,
  "overall": 7
}
\`\`\`
Here is the evaluation of the candidate's answer.
  `,
  
  // Valid JSON with leading/trailing commentary
  validWithExtraCommentary: `
Based on the candidate's response, here are the scores:
{
  "clarity": 8,
  "relevance": 9,
  "depth": 7,
  "confidence": 8,
  "overall": 8
}
This candidate performed well.
  `,
  
  // Missing required field (overall)
  missingField: `{
    "clarity": 8,
    "relevance": 7,
    "depth": 6,
    "confidence": 9
  }`,
  
  // Wrong type (string instead of number)
  wrongType: `{
    "clarity": 8,
    "relevance": "seven",
    "depth": 6,
    "confidence": 9,
    "overall": 7.5
  }`,
  
  // Scores out of range (should be 0-10)
  outOfRange: `{
    "clarity": 15,
    "relevance": -1,
    "depth": 6,
    "confidence": 9,
    "overall": 7.5
  }`,
  
  // Not JSON
  notJSON: "This is not JSON at all. Just plain text.",
  
  // Empty response
  emptyResponse: "",
  
  // Null values
  nullValues: `{
    "clarity": 8,
    "relevance": null,
    "depth": 6,
    "confidence": 9,
    "overall": 7.5
  }`,
  
  // Invalid JSON (missing quotes)
  invalidJSON: `{
    clarity: 8,
    relevance: 7,
    depth: 6,
    confidence: 9,
    overall: 7.5
  }`,
};

export const VALID_SCORE_OUTPUT = `{
  "clarity": 8,
  "relevance": 7,
  "depth": 6,
  "confidence": 9,
  "overall": 8
}`;

export const MALFORMED_QUESTION_OUTPUTS = {
  // Question too short (less than 10 characters)
  tooShort: `{
    "question": "Hi"
  }`,
  
  // Wrong key name
  missingKey: `{
    "question_text": "What is your experience with React?"
  }`,
  
  // Empty question
  emptyQuestion: `{
    "question": ""
  }`,
  
  // Not a string
  notString: `{
    "question": 123
  }`,
};

export const VALID_QUESTION_OUTPUT = `{
  "question": "What is your experience with TypeScript and how have you used it in production?"
}`;