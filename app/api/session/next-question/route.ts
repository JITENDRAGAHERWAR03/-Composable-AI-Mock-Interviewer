import { NextResponse } from "next/server";
import { getSession, saveSession } from "@/lib/store";
import { generateQuestion } from "@/lib/llm";

export async function POST(request: Request) {
  const body = await request.json();
  const sessionId = String(body.sessionId || "");
  const session = getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.currentTurn >= session.turns) {
    return NextResponse.json({ done: true });
  }

  const usedQuestions = new Set(session.answers.map((entry) => entry.question));
  const question = generateQuestion({
    role: session.role,
    context: session.context,
    focusAreas: session.focusAreas,
    lastAnswer: session.answers.at(-1)?.answer ?? null,
    usedQuestions,
    turn: session.currentTurn + 1,
  });

  session.currentTurn += 1;
  session.lastQuestion = question;
  saveSession(session);

  const focusSkill =
    session.focusAreas[session.currentTurn % session.focusAreas.length] ||
    "general";
  const difficulty =
    session.currentTurn >= 4
      ? "hard"
      : session.currentTurn >= 3
        ? "medium"
        : "easy";

  return NextResponse.json({
    turn: session.currentTurn,
    turns: session.turns,
    question: question.question,
    turnIndex: session.currentTurn,
    focus_skill: focusSkill,
    difficulty,
  });
}
