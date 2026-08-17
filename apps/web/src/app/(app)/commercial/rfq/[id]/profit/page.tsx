import type { Metadata } from "next";
import { computeRfqAnalysis, computeRfqProfitSummary } from "@/modules/commercial-lifecycle/fixtures/analysis";
import { ProfitAnalysisPanel } from "@/modules/commercial-lifecycle/components/profit/ProfitAnalysisPanel";

export const metadata: Metadata = { title: "Profit Analysis · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqProfitPage({ params }: PageProps) {
  const { id } = await params;
  const [rows, summary] = await Promise.all([computeRfqAnalysis(id), computeRfqProfitSummary(id)]);
  return <ProfitAnalysisPanel rows={rows} summary={summary} />;
}
