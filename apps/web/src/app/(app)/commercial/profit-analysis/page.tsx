import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getRfqList } from "@/lib/fixtures/rfq";
import { computeModuleOverview, computeRfqProfitSummary } from "@/lib/fixtures/analysis";
import { formatCurrency, formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Profit Analysis · SAV ERP",
  description: "Revenue, cost, profit and margin per RFQ across the Commercial Lifecycle.",
};

export default async function ProfitAnalysisOverviewPage() {
  const [rfqs, overview] = await Promise.all([getRfqList(), computeModuleOverview()]);
  const rows = (
    await Promise.all(
      rfqs.map(async (rfq) => {
        const summary = await computeRfqProfitSummary(rfq.id);
        if (summary.totalQuotedValue === 0) return null;
        return { rfq, summary };
      }),
    )
  ).filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">Profit Analysis</h1>
        <p className="mt-1 text-sm text-text-secondary">Estimated cost vs quoted value, per RFQ.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Total Estimated Cost" value={overview.totalEstimatedCost || null} variant="operational" valueFormatter={formatCurrency} />
        <MetricCard label="Total Quoted Value" value={overview.totalQuotedValue || null} variant="analytics" valueFormatter={formatCurrency} />
        <MetricCard label="Total Profit" value={overview.totalQuotedValue ? overview.totalProfit : null} variant="financial" valueFormatter={formatCurrency} />
      </div>

      {rows.length === 0 ? (
        <Panel className="bg-surface">
          <EmptyState
            icon={<LayersIcon className="h-8 w-8" />}
            title="No profit data yet"
            description="Profit is derived once both estimation and quotation exist for an RFQ."
          />
        </Panel>
      ) : (
        <Panel className="bg-surface overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">RFQ</th>
                <th className="px-5 py-3 font-medium">Client / Project</th>
                <th className="px-5 py-3 text-right font-medium">Estimated Cost</th>
                <th className="px-5 py-3 text-right font-medium">Quoted Value</th>
                <th className="px-5 py-3 text-right font-medium">Profit</th>
                <th className="px-5 py-3 text-right font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ rfq, summary }) => (
                <tr key={rfq.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/commercial/rfq/${rfq.id}/profit`} className="text-secondary hover:underline">
                      {rfq.rfqNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-text-primary">{rfq.clientName}</div>
                    <div className="text-text-secondary">{rfq.projectName}</div>
                  </td>
                  <td className="px-5 py-3 text-right text-text-secondary">
                    {formatCurrency(summary.totalEstimatedCost)}
                  </td>
                  <td className="px-5 py-3 text-right text-text-secondary">
                    {formatCurrency(summary.totalQuotedValue)}
                  </td>
                  <td className={`px-5 py-3 text-right font-medium ${summary.profit >= 0 ? "text-success" : "text-danger"}`}>
                    {formatCurrency(summary.profit)}
                  </td>
                  <td className="px-5 py-3 text-right text-text-secondary">{formatPercent(summary.profitMarginPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
