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
    if (typeof window === "undefined") {
      return null;
    }
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition })
        .webkitSpeechRecognition ||
      null;

    if (!SpeechRecognition) {
      return null;
    }

    const instance = new SpeechRecognition();
    instance.lang = "en-US";
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    return instance;
  }, []);

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

  useEffect(() => {
    if (!recognition) {
      return;
    }

    const handleResult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    const handleEnd = () => {
      setListening(false);
    };

    recognition.addEventListener("result", handleResult);
    recognition.addEventListener("end", handleEnd);

    return () => {
      recognition.removeEventListener("result", handleResult);
      recognition.removeEventListener("end", handleEnd);
    };
  }, [recognition, onTranscript]);

  const handleListen = () => {
    if (!recognition) {
      return;
    }
    setListening(true);
    recognition.start();
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
