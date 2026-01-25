import { NextResponse } from "next/server";
import { getSession } from "@/lib/store";

function buildReport(session: NonNullable<ReturnType<typeof getSession>>) {
  const totalScore = session.scores.reduce((sum, score) => sum + score, 0);
  const average = session.scores.length ? totalScore / session.scores.length : 0;
  const overallScore = Math.round(average * 2);
  const skillScores = session.focusAreas.reduce((acc, skill) => {
    acc[skill] = Math.min(10, Math.round(average * 2));
    return acc;
  }, {} as Record<string, number>);

  const strengths = session.answers.flatMap((entry) => entry.evaluation.strengths);
  const improvements = session.answers.flatMap(
    (entry) => entry.evaluation.improvements
  );

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
    report: buildReport(session),
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId") || "";
  const session = getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    report: buildReport(session),
  });
}
