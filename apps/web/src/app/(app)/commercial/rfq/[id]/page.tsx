import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RfqStatusWorkflow } from "@/components/commercial/rfq/RfqStatusWorkflow";
import { getRfqById, getRfqItems, isHeaderRfqItem } from "@/lib/fixtures/rfq";
import { computeRfqProfitSummary } from "@/lib/fixtures/analysis";
import { getEstimationByRfqId } from "@/lib/fixtures/estimation";
import { getCurrentQuotation } from "@/lib/fixtures/quotation";
import { getCurrentBoq } from "@/lib/fixtures/boq";
import { getPurchaseOrdersByRfqId } from "@/lib/fixtures/po";
import { getAuditLog } from "@/lib/fixtures/audit";
import { formatCurrency, formatPercent } from "@/lib/format";
import { EstimationStatusBadge, QuotationStatusBadge, BoqStatusBadge, PoStatusBadge } from "@/components/commercial/shared/StatusBadges";
import { AuditTrailPanel } from "@/components/commercial/shared/AuditTrailPanel";

export const metadata: Metadata = {
  title: "RFQ Overview · SAV ERP",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

const STAGE_LINKS = [
  { segment: "estimation", label: "Estimation" },
  { segment: "market-price", label: "Market Price Analysis" },
  { segment: "actual-price", label: "Actual Price" },
  { segment: "comparison", label: "Actual vs Quoted" },
  { segment: "profit", label: "Profit Analysis" },
  { segment: "quotation", label: "Quotation" },
  { segment: "negotiation", label: "Negotiation" },
  { segment: "boq", label: "BOQ" },
  { segment: "po", label: "Purchase Orders" },
] as const;

export default async function RfqOverviewPage({ params }: PageProps) {
  const { id } = await params;
  const rfq = await getRfqById(id);
  if (!rfq) notFound();

  const [items, profitSummary, estimation, quotation, boq, purchaseOrders, auditLog] = await Promise.all([
    getRfqItems(id),
    computeRfqProfitSummary(id),
    getEstimationByRfqId(id),
    getCurrentQuotation(id),
    getCurrentBoq(id),
    getPurchaseOrdersByRfqId(id),
    getAuditLog("rfq", id),
  ]);
  const statusHistory = auditLog.filter((entry) => entry.action === "status_change");

  const lineItemCount = items.filter((item) => !isHeaderRfqItem(item)).length;

  const stageStatus: Record<(typeof STAGE_LINKS)[number]["segment"], { text: string; node?: ReactNode }> = {
    estimation: estimation
      ? { text: estimation.estimationNumber, node: <EstimationStatusBadge status={estimation.status} /> }
      : { text: "Not started" },
    "market-price": { text: lineItemCount > 0 ? `${lineItemCount} item(s) priced` : "No items yet" },
    "actual-price": { text: estimation ? "Set from estimation" : "Not started" },
    comparison: { text: quotation ? "Available" : "Awaiting quotation" },
    profit: { text: quotation ? formatCurrency(profitSummary.profit) : "Awaiting quotation" },
    quotation: quotation
      ? { text: `${quotation.quotationNumber} v${quotation.versionNo}`, node: <QuotationStatusBadge status={quotation.status} /> }
      : { text: "Not started" },
    negotiation: { text: quotation ? "In progress / settled" : "Not started" },
    boq: boq
      ? { text: `${boq.boqNumber} v${boq.versionNo}`, node: <BoqStatusBadge status={boq.status} /> }
      : { text: "Not started" },
    po: purchaseOrders.length > 0
      ? { text: `${purchaseOrders.length} PO(s)`, node: <PoStatusBadge status={purchaseOrders[0].status} /> }
      : { text: "Not started" },
  };

  return (
    <div className="space-y-6">
      <Panel className="bg-surface p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Commercial Lifecycle Status
        </p>
        <RfqStatusWorkflow status={rfq.status} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Line Items" value={lineItemCount} variant="neutral" />
        <MetricCard
          label="Estimated Cost"
          value={profitSummary.totalEstimatedCost || null}
          variant="operational"
          valueFormatter={formatCurrency}
        />
        <MetricCard
          label="Quoted Value"
          value={profitSummary.totalQuotedValue || null}
          variant="analytics"
          valueFormatter={formatCurrency}
        />
        <MetricCard
          label="Profit"
          value={profitSummary.totalQuotedValue ? profitSummary.profit : null}
          variant="financial"
          valueFormatter={formatCurrency}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel className="bg-surface p-5 xl:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">RFQ Summary</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Scope of Work</dt>
              <dd className="mt-1 text-sm text-text-primary">{rfq.scopeOfWork ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                Execution Timeline
              </dt>
              <dd className="mt-1 text-sm text-text-primary">{rfq.executionTimeline ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Payment Terms</dt>
              <dd className="mt-1 text-sm text-text-primary">{rfq.paymentTerms ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Remarks</dt>
              <dd className="mt-1 text-sm text-text-primary">{rfq.remarks ?? "—"}</dd>
            </div>
          </dl>
        </Panel>

        <Panel className="bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Profit Snapshot</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-secondary">Estimated Cost</dt>
              <dd className="font-medium text-text-primary">{formatCurrency(profitSummary.totalEstimatedCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Quoted Value</dt>
              <dd className="font-medium text-text-primary">{formatCurrency(profitSummary.totalQuotedValue)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2.5">
              <dt className="text-text-secondary">Profit</dt>
              <dd className="font-semibold text-text-primary">{formatCurrency(profitSummary.profit)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Margin</dt>
              <dd className="font-medium text-text-primary">{formatPercent(profitSummary.profitMarginPct)}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Commercial Stages</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {STAGE_LINKS.map((stage) => {
            const status = stageStatus[stage.segment];
            return (
              <Link key={stage.segment} href={`/commercial/rfq/${id}/${stage.segment}`}>
                <Panel className="flex items-center justify-between bg-surface p-4 transition hover:border-secondary">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{stage.label}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{status.text}</p>
                  </div>
                  {status.node}
                </Panel>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Status History</h2>
        <AuditTrailPanel entries={statusHistory} title="RFQ Status Changes" />
      </div>
    </div>
  );
}
