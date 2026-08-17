import type { Metadata } from "next";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/modules/commercial-lifecycle/components/shared/PageHeader";
import { getPurchaseOrders } from "@/modules/commercial-lifecycle/fixtures/po";
import { getRfqList } from "@/modules/commercial-lifecycle/fixtures/rfq";
import { PoListTable } from "@/modules/commercial-lifecycle/components/po/PoListTable";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = {
  title: "Purchase Orders · SAV ERP",
  description: "Purchase orders raised against Final BOQs across the Commercial Lifecycle.",
};

export default async function PoOverviewPage() {
  const [purchaseOrders, rfqs] = await Promise.all([getPurchaseOrders(), getRfqList()]);
  const rfqNumbersById = new Map(rfqs.map((rfq) => [rfq.id, rfq.rfqNumber]));
  const totalValue = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount ?? 0), 0);

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <PageHeader
        title="Purchase Orders"
        description="POs raised against Final BOQs, traceable back to the settled commercial position."
      />

      {purchaseOrders.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCard label="Purchase Orders" value={purchaseOrders.length} variant="neutral" />
          <MetricCard label="Total PO Value" value={totalValue} variant="financial" valueFormatter={formatCurrency} />
        </div>
      )}

      <PoListTable purchaseOrders={purchaseOrders} rfqNumbersById={rfqNumbersById} />
    </div>
  );
}
