import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QuotationStatusBadge } from "@/components/commercial/shared/StatusBadges";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Quotation, QuotationItem } from "@/types/commercial/quotation";

type QuotationVersionPanelProps = {
  rfqId: string;
  versions: Quotation[];
  activeVersion: Quotation;
  items: QuotationItem[];
  previousItems: QuotationItem[] | null;
};

export function QuotationVersionPanel({
  rfqId,
  versions,
  activeVersion,
  items,
  previousItems,
}: QuotationVersionPanelProps) {
  const isLatest = versions[versions.length - 1]?.id === activeVersion.id;

  return (
    <div className="space-y-4">
      {versions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {versions.map((version) => {
            const isActive = version.id === activeVersion.id;
            return (
              <Link
                key={version.id}
                href={`/commercial/rfq/${rfqId}/quotation?v=${version.versionNo}`}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "border-primary bg-primary/10 text-text-primary"
                    : "border-border text-text-secondary hover:border-secondary"
                }`}
              >
                Version {version.versionNo}
              </Link>
            );
          })}
        </div>
      )}

      <Panel className="bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text-primary">
                {activeVersion.quotationNumber} · v{activeVersion.versionNo}
              </p>
              {isLatest && <StatusBadge label="Current" tone="secondary" />}
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Quotation date {formatDate(activeVersion.quotationDate)} · Valid until{" "}
              {formatDate(activeVersion.validityDate)}
            </p>
          </div>
          <QuotationStatusBadge status={activeVersion.status} />
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Payment Terms</dt>
            <dd className="mt-1 text-sm text-text-primary">{activeVersion.paymentTerms ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Execution Period</dt>
            <dd className="mt-1 text-sm text-text-primary">{activeVersion.executionPeriod ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Inclusions</dt>
            <dd className="mt-1 text-sm text-text-primary">{activeVersion.inclusions ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Exclusions</dt>
            <dd className="mt-1 text-sm text-text-primary">{activeVersion.exclusions ?? "—"}</dd>
          </div>
        </dl>
      </Panel>

      <Panel className="bg-surface overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">S.No</th>
              <th className="px-4 py-3 text-right font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 text-right font-medium">Quoted Rate</th>
              {previousItems && <th className="px-4 py-3 text-right font-medium">Δ vs Prior Version</th>}
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const prior = previousItems?.find((p) => p.rfqItemId === item.rfqItemId);
              const delta = prior ? item.quotedRate - prior.quotedRate : null;
              return (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{item.itemCode}</td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{item.unit}</td>
                  <td className="px-4 py-2.5 text-right text-text-primary">{formatCurrency(item.quotedRate)}</td>
                  {previousItems && (
                    <td className={`px-4 py-2.5 text-right ${delta === null ? "text-text-secondary" : delta < 0 ? "text-success" : delta > 0 ? "text-danger" : "text-text-secondary"}`}>
                      {delta === null ? "New" : formatCurrency(delta)}
                    </td>
                  )}
                  <td className="px-4 py-2.5 text-right font-semibold text-text-primary">
                    {formatCurrency(item.quotedAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-background">
              <td colSpan={previousItems ? 6 : 5} className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                Total: {formatCurrency(activeVersion.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </Panel>
    </div>
  );
}
