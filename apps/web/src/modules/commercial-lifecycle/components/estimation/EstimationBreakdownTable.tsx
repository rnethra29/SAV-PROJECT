import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { RfqItem } from "@/modules/commercial-lifecycle/types/rfq";
import type { EstimationItem } from "@/modules/commercial-lifecycle/types/estimation";

type Row = {
  rfqItem: RfqItem;
  estimationItem: EstimationItem | null;
};

type EstimationBreakdownTableProps = {
  rows: Row[];
};

const COST_COLUMNS: { key: keyof EstimationItem; label: string }[] = [
  { key: "materialCost", label: "Material" },
  { key: "labourCost", label: "Labour" },
  { key: "equipmentCost", label: "Equipment" },
  { key: "subcontractCost", label: "Subcontract" },
  { key: "transportationCost", label: "Transport" },
  { key: "otherDirectCost", label: "Other" },
  { key: "overheadCost", label: "Overhead" },
  { key: "contingencyCost", label: "Contingency" },
];

export function EstimationBreakdownTable({ rows }: EstimationBreakdownTableProps) {
  const pricedRows = rows.filter((row) => row.estimationItem !== null);

  if (pricedRows.length === 0) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<LayersIcon className="h-8 w-8" />}
          title="No cost build-up entered yet"
          description="Item-level material, labour, equipment and overhead costs will appear here once estimation is entered."
        />
      </Panel>
    );
  }

  const totalCost = pricedRows.reduce(
    (sum, { rfqItem, estimationItem }) => sum + estimationItem!.estimatedUnitCost * rfqItem.quantity,
    0,
  );

  return (
    <Panel className="bg-surface overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-secondary">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-medium">S.No</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">Description</th>
            {COST_COLUMNS.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {col.label}
              </th>
            ))}
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Unit Cost</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Qty</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {pricedRows.map(({ rfqItem, estimationItem }) => {
            const item = estimationItem!;
            const total = item.estimatedUnitCost * rfqItem.quantity;
            return (
              <tr key={rfqItem.id} className="border-b border-border transition-colors last:border-0 hover:bg-background/60">
                <td className="whitespace-nowrap px-4 py-2.5 font-medium text-text-primary">{rfqItem.itemCode}</td>
                <td className="max-w-xs px-4 py-2.5 text-text-primary">
                  <span className="line-clamp-2">{rfqItem.description}</span>
                </td>
                {COST_COLUMNS.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-2.5 text-right text-text-secondary">
                    {formatCurrency(item[col.key] as number)}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium text-text-primary">
                  {formatCurrency(item.estimatedUnitCost)}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-text-secondary">
                  {formatNumber(rfqItem.quantity, 3)} {rfqItem.unit}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-text-primary">
                  {formatCurrency(total)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border bg-background">
            <td colSpan={COST_COLUMNS.length + 4} className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
              Estimated Total Cost: {formatCurrency(totalCost)}
            </td>
          </tr>
        </tfoot>
      </table>
    </Panel>
  );
}
