import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, EyeIcon } from "@/components/ui/icons";
import { PoStatusBadge } from "@/components/commercial/shared/StatusBadges";
import { getPurchaseOrderById, getPoItems } from "@/lib/fixtures/po";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Purchase Order · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function PoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const po = await getPurchaseOrderById(id);
  if (!po) notFound();

  const items = await getPoItems(po.id);

  return (
    <div className="space-y-4 2xl:mx-auto 2xl:max-w-[1600px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
        <Link
          href="/commercial/po"
          className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline underline-offset-2"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Purchase Orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">{po.poNumber}</h1>
          <PoStatusBadge status={po.status} />
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {po.vendorName} · {formatDate(po.poDate)}
        </p>
        </div>
        <Link href={`/commercial/po/${id}/document`}>
          <Button type="button" variant="ghost">
            <EyeIcon className="h-4 w-4" />
            Document Preview
          </Button>
        </Link>
      </div>

      <Panel className="bg-surface p-5">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Payment Terms</dt>
            <dd className="mt-1 text-sm text-text-primary">{po.paymentTerms ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Delivery Timeline</dt>
            <dd className="mt-1 text-sm text-text-primary">{po.deliveryTimeline ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Terms &amp; Conditions</dt>
            <dd className="mt-1 text-sm text-text-primary">{po.termsAndConditions ?? "—"}</dd>
          </div>
        </dl>
        {po.remarks && (
          <p className="mt-4 border-t border-border pt-4 text-sm text-text-secondary">{po.remarks}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
          {po.rfqId && (
            <Link href={`/commercial/rfq/${po.rfqId}`} className="text-secondary hover:underline">
              View Source RFQ
            </Link>
          )}
          {po.rfqId && po.boqId && (
            <Link href={`/commercial/rfq/${po.rfqId}/boq`} className="text-secondary hover:underline">
              View Source BOQ
            </Link>
          )}
        </div>
      </Panel>

      <Panel className="bg-surface overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 text-right font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Rate</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="max-w-md px-4 py-2.5 text-text-primary">
                  <span className="line-clamp-2">{item.description}</span>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{item.unit}</td>
                <td className="px-4 py-2.5 text-right text-text-secondary">{item.quantity}</td>
                <td className="px-4 py-2.5 text-right text-text-secondary">{formatCurrency(item.rate)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-text-primary">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-background">
              <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                Total
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                {formatCurrency(po.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </Panel>
    </div>
  );
}
