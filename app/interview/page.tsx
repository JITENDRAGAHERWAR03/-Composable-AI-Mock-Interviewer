"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BlocksPanel from "@/components/BlocksPanel";
import ChatPanel from "@/components/ChatPanel";
import OutputPanel from "@/components/OutputPanel";
import { EvaluationPayload, QuestionPayload } from "@/lib/schema";

export default function InterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const audioEnabled = searchParams.get("audio") === "true";

  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [turn, setTurn] = useState(0);
  const [turns, setTurns] = useState(5);
  const [evaluation, setEvaluation] = useState<EvaluationPayload | null>(null);
  const [memory, setMemory] = useState<string[]>([]);
  const [status, setStatus] = useState("Interview in progress");

  const ready = useMemo(() => Boolean(sessionId), [sessionId]);

  useEffect(() => {
    if (!ready) {
      setStatus("Missing session. Return to setup.");
      return;
    }

    const loadQuestion = async () => {
      const response = await fetch("/api/session/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload.error || "Unable to load question");
        return;
      }
      setQuestion(payload.question);
      setTurn(payload.turn);
      setTurns(payload.turns);
    };

    loadQuestion();
  }, [ready, sessionId]);

  const submitAnswer = async (answer: string) => {
    const response = await fetch("/api/session/submit-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, answer }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Unable to submit answer");
      return;
    }

    setEvaluation(payload.evaluation);
    setMemory(payload.memory);

    if (turn >= turns) {
      router.push(`/report?sessionId=${sessionId}`);
      return;
    }

    const nextResponse = await fetch("/api/session/next-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const nextPayload = await nextResponse.json();
    if (!nextResponse.ok) {
      setStatus(nextPayload.error || "Unable to load next question");
      return;
    }
    setQuestion(nextPayload.question);
    setTurn(nextPayload.turn);
  };

  return (
    <main className="interview-grid">
      <section className="panel">
        <div className="badge" aria-live="polite">
          <span className="badge__dot badge__dot--active"></span>
          <span>{status}</span>
        </div>
        <div style={{ marginTop: "16px" }}>
          <BlocksPanel />
        </div>
      </section>
      <ChatPanel
        question={question?.question || ""}
        turn={turn}
        turns={turns}
        onSubmit={submitAnswer}
        audioEnabled={audioEnabled}
      />
      <OutputPanel evaluation={evaluation} memory={memory} />
    </main>
  );
}
