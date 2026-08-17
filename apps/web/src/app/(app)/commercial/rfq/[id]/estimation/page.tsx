import type { Metadata } from "next";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { getRfqItems, isHeaderRfqItem } from "@/modules/commercial-lifecycle/fixtures/rfq";
import { getEstimationByRfqId, getEstimationItems } from "@/modules/commercial-lifecycle/fixtures/estimation";
import { EstimationStatusBadge } from "@/modules/commercial-lifecycle/components/shared/StatusBadges";
import { EstimationBreakdownTable } from "@/modules/commercial-lifecycle/components/estimation/EstimationBreakdownTable";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Estimation · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqEstimationPage({ params }: PageProps) {
  const { id } = await params;
  const estimation = await getEstimationByRfqId(id);

  if (!estimation) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<LayersIcon className="h-8 w-8" />}
          title="Estimation not started"
          description="No estimation has been created for this RFQ yet."
        />
      </Panel>
    );
  }

  const [rfqItems, estimationItems] = await Promise.all([getRfqItems(id), getEstimationItems(estimation.id)]);
  const nonHeaderItems = rfqItems.filter((item) => !isHeaderRfqItem(item));
  const rows = nonHeaderItems.map((rfqItem) => ({
    rfqItem,
    estimationItem: estimationItems.find((ei) => ei.rfqItemId === rfqItem.id) ?? null,
  }));

  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4">
        <div>
          <p className="text-sm font-medium text-text-primary">{estimation.estimationNumber}</p>
          <p className="text-xs text-text-secondary">
            Prepared by {estimation.preparedByName} · {formatDate(estimation.createdAt)}
          </p>
        </div>
        <EstimationStatusBadge status={estimation.status} />
      </Panel>

      <EstimationBreakdownTable rows={rows} />
    </div>
  );
}
