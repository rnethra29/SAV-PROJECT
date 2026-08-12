import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/commercial/shared/PageHeader";
import { getRfqList } from "@/lib/fixtures/rfq";
import { getCurrentBoq, getBoqItems } from "@/lib/fixtures/boq";
import { getPurchaseOrdersByBoqId } from "@/lib/fixtures/po";
import { BoqStatusBadge, BoqTypeBadge } from "@/components/commercial/shared/StatusBadges";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "BOQ · SAV ERP",
  description: "Bill of Quantities, Tentative and Final, across the Commercial Lifecycle.",
};

export default async function BoqOverviewPage() {
  const rfqs = await getRfqList();
  const rows = (
    await Promise.all(
      rfqs.map(async (rfq) => {
        const boq = await getCurrentBoq(rfq.id);
        if (!boq) return null;
        const [items, purchaseOrders] = await Promise.all([
          getBoqItems(boq.id),
          getPurchaseOrdersByBoqId(boq.id),
        ]);
        const total = items.reduce((sum, item) => sum + item.amount, 0);
        return { rfq, boq, total, poCount: purchaseOrders.length };
      }),
    )
  ).filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <PageHeader
        title="Bill of Quantities"
        description="Current BOQ version per RFQ — Tentative or Final."
        actions={
          <button
            type="button"
            disabled
            title="BOQ creation happens from within the RFQ workspace once negotiation settles"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create BOQ
          </button>
        }
      />

      {rows.length === 0 ? (
        <Panel className="bg-surface">
          <EmptyState icon={<LayersIcon className="h-8 w-8" />} title="No BOQs yet" description="BOQs will appear here once produced from a settled commercial position." />
        </Panel>
      ) : (
        <Panel className="bg-surface overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">BOQ Number</th>
                <th className="px-5 py-3 font-medium">RFQ</th>
                <th className="px-5 py-3 font-medium">Client / Project</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">PO</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ rfq, boq, total, poCount }) => (
                <tr key={boq.id} className="border-b border-border transition-colors last:border-0 hover:bg-background/60">
                  <td className="px-5 py-3 font-medium text-text-primary">
                    {boq.boqNumber} <span className="text-text-secondary">v{boq.versionNo}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/commercial/rfq/${rfq.id}/boq`} className="text-secondary hover:underline">
                      {rfq.rfqNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-text-primary">{rfq.clientName}</div>
                    <div className="text-text-secondary">{rfq.projectName}</div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{formatDate(boq.createdAt)}</td>
                  <td className="px-5 py-3 text-right text-text-primary">{formatCurrency(total)}</td>
                  <td className="px-5 py-3">
                    <BoqTypeBadge type={boq.boqType} />
                  </td>
                  <td className="px-5 py-3">
                    <BoqStatusBadge status={boq.status} />
                  </td>
                  <td className="px-5 py-3">
                    {poCount > 0 ? (
                      <Link href={`/commercial/rfq/${rfq.id}/po`} className="text-secondary hover:underline">
                        {poCount} issued
                      </Link>
                    ) : (
                      <span className="text-text-secondary">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
