import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/modules/commercial-lifecycle/components/shared/PageHeader";
import { ProportionBar } from "@/modules/commercial-lifecycle/components/shared/ProportionBar";
import { BarRow } from "@/modules/commercial-lifecycle/components/shared/BarRow";
import { RFQ_STATUS_LABELS, RFQ_STATUS_TONE } from "@/modules/commercial-lifecycle/components/rfq/RfqStatusBadge";
import { STATUS_TONE_COLOR } from "@/components/ui/StatusBadge";
import { computeModuleOverview, computeRfqProfitSummary } from "@/modules/commercial-lifecycle/fixtures/analysis";
import { getRfqList } from "@/modules/commercial-lifecycle/fixtures/rfq";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { RfqStatus } from "@/modules/commercial-lifecycle/types/rfq";

export const metadata: Metadata = {
  title: "Commercial Lifecycle · SAV ERP",
  description: "RFQ through to Purchase Order — the Commercial Lifecycle module overview.",
};

const STAGE_LINKS = [
  { href: "/commercial/rfq", label: "RFQ", description: "Requests for Quotation received from clients." },
  { href: "/commercial/estimation", label: "Estimation", description: "Item-level cost build-up per RFQ." },
  { href: "/commercial/market-price", label: "Market Price Analysis", description: "Multi-source reference pricing." },
  { href: "/commercial/actual-vs-quoted", label: "Actual vs Quoted", description: "Rate and value variance per item." },
  { href: "/commercial/profit-analysis", label: "Profit Analysis", description: "Revenue, cost and margin per RFQ." },
  { href: "/commercial/quotations", label: "Quotations", description: "Versioned quotations issued to clients." },
  { href: "/commercial/negotiations", label: "Negotiations", description: "Offer and counter-offer history." },
  { href: "/commercial/boq", label: "BOQ", description: "Bill of Quantities, Tentative and Final." },
  { href: "/commercial/po", label: "Purchase Orders", description: "POs raised against Final BOQs." },
] as const;

export default async function CommercialOverviewPage() {
  const [overview, rfqs] = await Promise.all([computeModuleOverview(), getRfqList()]);

  const statusCounts = rfqs.reduce(
    (counts, rfq) => {
      counts[rfq.status] = (counts[rfq.status] ?? 0) + 1;
      return counts;
    },
    {} as Partial<Record<RfqStatus, number>>,
  );
  const statusSegments = (Object.keys(RFQ_STATUS_LABELS) as RfqStatus[])
    .filter((status) => (statusCounts[status] ?? 0) > 0)
    .map((status) => ({
      key: status,
      label: RFQ_STATUS_LABELS[status],
      value: statusCounts[status] ?? 0,
      color: STATUS_TONE_COLOR[RFQ_STATUS_TONE[status]],
    }));

  const rfqValues = (
    await Promise.all(
      rfqs.map(async (rfq) => ({ rfq, summary: await computeRfqProfitSummary(rfq.id) })),
    )
  )
    .filter(({ summary }) => summary.totalQuotedValue > 0)
    .sort((a, b) => b.summary.totalQuotedValue - a.summary.totalQuotedValue)
    .slice(0, 5);
  const maxRfqValue = Math.max(...rfqValues.map(({ summary }) => summary.totalQuotedValue), 1);

  const maxCostQuote = Math.max(overview.totalEstimatedCost, overview.totalQuotedValue, 1);

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <PageHeader
        title="Commercial Lifecycle"
        description="RFQ → Estimation → Market Price → Actual vs Quoted → Profit → Quotation → Negotiation → BOQ → PO"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total RFQs" value={overview.totalRfqs} variant="neutral" />
        <MetricCard
          label="Quoted Value"
          value={overview.totalQuotedValue || null}
          variant="analytics"
          valueFormatter={formatCurrency}
        />
        <MetricCard
          label="Profit"
          value={overview.totalQuotedValue ? overview.totalProfit : null}
          variant="financial"
          valueFormatter={formatCurrency}
        />
        <MetricCard
          label="Win Rate"
          value={overview.winRatePct}
          variant="operational"
          valueFormatter={(v) => formatPercent(v)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel className="bg-surface p-5">
          <h2 className="text-sm font-semibold text-text-primary">RFQs by Status</h2>
          <p className="mt-0.5 text-xs text-text-secondary">Where {overview.totalRfqs} RFQs currently sit in the lifecycle.</p>
          <div className="mt-4">
            <ProportionBar segments={statusSegments} />
          </div>
        </Panel>

        <Panel className="bg-surface p-5">
          <h2 className="text-sm font-semibold text-text-primary">Estimated vs Quoted</h2>
          <p className="mt-0.5 text-xs text-text-secondary">Total cost basis vs. total value quoted to clients.</p>
          <div className="mt-5 space-y-3">
            <BarRow
              label="Estimated Cost"
              value={overview.totalEstimatedCost}
              max={maxCostQuote}
              valueLabel={formatCurrency(overview.totalEstimatedCost)}
              color="var(--kpi-operational)"
            />
            <BarRow
              label="Quoted Value"
              value={overview.totalQuotedValue}
              max={maxCostQuote}
              valueLabel={formatCurrency(overview.totalQuotedValue)}
              color="var(--secondary)"
            />
          </div>
        </Panel>
      </div>

      {rfqValues.length > 0 && (
        <Panel className="bg-surface p-5">
          <h2 className="text-sm font-semibold text-text-primary">Top RFQs by Quoted Value</h2>
          <p className="mt-0.5 text-xs text-text-secondary">The highest-value quoted RFQs across the pipeline.</p>
          <div className="mt-5 space-y-3">
            {rfqValues.map(({ rfq, summary }) => (
              <Link key={rfq.id} href={`/commercial/rfq/${rfq.id}/profit`} className="block">
                <BarRow
                  label={rfq.rfqNumber}
                  value={summary.totalQuotedValue}
                  max={maxRfqValue}
                  valueLabel={formatCurrency(summary.totalQuotedValue)}
                  color="var(--primary)"
                  labelClassName="w-32 shrink-0 truncate text-xs text-secondary hover:underline"
                />
              </Link>
            ))}
          </div>
        </Panel>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Commercial Stages</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {STAGE_LINKS.map((stage) => (
            <Link key={stage.href} href={stage.href}>
              <Panel className="bg-surface p-4 transition hover:border-secondary">
                <p className="text-sm font-medium text-text-primary">{stage.label}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{stage.description}</p>
              </Panel>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
