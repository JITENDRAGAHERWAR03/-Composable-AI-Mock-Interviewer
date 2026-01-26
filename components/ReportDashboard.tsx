"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Turn = {
  turnIndex: number;
  focus_skill: string;
  improvement?: string;
  evaluation?: {
    overall?: number;
    scores?: Record<string, number>;
  };
};

type ReportDashboardProps = {
  turns: Turn[];
  report: any;
};

const avgScore = (turns: Turn[], key: string) => {
  const values = turns.map((turn) => turn?.evaluation?.scores?.[key] ?? 0);
  if (!values.length) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
};

export default function ReportDashboard({ turns, report }: ReportDashboardProps) {
  const metrics = [
    { name: "Clarity", score: avgScore(turns, "clarity") },
    { name: "Relevance", score: avgScore(turns, "relevance") },
    { name: "Depth", score: avgScore(turns, "depth") },
    { name: "Confidence", score: avgScore(turns, "confidence") },
  ];

  const overall100 = report?.overall_score != null ? report.overall_score * 10 : 0;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 12,
            minWidth: 220,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>Overall Score</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{overall100}/100</div>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 12,
            flex: 1,
            minWidth: 320,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Metrics (Avg /10)
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="score" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>
          Question-wise Performance
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>Turn</th>
              <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                Focus
              </th>
              <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                Overall
              </th>
              <th style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                1-line feedback
              </th>
            </tr>
          </thead>
          <tbody>
            {turns.map((turn) => (
              <tr key={turn.turnIndex}>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>
                  {turn.turnIndex}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>
                  {turn.focus_skill || "—"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>
                  {turn.evaluation?.overall ?? "—"}/10
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>
                  {turn.improvement || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 600 }}>Top Strengths</div>
          <ul>
            {(report?.top_strengths || []).map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 600 }}>Top Gaps</div>
          <ul>
            {(report?.top_gaps || []).map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
