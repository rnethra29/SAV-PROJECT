import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRfqById } from "@/lib/fixtures/rfq";
import { RfqStatusBadge } from "@/components/commercial/rfq/RfqStatusBadge";
import { RfqWorkspaceTabs } from "@/components/commercial/rfq/RfqWorkspaceTabs";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";

type RfqWorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export default async function RfqWorkspaceLayout({ children, params }: RfqWorkspaceLayoutProps) {
  const { id } = await params;
  const rfq = await getRfqById(id);

  if (!rfq) {
    notFound();
  }

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
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-text-primary lg:text-2xl">
              {rfq.rfqNumber}
            </h1>
            <RfqStatusBadge status={rfq.status} />
          </div>
          <p className="text-sm text-text-secondary">RFQ Date: {formatDate(rfq.rfqDate)}</p>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {rfq.clientName} · {rfq.projectName}
        </p>
      </div>

      <RfqWorkspaceTabs rfqId={rfq.id} />

      <div>{children}</div>
    </div>
  );
}
