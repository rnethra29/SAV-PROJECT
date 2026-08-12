import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { computeModuleOverview } from "@/lib/fixtures/analysis";
import { formatCurrency, formatPercent } from "@/lib/format";

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
  const overview = await computeModuleOverview();

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">
          Commercial Lifecycle
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          RFQ → Estimation → Market Price → Actual vs Quoted → Profit → Quotation → Negotiation → BOQ → PO
        </p>
      </div>

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
