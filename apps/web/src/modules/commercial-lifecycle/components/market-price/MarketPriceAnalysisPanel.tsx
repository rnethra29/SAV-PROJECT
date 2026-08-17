import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchIcon } from "@/components/ui/icons";
import { formatCurrency, formatDate } from "@/lib/format";
import type { RfqItem } from "@/modules/commercial-lifecycle/types/rfq";
import type { MarketPriceReference } from "@/modules/commercial-lifecycle/types/market-price";

type ItemGroup = {
  rfqItem: RfqItem;
  estimatedUnitCost: number | null;
  references: MarketPriceReference[];
};

type MarketPriceAnalysisPanelProps = {
  groups: ItemGroup[];
};

export function MarketPriceAnalysisPanel({ groups }: MarketPriceAnalysisPanelProps) {
  const pricedGroups = groups.filter((g) => g.references.length > 0);

  if (pricedGroups.length === 0) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<SearchIcon className="h-8 w-8" />}
          title="No market price references yet"
          description="Reference prices from vendors, internal purchase history and past projects will appear here per item."
        />
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {pricedGroups.map(({ rfqItem, estimatedUnitCost, references }) => (
        <Panel key={rfqItem.id} className="bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">
                {rfqItem.itemCode} — <span className="font-normal">{rfqItem.description}</span>
              </p>
            </div>
            {estimatedUnitCost !== null && (
              <p className="text-xs text-text-secondary">
                Estimated rate: <span className="font-medium text-text-primary">{formatCurrency(estimatedUnitCost)}</span>
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-text-secondary">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Source</th>
                  <th className="px-4 py-2.5 font-medium">Reference</th>
                  <th className="px-4 py-2.5 text-right font-medium">Rate</th>
                  <th className="px-4 py-2.5 font-medium">Unit</th>
                  <th className="px-4 py-2.5 font-medium">Price Date</th>
                </tr>
              </thead>
              <tbody>
                {references.map((ref) => (
                  <tr key={ref.id} className="border-b border-border transition-colors last:border-0 hover:bg-background/60">
                    <td className="px-4 py-2.5 text-text-primary">{ref.sourceTypeName}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{ref.sourceReference ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-text-primary">
                      {formatCurrency(ref.rate)}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">{ref.unit}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{formatDate(ref.priceDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ))}
    </div>
  );
}
