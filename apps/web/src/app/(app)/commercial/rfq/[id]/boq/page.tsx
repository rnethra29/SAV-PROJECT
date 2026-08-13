import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { LayersIcon, PlusIcon } from "@/components/ui/icons";
import { getBoqVersions, getBoqItemTree, getBoqItems } from "@/lib/fixtures/boq";
import { getPurchaseOrdersByBoqId } from "@/lib/fixtures/po";
import { BoqItemTable } from "@/components/commercial/boq/BoqItemTable";

export const metadata: Metadata = { title: "BOQ · SAV ERP" };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
};

export default async function RfqBoqPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { v } = await searchParams;
  const versions = await getBoqVersions(id);

  if (versions.length === 0) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<LayersIcon className="h-8 w-8" />}
          title="No BOQ yet"
          description="A BOQ is produced once the commercial position is settled through negotiation."
          action={
            <Link href={`/commercial/rfq/${id}/boq/new`}>
              <Button>
                <PlusIcon className="h-4 w-4" />
                Create BOQ
              </Button>
            </Link>
          }
        />
      </Panel>
    );
  }

  const requestedVersion = v ? Number(v) : null;
  const activeBoq = versions.find((boq) => boq.versionNo === requestedVersion) ?? versions[versions.length - 1];
  const activeIndex = versions.findIndex((boq) => boq.id === activeBoq.id);
  const previousBoq = activeIndex > 0 ? versions[activeIndex - 1] : null;

  const [tree, previousItems] = await Promise.all([
    getBoqItemTree(activeBoq.id),
    previousBoq ? getBoqItems(previousBoq.id) : Promise.resolve(null),
  ]);

  const totalAmount = sumTree(tree);
  const previousRatesBySourceId = previousItems
    ? new Map(
        previousItems
          .filter((item) => item.sourceRfqItemId)
          .map((item) => [item.sourceRfqItemId as string, item.unitRate]),
      )
    : undefined;

  const isLatest = versions[versions.length - 1]?.id === activeBoq.id;
  const purchaseOrders = isLatest ? await getPurchaseOrdersByBoqId(activeBoq.id) : [];

  return (
    <BoqItemTable
      rfqId={id}
      versions={versions}
      activeBoq={activeBoq}
      isLatest={isLatest}
      poCount={purchaseOrders.length}
      tree={tree}
      totalAmount={totalAmount}
      previousRatesBySourceId={previousRatesBySourceId}
    />
  );
}

function sumTree(nodes: Awaited<ReturnType<typeof getBoqItemTree>>): number {
  return nodes.reduce((total, node) => total + node.amount + sumTree(node.children), 0);
}
