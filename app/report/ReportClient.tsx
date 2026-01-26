"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReportDashboard from "@/components/ReportDashboard";

export default function ReportClient() {
  const sp = useSearchParams();
  const sessionId = sp.get("sessionId") || "";
  const [report, setReport] = useState<any>(null);
  const [turns, setTurns] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const res = await fetch(`/api/session/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      setReport(data.report);
      setTurns(
        (data.answers || []).map((answer: any, index: number) => ({
          turnIndex: answer.turnIndex ?? index + 1,
          focus_skill: answer.focus_skill || data.focusAreas?.[index] || "",
          improvement: answer.evaluation?.improvements?.[0] || "—",
          evaluation: {
            overall: Math.min(10, (answer.evaluation?.score || 0) * 2),
            scores: {
              clarity: Math.min(10, (answer.evaluation?.score || 0) * 2),
              relevance: Math.min(10, (answer.evaluation?.score || 0) * 2),
              depth: Math.max(4, (answer.evaluation?.score || 0) * 2 - 1),
              confidence: Math.max(4, (answer.evaluation?.score || 0) * 2 - 1),
            },
          },
        }))
      );
    })();
  }, [sessionId]);

  if (!sessionId) return <main style={{ padding: 16 }}>Missing sessionId</main>;
  if (!report) return <main style={{ padding: 16 }}>Loading report…</main>;

  return (
    <main style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1>Final Report</h1>
      <ReportDashboard turns={turns} report={report} />

      <h3>Skill-wise</h3>
      <ul>
        {Object.entries(report.skill_wise_scores || {}).map(([k, v]: any) => (
          <li key={k}>
            {k}: {v}/10
          </li>
        ))}
      </ul>

      <h3>Next 7 Days Plan</h3>
      <ol>
        {(report.next_7_days_plan || []).map((s: string, i: number) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </main>
  );
}
