import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { getRfqList } from "@/lib/fixtures/rfq";
import { getEstimationByRfqId } from "@/lib/fixtures/estimation";
import { computeRfqProfitSummary } from "@/lib/fixtures/analysis";
import { EstimationStatusBadge } from "@/components/commercial/shared/StatusBadges";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Estimation · SAV ERP",
  description: "Item-level cost build-up per RFQ across the Commercial Lifecycle.",
};

export default async function EstimationOverviewPage() {
  const rfqs = await getRfqList();
  const rows = (
    await Promise.all(
      rfqs.map(async (rfq) => {
        const estimation = await getEstimationByRfqId(rfq.id);
        if (!estimation) return null;
        const summary = await computeRfqProfitSummary(rfq.id);
        return { rfq, estimation, totalEstimatedCost: summary.totalEstimatedCost };
      }),
    )
  ).filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">Estimation</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Item-level cost build-ups prepared per RFQ. Open an RFQ to see the full material/labour/equipment
          breakdown.
        </p>
      </div>

      {rows.length === 0 ? (
        <Panel className="bg-surface">
          <EmptyState
            icon={<LayersIcon className="h-8 w-8" />}
            title="No estimations yet"
            description="Estimations will appear here once created against an RFQ."
          />
        </Panel>
      ) : (
        <Panel className="bg-surface overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">Estimation Number</th>
                <th className="px-5 py-3 font-medium">RFQ</th>
                <th className="px-5 py-3 font-medium">Client / Project</th>
                <th className="px-5 py-3 font-medium">Prepared</th>
                <th className="px-5 py-3 text-right font-medium">Estimated Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ rfq, estimation, totalEstimatedCost }) => (
                <tr key={estimation.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-text-primary">{estimation.estimationNumber}</td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/commercial/rfq/${rfq.id}/estimation`}
                      className="text-secondary hover:underline"
                    >
                      {rfq.rfqNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-text-primary">{rfq.clientName}</div>
                    <div className="text-text-secondary">{rfq.projectName}</div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                    {formatDate(estimation.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right text-text-primary">{formatCurrency(totalEstimatedCost)}</td>
                  <td className="px-5 py-3">
                    <EstimationStatusBadge status={estimation.status} />
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
