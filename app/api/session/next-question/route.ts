import { NextResponse } from "next/server";
import { getSessionStore } from "@/lib/store";
import { generateQuestion } from "@/lib/llm";

export async function POST(request: Request) {
  const body = await request.json();
  const sessionId = String(body.sessionId || "");
  const store = getSessionStore();

  const session = await store.get(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Check if session is completed or if we've reached the turn limit
  if (session.status === "completed") {
    return NextResponse.json({ done: true });
  }

  const usedQuestions = new Set(session.turns.map((turn) => turn.question));
  const lastAnswer = session.turns.length > 0 
    ? session.turns[session.turns.length - 1].answer 
    : null;

  const question = generateQuestion({
    role: session.role as any, // Type casting to match old interface
    context: session.skills.join(", "), // Using skills as context
    focusAreas: session.skills.length > 0 ? session.skills : ["general"],
    lastAnswer,
    usedQuestions,
    turn: session.turns.length + 1,
  });

  // Append the question as a turn with null answer (to be filled later)
  await store.appendTurn(sessionId, {
    question: question.question,
    answer: "", // Placeholder until answer is submitted
    scores: null,
    timestamp: Date.now(),
  });

  const focusSkill = session.skills[(session.turns.length) % session.skills.length] || "general";
  const difficulty = session.turns.length >= 3
    ? "hard"
    : session.turns.length >= 2
      ? "medium"
      : "easy";

  return NextResponse.json({
    turn: session.turns.length + 1,
    turns: 5, // Default turns, this would need to be stored elsewhere
    question: question.question,
    turnIndex: session.turns.length + 1,
    focus_skill: focusSkill,
    difficulty,
  });
}