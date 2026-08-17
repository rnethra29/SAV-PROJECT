import type { Metadata } from "next";
import { computeRfqAnalysis } from "@/modules/commercial-lifecycle/fixtures/analysis";
import { ComparisonTable } from "@/modules/commercial-lifecycle/components/comparison/ComparisonTable";

export const metadata: Metadata = { title: "Actual vs Quoted · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqComparisonPage({ params }: PageProps) {
  const { id } = await params;
  const rows = await computeRfqAnalysis(id);
  return <ComparisonTable rows={rows} />;
}
