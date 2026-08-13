import type { Metadata } from "next";
import Link from "next/link";
import { getRfqItemTree } from "@/lib/fixtures/rfq";
import { RfqItemTree } from "@/components/commercial/rfq/RfqItemTree";
import { PencilIcon, EyeIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "RFQ Items · SAV ERP" };

type PageProps = { params: Promise<{ id: string }> };

export default async function RfqItemsPage({ params }: PageProps) {
  const { id } = await params;
  const tree = await getRfqItemTree(id);
  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <Link
          href={`/commercial/rfq/${id}/document`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition hover:border-secondary"
        >
          <EyeIcon className="h-4 w-4" />
          Document Preview
        </Link>
        <Link
          href={`/commercial/rfq/${id}/edit?step=items`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition hover:border-secondary"
        >
          <PencilIcon className="h-4 w-4" />
          Edit Items
        </Link>
      </div>
      <RfqItemTree tree={tree} />
    </div>
  );
}
