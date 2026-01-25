import { NextResponse } from "next/server";
import { getSession } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json();
  const sessionId = String(body.sessionId || "");
  const session = getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const totalScore = session.scores.reduce((sum, score) => sum + score, 0);
  const average = session.scores.length
    ? totalScore / session.scores.length
    : 0;
  const strengths = session.scores.filter((score) => score >= 4).length;
  const improvements = session.scores.filter((score) => score <= 2).length;

  return NextResponse.json({
    sessionId: session.id,
    role: session.role,
    context: session.context,
    answers: session.answers,
    focusAreas: session.focusAreas,
    summary: {
      averageScore: Number(average.toFixed(1)),
      strengths,
      improvements,
      totalTurns: session.turns,
    },
  });
}
