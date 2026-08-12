import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { formatCurrency, formatDate } from "@/lib/format";
import type { RfqItem } from "@/types/commercial/rfq";
import type { ActualPrice, PriceBasis } from "@/types/commercial/actual-price";

const PRICE_BASIS_LABELS: Record<PriceBasis, string> = {
  current_market: "Current Market",
  vendor_price: "Vendor Price",
  internal_purchase: "Internal Purchase",
  historical_project: "Historical Project",
  approved_estimation_rate: "Approved Estimation Rate",
  other: "Other",
};

type Row = { rfqItem: RfqItem; actualPrice: ActualPrice | null };

type ActualPriceTableProps = { rows: Row[] };

export function ActualPriceTable({ rows }: ActualPriceTableProps) {
  const pricedRows = rows.filter((row) => row.actualPrice !== null);

  if (pricedRows.length === 0) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<LayersIcon className="h-8 w-8" />}
          title="No actual price set yet"
          description="The costing team sets the actual price per item once estimation is approved."
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
            <th className="px-4 py-3 font-medium">Unit</th>
            <th className="px-4 py-3 font-medium">Basis</th>
            <th className="px-4 py-3 font-medium">Price Date</th>
          </tr>
        </thead>
        <tbody>
          {pricedRows.map(({ rfqItem, actualPrice }) => (
            <tr key={rfqItem.id} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 font-medium text-text-primary">{rfqItem.itemCode}</td>
              <td className="max-w-xs px-4 py-2.5 text-text-primary">
                <span className="line-clamp-2">{rfqItem.description}</span>
              </td>
              <td className="px-4 py-2.5 text-right font-semibold text-text-primary">
                {formatCurrency(actualPrice!.actualRate)}
              </td>
              <td className="px-4 py-2.5 text-text-secondary">{actualPrice!.unit}</td>
              <td className="px-4 py-2.5 text-text-secondary">{PRICE_BASIS_LABELS[actualPrice!.priceBasis]}</td>
              <td className="px-4 py-2.5 text-text-secondary">{formatDate(actualPrice!.priceDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
