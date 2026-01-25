"use client";

import { useEffect, useState } from "react";

type AudioControlsProps = {
  enabled: boolean;
  question: string;
  setAnswer: React.Dispatch<React.SetStateAction<string>>;
};

export default function AudioControls({
  enabled,
  question,
  setAnswer,
}: AudioControlsProps) {
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!enabled || !question) {
      return;
    }

    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [enabled, question]);

  const handleListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setAnswer((prev) => (prev ? `${prev} ` : "") + transcript);
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  return (
    <div className="actions">
      <button className="btn" type="button" onClick={handleListen}>
        {listening ? "Listening..." : "🎙️ Use Mic"}
      </button>
      <span className="helper">Web Speech API enabled</span>
    </div>
  );
}
