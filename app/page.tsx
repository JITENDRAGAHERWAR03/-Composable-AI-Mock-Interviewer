"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const presets = [
  { value: "", label: "Custom" },
  { value: "frontend", label: "Frontend Engineer" },
  { value: "backend", label: "Backend Engineer" },
  { value: "pm", label: "Product Manager" },
];

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState("hr");
  const [preset, setPreset] = useState("");
  const [context, setContext] = useState("");
  const [turns, setTurns] = useState(5);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [status, setStatus] = useState("Waiting to start");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    setStatus("Creating session...");
    const response = await fetch("/api/session/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, context, preset: preset || null, turns }),
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setStatus(payload.error || "Unable to start session");
      return;
    }

    router.push(`/interview?sessionId=${payload.sessionId}&audio=${audioEnabled}`);
  };

  return (
    <main className="panel">
      <div className="actions" style={{ marginBottom: "16px" }}>
        <div className="badge" aria-live="polite">
          <span className={"badge__dot badge__dot--active"}></span>
          <span>{status}</span>
        </div>
        <button
          className="btn btn--primary"
          type="button"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? "Starting..." : "Start Interview"}
        </button>
      </div>
      <h2>1. Configure Interview</h2>
      <div className="grid">
        <label className="field">
          Interview Type
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="hr">HR</option>
            <option value="tech">Tech</option>
            <option value="behavioral">Behavioral</option>
          </select>
        </label>
        <label className="field">
          Preset Context
          <select value={preset} onChange={(event) => setPreset(event.target.value)}>
            {presets.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field field--full">
          Resume / Role / Skills Context
          <textarea
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder="Paste resume highlights, role focus, or skills (e.g., React, Node, leadership)."
          />
        </label>
        <label className="field">
          Number of Questions
          <select
            value={turns}
            onChange={(event) => setTurns(Number(event.target.value))}
          >
            <option value={3}>3 questions</option>
            <option value={5}>5 questions</option>
            <option value={7}>7 questions</option>
            <option value={10}>10 questions</option>
          </select>
        </label>
      </div>
      <div className="actions">
        <label className="toggle">
          <input
            type="checkbox"
            checked={audioEnabled}
            onChange={(event) => setAudioEnabled(event.target.checked)}
          />
          <span>Audio mode (speak questions)</span>
        </label>
        <p className="helper">Audio uses the Web Speech API for TTS and dictation.</p>
      </div>
    </main>
  );
}
