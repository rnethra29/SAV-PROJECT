import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRfqById, getRfqItems, isHeaderRfqItem } from "@/lib/fixtures/rfq";
import { getCurrentQuotation } from "@/lib/fixtures/quotation";
import { RfqStatusBadge } from "@/components/commercial/rfq/RfqStatusBadge";
import { RfqStatusActions } from "@/components/commercial/rfq/RfqStatusActions";
import { RfqWorkspaceTabs } from "@/components/commercial/rfq/RfqWorkspaceTabs";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";

type RfqWorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export default async function RfqWorkspaceLayout({ children, params }: RfqWorkspaceLayoutProps) {
  const { id } = await params;
  const [rfq, quotation, items] = await Promise.all([getRfqById(id), getCurrentQuotation(id), getRfqItems(id)]);

  if (!rfq) {
    notFound();
  }

  const hasItems = items.some((item) => !isHeaderRfqItem(item));

  return (
    <div className="space-y-4 2xl:mx-auto 2xl:max-w-[1600px]">
      <div>
        <Link
          href="/commercial/rfq"
          className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline underline-offset-2"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          RFQs
        </Link>

        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">
                {rfq.rfqNumber}
              </h1>
              <RfqStatusBadge status={rfq.status} />
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              {rfq.clientName} · {rfq.projectName}
              <span className="text-text-secondary/70"> · RFQ Date {formatDate(rfq.rfqDate)}</span>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <RfqStatusActions rfq={rfq} hasItems={hasItems} hasQuotation={Boolean(quotation)} />
            {quotation ? (
              <Link
                href={`/commercial/rfq/${rfq.id}/quotation`}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition hover:border-secondary"
              >
                View Quotation
              </Link>
            ) : (
              <button
                type="button"
                disabled
                title="Quotation creation — coming soon"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-text-primary transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create Quotation
              </button>
            )}
          </div>
        </div>
      </div>

      <RfqWorkspaceTabs rfqId={rfq.id} />

      <div>{children}</div>
    </div>
  );
}
