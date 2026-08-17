"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { LayersIcon, PrinterIcon, PlusIcon, EyeIcon } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BoqStatusBadge, BoqTypeBadge } from "@/modules/commercial-lifecycle/components/shared/StatusBadges";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Boq } from "@/modules/commercial-lifecycle/types/boq";
import type { BoqItemNode } from "@/modules/commercial-lifecycle/fixtures/boq";

function BoqRow({
  node,
  depth,
  previousRatesBySourceId,
}: {
  node: BoqItemNode;
  depth: number;
  previousRatesBySourceId?: Map<string, number>;
}) {
  const previousRate = node.sourceRfqItemId ? previousRatesBySourceId?.get(node.sourceRfqItemId) : undefined;
  const delta = previousRate !== undefined ? node.unitRate - previousRate : null;

  return (
    <>
      <tr className="border-b border-border transition-colors last:border-0 hover:bg-background/60">
        <td className="px-4 py-2.5" style={{ paddingLeft: `${1 + depth * 1.25}rem` }}>
          <span className="font-medium text-text-primary">{node.itemCode}</span>
        </td>
        <td className="max-w-md px-4 py-2.5 text-text-primary">
          <span className="line-clamp-2">{node.description}</span>
        </td>
        <td className="px-4 py-2.5 text-text-secondary">{node.unit}</td>
        <td className="px-4 py-2.5 text-right text-text-secondary">{formatNumber(node.quantity, 3)}</td>
        <td className="px-4 py-2.5 text-right text-text-secondary">{formatCurrency(node.unitRate)}</td>
        {previousRatesBySourceId && (
          <td className={`px-4 py-2.5 text-right ${delta === null ? "text-text-secondary" : delta < 0 ? "text-success" : delta > 0 ? "text-danger" : "text-text-secondary"}`}>
            {delta === null ? "New" : delta === 0 ? "—" : formatCurrency(delta)}
          </td>
        )}
        <td className="px-4 py-2.5 text-right font-semibold text-text-primary">{formatCurrency(node.amount)}</td>
      </tr>
      {node.children.map((child) => (
        <BoqRow key={child.id} node={child} depth={depth + 1} previousRatesBySourceId={previousRatesBySourceId} />
      ))}
    </>
  );
}

type BoqItemTableProps = {
  rfqId: string;
  versions: Boq[];
  activeBoq: Boq;
  isLatest?: boolean;
  poCount?: number;
  tree: BoqItemNode[];
  totalAmount: number;
  previousRatesBySourceId?: Map<string, number>;
};

export function BoqItemTable({
  rfqId,
  versions,
  activeBoq,
  isLatest: isLatestProp,
  poCount = 0,
  tree,
  totalAmount,
  previousRatesBySourceId,
}: BoqItemTableProps) {
  const isLatest = isLatestProp ?? versions[versions.length - 1]?.id === activeBoq.id;
  const columnCount = previousRatesBySourceId ? 7 : 6;

  return (
    <div className="print-document space-y-4">
      {versions.length > 1 && (
        <div className="flex flex-wrap gap-2 print:hidden">
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
        <div className="flex flex-wrap items-center gap-2">
          <BoqTypeBadge type={activeBoq.boqType} />
          <BoqStatusBadge status={activeBoq.status} />
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Link href={`/commercial/rfq/${rfqId}/boq/document?v=${activeBoq.versionNo}`}>
              <Button type="button" variant="ghost">
                <EyeIcon className="h-4 w-4" />
                Document Preview
              </Button>
            </Link>
            <Button type="button" variant="ghost" onClick={() => window.print()}>
              <PrinterIcon className="h-4 w-4" />
              Print
            </Button>
            {isLatest && (
              <Link href={`/commercial/rfq/${rfqId}/boq/new?revise=${activeBoq.id}`}>
                <Button variant="ghost">
                  <PlusIcon className="h-4 w-4" />
                  New Revision
                </Button>
              </Link>
            )}
            {isLatest && activeBoq.boqType === "final" && poCount === 0 && (
              <Link href={`/commercial/rfq/${rfqId}/po/new`}>
                <Button>
                  <PlusIcon className="h-4 w-4" />
                  Create PO
                </Button>
              </Link>
            )}
          </div>
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
                {previousRatesBySourceId && (
                  <th className="px-4 py-3 text-right font-medium">Δ vs Prior Version</th>
                )}
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {tree.map((node) => (
                <BoqRow key={node.id} node={node} depth={0} previousRatesBySourceId={previousRatesBySourceId} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-background">
                <td colSpan={columnCount - 1} className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
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
