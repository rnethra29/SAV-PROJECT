import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { ItemCommercialAnalysis } from "@/modules/commercial-lifecycle/fixtures/analysis";

function DiffCell({ value, pct }: { value: number | null; pct: number | null }) {
  if (value === null) return <span className="text-text-secondary">—</span>;
  const isPositive = value >= 0;
  return (
    <span className={isPositive ? "text-success" : "text-danger"}>
      {formatCurrency(value)}
      {pct !== null && <span className="ml-1 text-xs">({formatPercent(pct)})</span>}
    </span>
  );
}

type ComparisonTableProps = {
  rows: ItemCommercialAnalysis[];
};

export function ComparisonTable({ rows }: ComparisonTableProps) {
  const pricedRows = rows.filter((row) => !row.isHeader && (row.actualRate !== null || row.quotedRate !== null));

  if (pricedRows.length === 0) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<LayersIcon className="h-8 w-8" />}
          title="Nothing to compare yet"
          description="Actual vs quoted variance appears here once both an actual price and a quotation exist for an item."
        />
      </Panel>
    );
  }

  return (
    <Panel className="bg-surface overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-secondary">
          <tr>
            <th className="px-4 py-3 font-medium">S.No</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 text-right font-medium">Actual Rate</th>
            <th className="px-4 py-3 text-right font-medium">Quoted Rate</th>
            <th className="px-4 py-3 text-right font-medium">Rate Difference</th>
            <th className="px-4 py-3 text-right font-medium">Actual Value</th>
            <th className="px-4 py-3 text-right font-medium">Quoted Value</th>
            <th className="px-4 py-3 text-right font-medium">Value Difference</th>
          </tr>
        </thead>
        <tbody>
          {pricedRows.map((row) => (
            <tr key={row.rfqItemId} className="border-b border-border transition-colors last:border-0 hover:bg-background/60">
              <td className="px-4 py-2.5 font-medium text-text-primary">{row.itemCode}</td>
              <td className="max-w-xs px-4 py-2.5 text-text-primary">
                <span className="line-clamp-2">{row.description}</span>
              </td>
              <td className="px-4 py-2.5 text-right text-text-secondary">{formatCurrency(row.actualRate)}</td>
              <td className="px-4 py-2.5 text-right text-text-secondary">{formatCurrency(row.quotedRate)}</td>
              <td className="px-4 py-2.5 text-right">
                <DiffCell value={row.rateDifference} pct={row.rateDifferencePct} />
              </td>
              <td className="px-4 py-2.5 text-right text-text-secondary">{formatCurrency(row.actualValue)}</td>
              <td className="px-4 py-2.5 text-right text-text-secondary">{formatCurrency(row.quotedValue)}</td>
              <td className="px-4 py-2.5 text-right">
                <DiffCell value={row.valueDifference} pct={null} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
