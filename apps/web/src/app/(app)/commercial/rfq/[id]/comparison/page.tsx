import type { Metadata } from "next";
import { computeRfqAnalysis } from "@/lib/fixtures/analysis";
import { ComparisonTable } from "@/components/commercial/comparison/ComparisonTable";

export const metadata: Metadata = { title: "Actual vs Quoted · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqComparisonPage({ params }: PageProps) {
  const { id } = await params;
  const rows = await computeRfqAnalysis(id);
  return <ComparisonTable rows={rows} />;
}
