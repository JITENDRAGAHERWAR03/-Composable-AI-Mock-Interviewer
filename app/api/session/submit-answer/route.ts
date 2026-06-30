import { NextResponse } from "next/server";
import { getSessionStore } from "@/lib/store";
import { evaluateAnswerWithLLM, RawScores } from "@/lib/llm";

// Neutral fallback scores when LLM evaluation fails
const NEUTRAL_FALLBACK_SCORES: RawScores = {
  clarity: 5,
  relevance: 5,
  depth: 5,
  confidence: 5,
  overall: 5,
};

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

  // Try to evaluate answer using LLM
  const result = await evaluateAnswerWithLLM(activeQuestion, answer, session);

  // Use LLM scores if available, otherwise use neutral fallback
  const scores = result.ok ? result.data : NEUTRAL_FALLBACK_SCORES;
  const scoringUnavailable = !result.ok;

  if (scoringUnavailable) {
    console.warn(
      `[submit-answer] LLM evaluation failed for session ${sessionId}, using neutral fallback scores. Error: ${result.error}`
    );
  }

  // Update the turn with the answer and scores
  const updatedSession = await store.appendTurn(sessionId, {
    question: activeQuestion,
    answer,
    scores,
    timestamp: Date.now(),
  });

  // Build response in the same format as the old implementation
  const overall = scores.overall;
  const turnPayload = {
    evaluation: {
      overall,
      scores: {
        clarity: scores.clarity,
        relevance: scores.relevance,
        depth: scores.depth,
        confidence: scores.confidence,
      },
    },
    feedback: {
      tips: scoringUnavailable
        ? ["Automated scoring is currently unavailable. Please review your answer manually."]
        : ["Good response! Consider adding more specific examples."], // This would come from LLM in a full implementation
    },
  };

  return NextResponse.json({
    turn: turnPayload,
    memory: {
      lastAnswerSummary: answer.slice(0, 140),
    },
    scores,
    scoringUnavailable,
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