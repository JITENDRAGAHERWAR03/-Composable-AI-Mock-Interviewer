import { NextResponse } from "next/server";
import { getSession, saveSession } from "@/lib/store";
import { evaluateAnswer } from "@/lib/scoring";

export async function POST(request: Request) {
  const body = await request.json();
  const sessionId = String(body.sessionId || "");
  const answer = String(body.answer || "").trim();
  const session = getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.lastQuestion) {
    return NextResponse.json(
      { error: "Question not initialized" },
      { status: 400 }
    );
  }

  const evaluation = evaluateAnswer({
    answer,
    focusAreas: session.focusAreas,
    question: session.lastQuestion.question,
  });

  session.answers.push({
    questionId: session.lastQuestion.id,
    question: session.lastQuestion.question,
    answer,
    evaluation,
  });
  session.scores.push(evaluation.score);
  session.memory = [answer, ...session.memory].slice(0, 5);
  saveSession(session);

  return NextResponse.json({
    evaluation,
    memory: session.memory,
    answers: session.answers,
    scores: session.scores,
  });
}
