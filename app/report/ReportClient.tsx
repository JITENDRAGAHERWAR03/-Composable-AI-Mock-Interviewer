"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ReportClient() {
  const sp = useSearchParams();
  const sessionId = sp.get("sessionId") || "";
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const res = await fetch(`/api/session/report?sessionId=${sessionId}`);
      const data = await res.json();
      setReport(data.report);
    })();
  }, [sessionId]);

  if (!sessionId) return <main style={{ padding: 16 }}>Missing sessionId</main>;
  if (!report) return <main style={{ padding: 16 }}>Loading report…</main>;

  return (
    <main style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1>Final Report</h1>
      <div>
        <b>Overall:</b> {report.overall_score}/10
      </div>

      <h3>Skill-wise</h3>
      <ul>
        {Object.entries(report.skill_wise_scores || {}).map(([k, v]: any) => (
          <li key={k}>
            {k}: {v}/10
          </li>
        ))}
      </ul>

      <h3>Top Strengths</h3>
      <ul>
        {(report.top_strengths || []).map((s: string, i: number) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      <h3>Top Gaps</h3>
      <ul>
        {(report.top_gaps || []).map((s: string, i: number) => (
          <li key={i}>{s}</li>
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
