import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { getRfqList } from "@/lib/fixtures/rfq";
import { computeRfqAnalysis } from "@/lib/fixtures/analysis";
import { formatCurrency, formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Actual vs Quoted · SAV ERP",
  description: "Rate and value variance between actual price and quoted price, per RFQ.",
};

export default async function ActualVsQuotedOverviewPage() {
  const rfqs = await getRfqList();
  const rows = (
    await Promise.all(
      rfqs.map(async (rfq) => {
        const analysis = (await computeRfqAnalysis(rfq.id)).filter(
          (row) => !row.isHeader && row.actualValue !== null && row.quotedValue !== null,
        );
        if (analysis.length === 0) return null;
        const totalActual = analysis.reduce((sum, row) => sum + (row.actualValue ?? 0), 0);
        const totalQuoted = analysis.reduce((sum, row) => sum + (row.quotedValue ?? 0), 0);
        const totalDifference = totalQuoted - totalActual;
        const differencePct = totalActual !== 0 ? (totalDifference / totalActual) * 100 : null;
        return { rfq, itemCount: analysis.length, totalActual, totalQuoted, totalDifference, differencePct };
      }),
    )
  ).filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">Actual vs Quoted</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Variance between actual (internal cost basis) and quoted (client-facing) price, per RFQ.
        </p>
      </div>

      {rows.length === 0 ? (
        <Panel className="bg-surface">
          <EmptyState
            icon={<LayersIcon className="h-8 w-8" />}
            title="Nothing to compare yet"
            description="Comparisons appear here once both actual price and quotation exist for an RFQ's items."
          />
        </Panel>
      ) : (
        <Panel className="bg-surface overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">RFQ</th>
                <th className="px-5 py-3 font-medium">Client / Project</th>
                <th className="px-5 py-3 text-right font-medium">Actual Value</th>
                <th className="px-5 py-3 text-right font-medium">Quoted Value</th>
                <th className="px-5 py-3 text-right font-medium">Difference</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ rfq, totalActual, totalQuoted, totalDifference, differencePct }) => (
                <tr key={rfq.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/commercial/rfq/${rfq.id}/comparison`} className="text-secondary hover:underline">
                      {rfq.rfqNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-text-primary">{rfq.clientName}</div>
                    <div className="text-text-secondary">{rfq.projectName}</div>
                  </td>
                  <td className="px-5 py-3 text-right text-text-secondary">{formatCurrency(totalActual)}</td>
                  <td className="px-5 py-3 text-right text-text-secondary">{formatCurrency(totalQuoted)}</td>
                  <td className={`px-5 py-3 text-right font-medium ${totalDifference >= 0 ? "text-success" : "text-danger"}`}>
                    {formatCurrency(totalDifference)}{" "}
                    <span className="text-xs">({formatPercent(differencePct)})</span>
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
