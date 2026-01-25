"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function InterviewClient() {
  const sp = useSearchParams();
  const r = useRouter();
  const sessionId = sp.get("sessionId") || "";

  const [turnIndex, setTurnIndex] = useState(1);
  const [question, setQuestion] = useState("");
  const [focusSkill, setFocusSkill] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [answer, setAnswer] = useState("");
  const [output, setOutput] = useState<any>(null);
  const [memory, setMemory] = useState<any>(null);

  async function loadQuestion() {
    const res = await fetch("/api/session/next-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();
    if (data.done) {
      r.push(`/report?sessionId=${sessionId}`);
      return;
    }
    setTurnIndex(data.turnIndex);
    setQuestion(data.question);
    setFocusSkill(data.focus_skill);
    setDifficulty(data.difficulty);
    setAnswer("");
    setOutput(null);
  }

  async function submit() {
    const res = await fetch("/api/session/submit-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        turnIndex,
        question,
        focus_skill: focusSkill,
        difficulty,
        answer,
      }),
    });
    const data = await res.json();
    setOutput(data.turn);
    setMemory(data.memory);
  }

  function speak(text: string) {
    const u = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(u);
  }

  function startSTT() {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setAnswer((prev) => (prev ? prev + " " : "") + transcript);
    };
    rec.start();
  }

  useEffect(() => {
    if (sessionId) loadQuestion();
  }, [sessionId]);

  if (!sessionId) {
    return <main style={{ padding: 16 }}>Missing sessionId</main>;
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "24px auto",
        padding: 16,
        display: "grid",
        gridTemplateColumns: "260px 1fr 340px",
        gap: 16,
      }}
    >
      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
        <h3 style={{ margin: 0 }}>Blocks</h3>
        <ul>
          <li>Role</li>
          <li>Question Generator</li>
          <li>Memory</li>
          <li>Evaluation</li>
          <li>Feedback</li>
          <li>Report</li>
        </ul>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>Turn {turnIndex}/5</h2>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Focus: {focusSkill} • {difficulty}
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "#f6f6f6",
          }}
        >
          <b>Q:</b> {question}
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button onClick={() => speak(question)}>🔊 Speak Question</button>
          <button onClick={startSTT}>🎙️ Record Answer</button>
        </div>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={8}
          style={{ width: "100%", marginTop: 10 }}
          placeholder="Type your answer here..."
        />

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button onClick={submit} disabled={!answer.trim()}>
            Submit Answer
          </button>
          <button onClick={loadQuestion} disabled={!output}>
            Next Question
          </button>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Output</h3>
        {!output ? (
          <div style={{ opacity: 0.7 }}>Submit answer to see evaluation + tips.</div>
        ) : (
          <>
            <div>
              <b>Overall:</b> {output.evaluation.overall}/10
            </div>

            <div style={{ marginTop: 8 }}>
              <b>Scores:</b>
              <ul>
                <li>Clarity: {output.evaluation.scores.clarity}</li>
                <li>Relevance: {output.evaluation.scores.relevance}</li>
                <li>Depth: {output.evaluation.scores.depth}</li>
                <li>Confidence: {output.evaluation.scores.confidence}</li>
              </ul>
            </div>

            <div>
              <b>Tips:</b>
              <ul>
                {output.feedback.tips.map((t: string, i: number) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            <div>
              <b>Memory:</b>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {memory?.lastAnswerSummary || "—"}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
