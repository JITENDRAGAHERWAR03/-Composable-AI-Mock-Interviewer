"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnswerRecord } from "@/lib/schema";

type ReportPayload = {
  role: string;
  context: string;
  answers: AnswerRecord[];
  focusAreas: string[];
  summary: {
    averageScore: number;
    strengths: number;
    improvements: number;
    totalTurns: number;
  };
};

export default function ReportPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [status, setStatus] = useState("Loading report...");

  useEffect(() => {
    if (!sessionId) {
      setStatus("Missing session id. Return to the setup page.");
      return;
    }

    const loadReport = async () => {
      const response = await fetch("/api/session/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload.error || "Unable to load report");
        return;
      }
      setReport(payload);
      setStatus("Report ready");
    };

    loadReport();
  }, [sessionId]);

  return (
    <main className="panel">
      <div className="badge" aria-live="polite">
        <span className="badge__dot badge__dot--active"></span>
        <span>{status}</span>
      </div>
      <h2 style={{ marginTop: "16px" }}>Final Interview Report</h2>
      {!report ? (
        <p className="helper">Complete the interview to see your summary.</p>
      ) : (
        <div>
          <div className="grid" style={{ marginBottom: "16px" }}>
            <div className="output">
              <h3>Overall Score</h3>
              <p>{report.summary.averageScore} / 5</p>
            </div>
            <div className="output">
              <h3>Strengths</h3>
              <p>{report.summary.strengths} strong responses</p>
            </div>
            <div className="output">
              <h3>Needs Improvement</h3>
              <p>{report.summary.improvements} responses to deepen</p>
            </div>
            <div className="output">
              <h3>Focus Areas</h3>
              <p>{report.focusAreas.slice(0, 3).join(", ") || "General"}</p>
            </div>
          </div>
          <div className="output">
            <h3>Detailed Feedback</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Score</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {report.answers.map((entry) => (
                  <tr key={entry.questionId}>
                    <td>{entry.question}</td>
                    <td>{entry.evaluation.score} / 5</td>
                    <td>{entry.evaluation.feedback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
