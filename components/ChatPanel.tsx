"use client";

import { useState } from "react";
import AudioControls from "./AudioControls";

export type ChatPanelProps = {
  question: string;
  turn: number;
  turns: number;
  onSubmit: (answer: string) => void;
  audioEnabled: boolean;
  fallback?: boolean;
  fallbackReason?: string;
};

export default function ChatPanel({
  question,
  turn,
  turns,
  onSubmit,
  audioEnabled,
  fallback,
  fallbackReason,
}: ChatPanelProps) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (!answer.trim()) {
      return;
    }
    onSubmit(answer.trim());
    setAnswer("");
  };

  return (
    <div className="panel">
      <h2>Interview Console</h2>
      <div className="output" style={{ marginBottom: "16px" }}>
        <p className="eyebrow">Current Question</p>
        {/* Fallback message display */}
        {fallback && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2">
            💡 {fallbackReason || "Using a backup question while we recover."}
          </div>
        )}
        <p>{question || "Awaiting the first question..."}</p>
      </div>
      <label className="field field--full">
        Your Answer
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Share your response here..."
        />
      </label>
      <div className="actions">
        <button
          className="btn btn--primary"
          type="button"
          onClick={handleSubmit}
          disabled={!question}
        >
          Submit Answer
        </button>
        <span className="helper">
          Turn {turn} / {turns}
        </span>
      </div>
      <AudioControls
        enabled={true}
        question={question}
        onTranscript={(text) =>
          setAnswer((prev) => (prev ? `${prev} ` : "") + text)
        }
      />
    </div>
  );
}