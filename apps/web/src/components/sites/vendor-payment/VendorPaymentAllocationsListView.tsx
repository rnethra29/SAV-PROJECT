import { EmptyState } from "@/components/ui/EmptyState";
import { InboxIcon } from "@/components/ui/icons";
import { formatCurrency, formatDate } from "@/lib/format";
import type { VndVendorPaymentAllocation } from "@/types/sites/vendor-payment";
import type { VndVendorInvoice } from "@/types/sites/vendor-invoice";

type VendorPaymentAllocationsListViewProps = {
  allocations: VndVendorPaymentAllocation[];
  invoices: VndVendorInvoice[];
};

/** Pure list/table rendering for a payment's allocations against invoices (vnd_vendor_payment_allocation, doc §6.16 — append-only). */
export function VendorPaymentAllocationsListView({ allocations, invoices }: VendorPaymentAllocationsListViewProps) {
  const invoiceNumber = (invoiceId: string) => invoices.find((i) => i.vendor_invoice_id === invoiceId)?.invoice_number ?? "—";

  if (allocations.length === 0) {
    return (
      <EmptyState
        icon={<InboxIcon className="h-8 w-8" />}
        title="No allocations yet"
        description="Allocate this payment against one or more vendor invoices."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-secondary">
          <tr>
            <th className="px-5 py-3 font-medium">Invoice</th>
            <th className="px-5 py-3 font-medium">Allocated Date</th>
            <th className="px-5 py-3 text-right font-medium">Allocated Amount</th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((allocation) => (
            <tr key={allocation.allocation_id} className="border-b border-border last:border-0 hover:bg-background/60">
              <td className="px-5 py-3 font-medium text-text-primary">{invoiceNumber(allocation.vendor_invoice_id)}</td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{formatDate(allocation.allocated_date)}</td>
              <td className="px-5 py-3 text-right font-medium text-text-primary">
                {formatCurrency(Number(allocation.allocated_amount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
