import { NextResponse } from "next/server";
import { getSession, saveSession } from "@/lib/store";
import { evaluateAnswer } from "@/lib/scoring";

export async function POST(request: Request) {
  const body = await request.json();
  const sessionId = String(body.sessionId || "");
  const answer = String(body.answer || "").trim();
  const questionText = String(body.question || "");
  const session = getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.lastQuestion && !questionText) {
    return NextResponse.json(
      { error: "Question not initialized" },
      { status: 400 }
    );
  }

  const activeQuestion = session.lastQuestion?.question || questionText;
  const evaluation = evaluateAnswer({
    answer,
    focusAreas: session.focusAreas,
    question: activeQuestion,
  });

  session.answers.push({
    questionId: session.lastQuestion?.id || `manual_${Date.now()}`,
    question: activeQuestion,
    answer,
    evaluation,
  });
  session.scores.push(evaluation.score);
  session.memory = [answer, ...session.memory].slice(0, 5);
  saveSession(session);

  const overall = Math.min(10, evaluation.score * 2);
  const turnPayload = {
    evaluation: {
      overall,
      scores: {
        clarity: Math.min(10, evaluation.score * 2),
        relevance: Math.min(10, evaluation.score * 2),
        depth: Math.max(4, evaluation.score * 2 - 1),
        confidence: Math.max(4, evaluation.score * 2 - 1),
      },
    },
    feedback: {
      tips: evaluation.improvements.length
        ? evaluation.improvements
        : [evaluation.feedback],
    },
  };

  return NextResponse.json({
    turn: turnPayload,
    memory: {
      lastAnswerSummary: answer.slice(0, 140),
    },
    evaluation,
    answers: session.answers,
    scores: session.scores,
  });
}
