import { NextResponse } from "next/server";
import { getSessionStore } from "@/lib/store";
import { evaluateAnswer } from "@/lib/scoring";

export async function POST(request: Request) {
  const body = await request.json();
  const sessionId = String(body.sessionId || "");
  const answer = String(body.answer || "").trim();
  const questionText = String(body.question || "");
  const store = getSessionStore();

  const session = await store.get(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Find the last unanswered turn or use the provided question
  const lastUnansweredTurn = session.turns
    .slice()
    .reverse()
    .find(turn => turn.answer === "");

  const activeQuestion = lastUnansweredTurn?.question || questionText;

  if (!activeQuestion) {
    return NextResponse.json(
      { error: "Question not initialized" },
      { status: 400 }
    );
  }

  const evaluation = evaluateAnswer({
    answer,
    focusAreas: session.skills,
    question: activeQuestion,
  });

  // Convert evaluation to scores format expected by the new interface
  const scores = {
    clarity: Math.min(10, evaluation.score * 2),
    relevance: Math.min(10, evaluation.score * 2),
    depth: Math.max(4, evaluation.score * 2 - 1),
    confidence: Math.max(4, evaluation.score * 2 - 1),
    overall: Math.min(10, evaluation.score * 2),
  };

  // Update the turn with the answer and scores
  const updatedSession = await store.appendTurn(sessionId, {
    question: activeQuestion,
    answer,
    scores,
    timestamp: Date.now(),
  });

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
    answers: updatedSession.turns.map(turn => ({
      questionId: `turn_${turn.timestamp}`,
      question: turn.question,
      answer: turn.answer,
      evaluation: {
        score: turn.scores?.overall || 0,
        feedback: "",
        strengths: [],
        improvements: []
      }
    })),
    scores: updatedSession.turns.map(turn => turn.scores?.overall || 0),
  });
}