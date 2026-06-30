import { NextResponse } from "next/server";
import { getSessionStore } from "@/lib/store";

function buildReport(session: any) {
  const scores = session.turns
    .map((turn: any) => turn.scores?.overall || 0)
    .filter((score: number) => score > 0);
  
  const totalScore = scores.reduce((sum: number, score: number) => sum + score, 0);
  const average = scores.length ? totalScore / scores.length : 0;
  const overallScore = Math.round(average * 2);
  
  const skillScores = session.skills.reduce((acc: Record<string, number>, skill: string) => {
    acc[skill] = Math.min(10, Math.round(average * 2));
    return acc;
  }, {} as Record<string, number>);

  // Extract strengths and improvements from turns (placeholder logic)
  const strengths = session.turns
    .filter((turn: any) => turn.scores && turn.scores.overall > 7)
    .map((turn: any) => `Strong response to: ${turn.question.slice(0, 30)}...`);
  
  const improvements = session.turns
    .filter((turn: any) => turn.scores && turn.scores.overall < 5)
    .map((turn: any) => `Need improvement on: ${turn.question.slice(0, 30)}...`);

  return {
    overall_score: overallScore,
    skill_wise_scores: skillScores,
    top_strengths: strengths.slice(0, 3),
    top_gaps: improvements.slice(0, 3),
    next_7_days_plan: [
      "Review STAR framework responses from this session.",
      "Practice one behavioral story per day with metrics.",
      "Record and review a mock answer for clarity and pacing.",
      "Pick two focus skills and draft impact bullet points.",
      "Schedule a peer mock interview and gather feedback.",
      "Refine weak answers with concrete outcomes.",
      "Re-run the interview and compare scores.",
    ],
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const sessionId = String(body.sessionId || "");
  const store = getSessionStore();

  const session = await store.get(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Complete the session before generating report
  await store.complete(sessionId);

  const scores = session.turns
    .map((turn) => turn.scores?.overall || 0)
    .filter(score => score > 0);
  
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const average = scores.length ? totalScore / scores.length : 0;
  const strengths = scores.filter((score) => score >= 4).length;
  const improvements = scores.filter((score) => score <= 2).length;

  return NextResponse.json({
    report: buildReport(session),
    sessionId: session.id,
    role: session.role,
    context: session.skills.join(", "),
    answers: session.turns.map(turn => ({
      question: turn.question,
      answer: turn.answer,
      evaluation: {
        score: turn.scores?.overall || 0,
        strengths: [],
        improvements: []
      }
    })),
    focusAreas: session.skills,
    summary: {
      averageScore: Number(average.toFixed(1)),
      strengths,
      improvements,
      totalTurns: session.turns.length,
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId") || "";
  const store = getSessionStore();

  const session = await store.get(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    report: buildReport(session),
  });
}