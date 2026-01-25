import { Suspense } from "react";
import ReportClient from "./ReportClient";

export default function ReportPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading report…</div>}>
      <ReportClient />
    </Suspense>
  );
}
