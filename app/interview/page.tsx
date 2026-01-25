import { Suspense } from "react";
import InterviewClient from "./InterviewClient";

export default function InterviewPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading interview…</div>}>
      <InterviewClient />
    </Suspense>
  );
}
