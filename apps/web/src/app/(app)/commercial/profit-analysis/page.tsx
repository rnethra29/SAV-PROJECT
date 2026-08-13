import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { BarRow } from "@/components/commercial/shared/BarRow";
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

  const overallMarginPct = overview.totalQuotedValue !== 0 ? (overview.totalProfit / overview.totalQuotedValue) * 100 : null;
  const rankedByProfit = [...rows].sort((a, b) => b.summary.profit - a.summary.profit);
  const maxProfit = Math.max(...rankedByProfit.map((r) => Math.abs(r.summary.profit)), 1);

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <PageHeader title="Profit Analysis" description="Estimated cost vs quoted value, per RFQ." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Estimated Cost" value={overview.totalEstimatedCost || null} variant="operational" valueFormatter={formatCurrency} />
        <MetricCard label="Total Quoted Value" value={overview.totalQuotedValue || null} variant="analytics" valueFormatter={formatCurrency} />
        <MetricCard label="Total Profit" value={overview.totalQuotedValue ? overview.totalProfit : null} variant="financial" valueFormatter={formatCurrency} />
        <MetricCard label="Overall Margin" value={overallMarginPct} variant="neutral" valueFormatter={(v) => formatPercent(v)} />
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
        <>
          <Panel className="bg-surface p-5">
            <h2 className="text-sm font-semibold text-text-primary">Profit by RFQ</h2>
            <p className="mt-0.5 text-xs text-text-secondary">Ranked highest to lowest profit.</p>
            <div className="mt-5 space-y-3">
              {rankedByProfit.map(({ rfq, summary }) => (
                <Link key={rfq.id} href={`/commercial/rfq/${rfq.id}/profit`} className="block">
                  <BarRow
                    label={rfq.rfqNumber}
                    value={Math.abs(summary.profit)}
                    max={maxProfit}
                    valueLabel={formatCurrency(summary.profit)}
                    color={summary.profit >= 0 ? "var(--success)" : "var(--danger)"}
                    labelClassName="w-32 shrink-0 truncate text-xs text-secondary hover:underline"
                  />
                </Link>
              ))}
            </div>
          </Panel>

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
                  <tr key={rfq.id} className="border-b border-border transition-colors last:border-0 hover:bg-background/60">
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
        </>
      )}
    </div>
  );
}
