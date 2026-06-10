"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

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
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [uploadFileName, setUploadFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Parse a plain-text file directly */
  const readTxt = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve((ev.target?.result as string) ?? "");
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsText(file);
    });

  /** Extract text from a PDF via the /api/parse-pdf server route */
  const readPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const response = await fetch("/api/parse-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: arrayBuffer,
    });
    if (!response.ok) throw new Error(`Server error ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.text as string;
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setUploadStatus("loading");

    try {
      let text = "";
      if (file.name.endsWith(".pdf")) {
        text = await readPdf(file);
      } else {
        text = await readTxt(file);
      }

      if (!text.trim()) {
        throw new Error("File appears to be empty or unreadable");
      }

      setContext(text.trim());
      setUploadStatus("success");
    } catch (err) {
      console.error(err);
      setUploadStatus("error");
    }

    // Reset so the same file can be re-uploaded if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

  const uploadLabel =
    uploadStatus === "loading"
      ? "Reading…"
      : uploadStatus === "success"
      ? `✓ ${uploadFileName}`
      : uploadStatus === "error"
      ? "Upload failed — try again"
      : "Upload Resume (.txt or .pdf)";

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

        {/* ── Resume Upload ── */}
        <div className="field field--full">
          <span>Resume / Role / Skills Context</span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Hidden real input */}
            <input
              ref={fileInputRef}
              id="resume-upload"
              type="file"
              accept=".txt,.pdf"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            {/* Styled trigger button */}
            <label
              htmlFor="resume-upload"
              className="btn"
              style={{
                cursor: uploadStatus === "loading" ? "not-allowed" : "pointer",
                opacity: uploadStatus === "loading" ? 0.6 : 1,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              aria-disabled={uploadStatus === "loading"}
            >
              📄 {uploadLabel}
            </label>

            {uploadStatus === "success" && (
              <button
                className="btn"
                type="button"
                style={{ flexShrink: 0 }}
                onClick={() => {
                  setContext("");
                  setUploadStatus("idle");
                  setUploadFileName("");
                }}
                title="Clear uploaded resume"
              >
                ✕ Clear
              </button>
            )}
          </div>

          <textarea
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder="Paste resume highlights, role focus, or skills (e.g., React, Node, leadership) — or upload a file above."
          />

          {uploadStatus === "error" && (
            <p style={{ color: "var(--primary)", fontSize: "0.85rem", margin: 0 }}>
              Could not parse the file. Please check it&apos;s a valid .txt or .pdf and try again.
            </p>
          )}
        </div>

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