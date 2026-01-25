import { NextResponse } from "next/server";
import { createSession, listPresets } from "@/lib/store";
import { InterviewRole } from "@/lib/schema";
import { llmProvider } from "@/lib/llm";

export async function POST(request: Request) {
  const body = await request.json();
  const role = (body.role || "hr") as InterviewRole;
  const context = String(body.context || "");
  const preset = body.preset ? String(body.preset) : null;
  const session = createSession({ role, context, preset });

  return NextResponse.json({
    sessionId: session.id,
    provider: llmProvider(),
    presets: listPresets(),
  });
}
