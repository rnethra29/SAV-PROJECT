import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { InboxIcon } from "@/components/ui/icons";
import { PoStatusBadge } from "@/components/commercial/shared/StatusBadges";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PurchaseOrder } from "@/types/commercial/po";

type PoListTableProps = {
  purchaseOrders: PurchaseOrder[];
  emptyDescription?: string;
  // Resolves rfqId -> rfqNumber for a "Source RFQ" column with a link back
  // into the BOQ that the PO was raised against — omitted when the table is
  // already scoped to a single RFQ (its workspace's own PO tab), where
  // repeating the RFQ we're already inside would be redundant.
  rfqNumbersById?: Map<string, string>;
};

export function PoListTable({
  purchaseOrders,
  emptyDescription = "Purchase orders raised against a Final BOQ will appear here.",
  rfqNumbersById,
}: PoListTableProps) {
  if (purchaseOrders.length === 0) {
    return (
      <Panel className="bg-surface">
        <EmptyState icon={<InboxIcon className="h-8 w-8" />} title="No purchase orders yet" description={emptyDescription} />
      </Panel>
    );
  }

  return (
    <Panel className="bg-surface overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-secondary">
          <tr>
            <th className="px-4 py-3 font-medium">PO Number</th>
            <th className="px-4 py-3 font-medium">Vendor</th>
            {rfqNumbersById && <th className="px-4 py-3 font-medium">Source RFQ / BOQ</th>}
            <th className="px-4 py-3 font-medium">PO Date</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {purchaseOrders.map((po) => {
            const rfqNumber = po.rfqId ? rfqNumbersById?.get(po.rfqId) : undefined;
            return (
              <tr key={po.id} className="border-b border-border transition-colors last:border-0 hover:bg-background/60">
                <td className="px-4 py-2.5 font-medium text-text-primary">
                  <Link href={`/commercial/po/${po.id}`} className="hover:text-secondary hover:underline">
                    {po.poNumber}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-text-primary">{po.vendorName}</td>
                {rfqNumbersById && (
                  <td className="px-4 py-2.5">
                    {po.rfqId && rfqNumber ? (
                      <Link href={`/commercial/rfq/${po.rfqId}/boq`} className="text-secondary hover:underline">
                        {rfqNumber}
                      </Link>
                    ) : (
                      <span className="text-text-secondary">—</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-2.5 whitespace-nowrap text-text-secondary">{formatDate(po.poDate)}</td>
                <td className="px-4 py-2.5 text-right text-text-secondary">{formatCurrency(po.totalAmount)}</td>
                <td className="px-4 py-2.5">
                  <PoStatusBadge status={po.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}
