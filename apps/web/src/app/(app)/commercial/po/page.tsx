import type { Metadata } from "next";
import { getPurchaseOrders } from "@/lib/fixtures/po";
import { PoListTable } from "@/components/commercial/po/PoListTable";

export const metadata: Metadata = {
  title: "Purchase Orders · SAV ERP",
  description: "Purchase orders raised against Final BOQs across the Commercial Lifecycle.",
};

export default async function PoOverviewPage() {
  const purchaseOrders = await getPurchaseOrders();

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">
          Purchase Orders
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          POs raised against Final BOQs, traceable back to the settled commercial position.
        </p>
      </div>

      <PoListTable purchaseOrders={purchaseOrders} />
    </div>
  );
}
