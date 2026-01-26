"use client";

import Script from "next/script";
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
  const [fileStatus, setFileStatus] = useState("");
  const [fileError, setFileError] = useState("");
  const [pdfReady, setPdfReady] = useState(false);
  const [docxReady, setDocxReady] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [docxError, setDocxError] = useState("");

  const extractPdfText = async (file: File) => {
    const pdfjsLib = (window as typeof window & { pdfjsLib?: any }).pdfjsLib;
    if (!pdfjsLib) {
      throw new Error("PDF parser failed to load. Please try again.");
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js";

    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let text = "";
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: unknown) =>
          item && typeof item === "object" && "str" in item ? String(item.str) : "",
        )
        .join(" ");
      text += `${pageText}\n`;
    }
    return text.trim();
  };

  const extractDocxText = async (file: File) => {
    const mammoth = (window as typeof window & { mammoth?: any }).mammoth;
    if (!mammoth) {
      throw new Error("DOCX parser failed to load. Please try again.");
    }
    const { value } = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    return value.trim();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    if (!file) {
      return;
    }

    setFileError("");
    setFileStatus(`Reading ${file.name}...`);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      let extracted = "";

      if (extension === "pdf") {
        if (pdfError) {
          throw new Error(pdfError);
        }
        if (!pdfReady) {
          throw new Error("PDF parser is still loading. Please try again.");
        }
        extracted = await extractPdfText(file);
      } else if (extension === "docx") {
        if (docxError) {
          throw new Error(docxError);
        }
        if (!docxReady) {
          throw new Error("DOCX parser is still loading. Please try again.");
        }
        extracted = await extractDocxText(file);
      } else {
        throw new Error("Please upload a PDF or DOCX file.");
      }

      if (!extracted) {
        throw new Error("No readable text found in the file.");
      }

      setContext((prev) => {
        const separator = prev.trim() ? "\n\n" : "";
        return `${prev}${separator}${extracted}`.trim();
      });
      setFileStatus(`Added text from ${file.name}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to read the file.";
      setFileError(message);
      setFileStatus("");
    } finally {
      event.target.value = "";
    }
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

  return (
    <main className="panel">
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.js"
        onLoad={() => setPdfReady(true)}
        onError={() => {
          const message = "Unable to load PDF parser. Please check your network.";
          setPdfError(message);
          setFileError(message);
        }}
        strategy="afterInteractive"
      />
      <Script
        src="https://unpkg.com/mammoth@1.7.1/mammoth.browser.min.js"
        onLoad={() => setDocxReady(true)}
        onError={() => {
          const message = "Unable to load DOCX parser. Please check your network.";
          setDocxError(message);
          setFileError(message);
        }}
        strategy="afterInteractive"
      />
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
        <label className="field field--full">
          Upload Resume (PDF/DOCX)
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileUpload}
          />
          <p className="helper">
            Files are parsed in your browser and never uploaded to the server.
          </p>
          {!pdfError && !docxError ? (
            <p className="helper">
              PDF parser: {pdfReady ? "ready" : "loading"} · DOCX parser:{" "}
              {docxReady ? "ready" : "loading"}
            </p>
          ) : null}
          {fileStatus ? <p className="helper">{fileStatus}</p> : null}
          {fileError ? <p className="helper" style={{ color: "#c92a2a" }}>{fileError}</p> : null}
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
