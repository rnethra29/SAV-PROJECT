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
};

export function PoListTable({
  purchaseOrders,
  emptyDescription = "Purchase orders raised against a Final BOQ will appear here.",
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
            <th className="px-4 py-3 font-medium">PO Date</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {purchaseOrders.map((po) => (
            <tr key={po.id} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 font-medium text-text-primary">
                <Link href={`/commercial/po/${po.id}`} className="hover:text-secondary hover:underline">
                  {po.poNumber}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-text-primary">{po.vendorName}</td>
              <td className="px-4 py-2.5 whitespace-nowrap text-text-secondary">{formatDate(po.poDate)}</td>
              <td className="px-4 py-2.5 text-right text-text-secondary">{formatCurrency(po.totalAmount)}</td>
              <td className="px-4 py-2.5">
                <PoStatusBadge status={po.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
