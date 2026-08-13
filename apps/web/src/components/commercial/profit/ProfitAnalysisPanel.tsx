import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { ItemCommercialAnalysis, RfqProfitSummary } from "@/lib/fixtures/analysis";

type ProfitAnalysisPanelProps = {
  rows: ItemCommercialAnalysis[];
  summary: RfqProfitSummary;
};

export function ProfitAnalysisPanel({ rows, summary }: ProfitAnalysisPanelProps) {
  const pricedRows = rows.filter((row) => !row.isHeader && row.quotedValue !== null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Quoted Value" value={summary.totalQuotedValue || null} variant="analytics" valueFormatter={formatCurrency} />
        <MetricCard label="Estimated Cost" value={summary.totalEstimatedCost || null} variant="operational" valueFormatter={formatCurrency} />
        <MetricCard label="Profit" value={summary.totalQuotedValue ? summary.profit : null} variant="financial" valueFormatter={formatCurrency} />
        <MetricCard
          label="Margin"
          value={summary.profitMarginPct}
          variant="neutral"
          valueFormatter={(v) => formatPercent(v)}
        />
      </div>

      {pricedRows.length === 0 ? (
        <Panel className="bg-surface">
          <EmptyState
            icon={<LayersIcon className="h-8 w-8" />}
            title="No profit data yet"
            description="Profit is derived once both estimation and quotation exist for an item."
          />
        </Panel>
      ) : (
        <Panel className="bg-surface overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">S.No</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Estimated Cost</th>
                <th className="px-4 py-3 text-right font-medium">Quoted Value</th>
                <th className="px-4 py-3 text-right font-medium">Profit</th>
                <th className="px-4 py-3 text-right font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {pricedRows.map((row) => (
                <tr key={row.rfqItemId} className="border-b border-border transition-colors last:border-0 hover:bg-background/60">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{row.itemCode}</td>
                  <td className="max-w-xs px-4 py-2.5 text-text-primary">
                    <span className="line-clamp-2">{row.description}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">
                    {formatCurrency(row.estimatedTotalCost)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">{formatCurrency(row.quotedValue)}</td>
                  <td className={`px-4 py-2.5 text-right font-medium ${(row.profit ?? 0) >= 0 ? "text-success" : "text-danger"}`}>
                    {formatCurrency(row.profit)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">{formatPercent(row.profitMarginPct)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-background">
                <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-text-primary">
                  Total
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                  {formatCurrency(summary.totalEstimatedCost)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                  {formatCurrency(summary.totalQuotedValue)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                  {formatCurrency(summary.profit)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                  {formatPercent(summary.profitMarginPct)}
                </td>
              </tr>
            </tfoot>
          </table>
        </Panel>
      )}
    </div>
  );
}
