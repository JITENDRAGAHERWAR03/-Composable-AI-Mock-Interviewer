import { NextResponse } from "next/server";
import { getSessionStore } from "@/lib/store";
import { generateLLMQuestion } from "@/lib/llm";
import { getFallbackQuestion } from "@/lib/prompts";

export async function POST(request: Request) {
  const body = await request.json();
  const sessionId = String(body.sessionId || "");
  const store = getSessionStore();

  const session = await store.get(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status === "completed") {
    return NextResponse.json({ done: true });
  }

  // Try to generate question using LLM
  const result = await generateLLMQuestion(session);

  let question: string;
  let fallback = false;
  let fallbackReason: string | undefined;

  if (result.ok) {
    // ✅ LLM succeeded
    question = result.data;
  } else {
    // ❌ LLM failed after retries — use static fallback instead of crashing
    console.warn(
      `[next-question] LLM failed for session ${sessionId}, using fallback question. Error: ${result.error}`
    );

    const askedQuestions = session.turns.map((t) => t.question);
    const interviewType = session.interviewType as "HR" | "Tech" | "Behavioral";
    question = getFallbackQuestion(interviewType, askedQuestions);
    fallback = true;
    fallbackReason = "Having trouble generating your next question — using a backup question for now.";
  }

  // Store the question as a new turn with empty answer
  await store.appendTurn(sessionId, {
    question: question,
    answer: "", // Placeholder until answer is submitted
    scores: null,
    timestamp: Date.now(),
  });

  // Get updated session to get turn count
  const updatedSession = await store.get(sessionId);
  const turnCount = updatedSession?.turns.length || 0;

  // Calculate focus skill and difficulty based on turn count
  const focusSkill = session.skills[(turnCount - 1) % session.skills.length] || "general";
  const difficulty = turnCount >= 4
    ? "hard"
    : turnCount >= 3
      ? "medium"
      : "easy";

  return NextResponse.json({
    turn: turnCount,
    turns: 5, // Default turns - you may want to store this elsewhere
    question: question,
    turnIndex: turnCount,
    focus_skill: focusSkill,
    difficulty,
    fallback,
    fallbackReason,
  });
}