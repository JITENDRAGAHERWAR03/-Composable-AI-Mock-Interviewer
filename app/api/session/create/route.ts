import { NextResponse } from "next/server";
import { createSession, listPresets } from "@/lib/store";
import { InterviewRole } from "@/lib/schema";
import { llmProvider } from "@/lib/llm";

export async function POST(request: Request) {
  const body = await request.json();
  const role = (body.role || "hr") as InterviewRole;
  const context = String(body.context || "");
  const preset = body.preset ? String(body.preset) : null;
  const rawTurns = Number(body.turns || 5);
  const turns = Number.isFinite(rawTurns)
    ? Math.min(Math.max(Math.round(rawTurns), 3), 10)
    : 5;
  const session = createSession({ role, context, preset, turns });

  return NextResponse.json({
    sessionId: session.id,
    provider: llmProvider(),
    presets: listPresets(),
  });
}
