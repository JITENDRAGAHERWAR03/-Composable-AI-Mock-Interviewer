"use client";

import { useEffect, useMemo, useState } from "react";

type AudioControlsProps = {
  enabled: boolean;
  question: string;
  onTranscript: (text: string) => void;
};

export default function AudioControls({
  enabled,
  question,
  onTranscript,
}: AudioControlsProps) {
  const [listening, setListening] = useState(false);

  const recognition = useMemo(() => {
    if (typeof window === "undefined") return null;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const instance = new SR();
    instance.lang = "en-IN";
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    return instance;
  }, []);

  useEffect(() => {
    if (!enabled || !question) return;
    if (typeof window === "undefined") return;
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [enabled, question]);

  useEffect(() => {
    if (!recognition) return;

    const handleResult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) onTranscript(transcript);
    };

    const handleEnd = () => setListening(false);
    const handleError = () => setListening(false);

    recognition.addEventListener("result", handleResult);
    recognition.addEventListener("end", handleEnd);
    recognition.addEventListener("error", handleError);

    return () => {
      recognition.removeEventListener("result", handleResult);
      recognition.removeEventListener("end", handleEnd);
      recognition.removeEventListener("error", handleError);
    };
  }, [recognition, onTranscript]);

  const handleListen = () => {
    if (!recognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (listening) return;

    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <div className="actions">
      <button
        className="btn"
        type="button"
        onClick={handleListen}
        disabled={!recognition || listening}
      >
        {listening ? "Listening..." : "🎙️ Use Mic"}
      </button>

      <span className="helper">
        {recognition
          ? "Web Speech API enabled"
          : "Speech recognition unavailable in this browser"}
      </span>
    </div>
  );
}
