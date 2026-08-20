import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { VndPurchaseOrderItem } from "@/types/sites/procurement-order";

type ProcurementOrderItemsListViewProps = {
  items: VndPurchaseOrderItem[];
};

/** Pure list/table rendering for a PO's line items (vnd_purchase_order_item, doc §6.12). */
export function ProcurementOrderItemsListView({ items }: ProcurementOrderItemsListViewProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<LayersIcon className="h-8 w-8" />}
        title="No line items yet"
        description="Add the materials or services being procured on this purchase order."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-secondary">
          <tr>
            <th className="px-5 py-3 font-medium">S.No</th>
            <th className="px-5 py-3 font-medium">Item</th>
            <th className="px-5 py-3 text-right font-medium">Quantity</th>
            <th className="px-5 py-3 text-right font-medium">Unit Price</th>
            <th className="px-5 py-3 text-right font-medium">Tax %</th>
            <th className="px-5 py-3 text-right font-medium">Line Amount</th>
            <th className="px-5 py-3 text-right font-medium">Received</th>
          </tr>
        </thead>
        <tbody>
          {items
            .slice()
            .sort((a, b) => a.sequence_no - b.sequence_no)
            .map((item) => (
              <tr key={item.po_item_id} className="border-b border-border last:border-0 hover:bg-background/60">
                <td className="px-5 py-3 text-text-secondary">{item.sequence_no}</td>
                <td className="px-5 py-3">
                  <div className="font-medium text-text-primary">{item.item_name}</div>
                  {item.description && <div className="text-text-secondary">{item.description}</div>}
                </td>
                <td className="px-5 py-3 text-right text-text-secondary">
                  {formatNumber(Number(item.quantity), 3)} {item.unit}
                </td>
                <td className="px-5 py-3 text-right text-text-secondary">{formatCurrency(Number(item.unit_price))}</td>
                <td className="px-5 py-3 text-right text-text-secondary">{Number(item.tax_percentage)}%</td>
                <td className="px-5 py-3 text-right font-medium text-text-primary">{formatCurrency(Number(item.line_amount))}</td>
                <td className="px-5 py-3 text-right text-text-secondary">
                  {formatNumber(Number(item.received_quantity), 3)} / {formatNumber(Number(item.quantity), 3)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
