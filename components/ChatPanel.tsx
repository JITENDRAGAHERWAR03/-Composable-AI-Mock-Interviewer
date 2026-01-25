"use client";

import { useState } from "react";
import AudioControls from "./AudioControls";

export type ChatPanelProps = {
  question: string;
  turn: number;
  turns: number;
  onSubmit: (answer: string) => void;
  audioEnabled: boolean;
};

export default function ChatPanel({
  question,
  turn,
  turns,
  onSubmit,
  audioEnabled,
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
        enabled={audioEnabled}
        question={question}
        setAnswer={setAnswer}
      />
    </div>
  );
}
