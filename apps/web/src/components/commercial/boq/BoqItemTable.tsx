import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BoqStatusBadge, BoqTypeBadge } from "@/components/commercial/shared/StatusBadges";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Boq } from "@/types/commercial/boq";
import type { BoqItemNode } from "@/lib/fixtures/boq";

function BoqRow({ node, depth }: { node: BoqItemNode; depth: number }) {
  return (
    <>
      <tr className="border-b border-border last:border-0">
        <td className="px-4 py-2.5" style={{ paddingLeft: `${1 + depth * 1.25}rem` }}>
          <span className="font-medium text-text-primary">{node.itemCode}</span>
        </td>
        <td className="max-w-md px-4 py-2.5 text-text-primary">
          <span className="line-clamp-2">{node.description}</span>
        </td>
        <td className="px-4 py-2.5 text-text-secondary">{node.unit}</td>
        <td className="px-4 py-2.5 text-right text-text-secondary">{formatNumber(node.quantity, 3)}</td>
        <td className="px-4 py-2.5 text-right text-text-secondary">{formatCurrency(node.unitRate)}</td>
        <td className="px-4 py-2.5 text-right font-semibold text-text-primary">{formatCurrency(node.amount)}</td>
      </tr>
      {node.children.map((child) => (
        <BoqRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

type BoqItemTableProps = {
  rfqId: string;
  versions: Boq[];
  activeBoq: Boq;
  tree: BoqItemNode[];
  totalAmount: number;
};

export function BoqItemTable({ rfqId, versions, activeBoq, tree, totalAmount }: BoqItemTableProps) {
  const isLatest = versions[versions.length - 1]?.id === activeBoq.id;

  return (
    <div className="space-y-4">
      {versions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {versions.map((boq) => {
            const isActive = boq.id === activeBoq.id;
            return (
              <Link
                key={boq.id}
                href={`/commercial/rfq/${rfqId}/boq?v=${boq.versionNo}`}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "border-primary bg-primary/10 text-text-primary"
                    : "border-border text-text-secondary hover:border-secondary"
                }`}
              >
                v{boq.versionNo} · {boq.boqType === "final" ? "Final" : "Tentative"}
              </Link>
            );
          })}
        </div>
      )}

      <Panel className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-text-primary">
              {activeBoq.boqNumber} · v{activeBoq.versionNo}
            </p>
            {isLatest && <StatusBadge label="Current" tone="secondary" />}
          </div>
          <p className="mt-1 text-xs text-text-secondary">{activeBoq.boqTitle}</p>
          {activeBoq.revisionReason && (
            <p className="mt-1 text-xs text-text-secondary">Reason: {activeBoq.revisionReason}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <BoqTypeBadge type={activeBoq.boqType} />
          <BoqStatusBadge status={activeBoq.status} />
        </div>
      </Panel>

      {tree.length === 0 ? (
        <Panel className="bg-surface">
          <EmptyState
            icon={<LayersIcon className="h-8 w-8" />}
            title="No BOQ items yet"
            description="BOQ line items, drawn from the settled commercial position, will appear here."
          />
        </Panel>
      ) : (
        <Panel className="bg-surface overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">S.No</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Rate</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {tree.map((node) => (
                <BoqRow key={node.id} node={node} depth={0} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-background">
                <td colSpan={5} className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                  Total
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </Panel>
      )}
    </div>
  );
}
