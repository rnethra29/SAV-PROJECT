import type { Metadata } from "next";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { getBoqVersions, getBoqItemTree } from "@/lib/fixtures/boq";
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
        />
      </Panel>
    );
  }

  const requestedVersion = v ? Number(v) : null;
  const activeBoq = versions.find((boq) => boq.versionNo === requestedVersion) ?? versions[versions.length - 1];
  const tree = await getBoqItemTree(activeBoq.id);

  const totalAmount = sumTree(tree);

  return (
    <BoqItemTable rfqId={id} versions={versions} activeBoq={activeBoq} tree={tree} totalAmount={totalAmount} />
  );
}

function sumTree(nodes: Awaited<ReturnType<typeof getBoqItemTree>>): number {
  return nodes.reduce((total, node) => total + node.amount + sumTree(node.children), 0);
}
