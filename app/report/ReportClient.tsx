"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ReportClient() {
  const sp = useSearchParams();
  const sessionId = sp.get("sessionId") || "";
  const [report, setReport] = useState<any>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const res = await fetch(`/api/session/report?sessionId=${sessionId}`);
      const data = await res.json();
      setReport(data.report);
    })();
  }, [sessionId]);

  const downloadReportPdf = async () => {
    if (!report) return;
    setIsGeneratingPdf(true);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const margin = 40;
      const maxWidth = 555;
      let y = 50;

      const addHeading = (text: string) => {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(text, margin, y);
        y += 24;
      };

      const addText = (text: string) => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, margin, y);
        y += lines.length * 16;
      };

      const addBulletList = (items: string[], numbered = false) => {
        items.forEach((item, index) => {
          if (y > 720) {
            doc.addPage();
            y = 50;
          }
          const prefix = numbered ? `${index + 1}. ` : `• `;
          const lines = doc.splitTextToSize(prefix + item, maxWidth);
          doc.text(lines, margin, y);
          y += lines.length * 16;
        });
      };

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Mock Interview Final Report", margin, y);
      y += 30;

      addHeading(`Overall score: ${report.overall_score}/10`);
      addText(`This report includes a summary of your performance, skill-wise feedback, strengths, improvement areas, and a short improvement plan.`);

      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      addHeading("Skill-wise feedback");
      Object.entries(report.skill_wise_scores || {}).forEach(([skill, value]: any) => {
        if (y > 720) {
          doc.addPage();
          y = 50;
        }
        addText(`${skill}: ${value}/10`);
      });

      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      addHeading("Top strengths");
      addBulletList(report.top_strengths || []);

      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      addHeading("Improvement areas");
      addBulletList(report.top_gaps || []);

      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      addHeading("Improvement plan");
      addBulletList(report.next_7_days_plan || [], true);

      doc.save("mock-interview-report.pdf");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!sessionId) return <main style={{ padding: 16 }}>Missing sessionId</main>;
  if (!report) return <main style={{ padding: 16 }}>Loading report…</main>;

  return (
    <main style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Final Report</h1>
        <button
          type="button"
          disabled={isGeneratingPdf}
          onClick={downloadReportPdf}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "10px 18px",
            cursor: isGeneratingPdf ? "not-allowed" : "pointer",
          }}
        >
          {isGeneratingPdf ? "Generating PDF…" : "Download PDF"}
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
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
