import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { VndVendorInvoiceItem } from "@/types/sites/vendor-invoice";

type VendorInvoiceItemsListViewProps = {
  items: VndVendorInvoiceItem[];
};

/** Pure list/table rendering for the invoice's reconciliation lines against PO items (doc §6.14). */
export function VendorInvoiceItemsListView({ items }: VendorInvoiceItemsListViewProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<LayersIcon className="h-8 w-8" />}
        title="No reconciliation lines yet"
        description="Add lines to reconcile this invoice against the purchase order's items."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-secondary">
          <tr>
            <th className="px-5 py-3 font-medium">S.No</th>
            <th className="px-5 py-3 font-medium">Description</th>
            <th className="px-5 py-3 text-right font-medium">Quantity</th>
            <th className="px-5 py-3 text-right font-medium">Rate</th>
            <th className="px-5 py-3 text-right font-medium">Line Amount</th>
          </tr>
        </thead>
        <tbody>
          {items
            .slice()
            .sort((a, b) => a.sequence_no - b.sequence_no)
            .map((item) => (
              <tr key={item.vendor_invoice_item_id} className="border-b border-border last:border-0 hover:bg-background/60">
                <td className="px-5 py-3 text-text-secondary">{item.sequence_no}</td>
                <td className="px-5 py-3 text-text-primary">{item.description}</td>
                <td className="px-5 py-3 text-right text-text-secondary">
                  {formatNumber(Number(item.quantity), 3)} {item.unit ?? ""}
                </td>
                <td className="px-5 py-3 text-right text-text-secondary">{formatCurrency(Number(item.rate))}</td>
                <td className="px-5 py-3 text-right font-medium text-text-primary">{formatCurrency(Number(item.line_amount))}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
