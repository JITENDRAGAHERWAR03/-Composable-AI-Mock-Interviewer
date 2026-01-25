import { EvaluationPayload } from "@/lib/schema";

type OutputPanelProps = {
  evaluation: EvaluationPayload | null;
  memory: string[];
};

export default function OutputPanel({ evaluation, memory }: OutputPanelProps) {
  return (
    <div className="panel">
      <h2>Output Panel</h2>
      <div className="output">
        <h3>Live Evaluation</h3>
        <p>Score: {evaluation ? `${evaluation.score} / 5` : "--"}</p>
        <p>{evaluation ? evaluation.feedback : "Awaiting your first answer."}</p>
      </div>
      <div className="output" style={{ marginTop: "16px" }}>
        <h3>Memory (Recent Answers)</h3>
        {memory.length === 0 ? (
          <p className="helper">Answers will appear here after submission.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {memory.map((item, index) => (
              <li
                key={`${item}-${index}`}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                  marginBottom: "8px",
                }}
              >
                {item.length > 120 ? `${item.slice(0, 120)}...` : item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
