import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QuotationStatusBadge, BoqStatusBadge, BoqTypeBadge } from "@/components/commercial/shared/StatusBadges";
import { formatDate } from "@/lib/format";
import type { Quotation } from "@/types/commercial/quotation";
import type { Boq } from "@/types/commercial/boq";

// com_rfq itself carries no version_no/previous_version_id in the
// architecture doc — only com_quotation, com_boq and com_documents are
// versioned (Phase 6). "RFQ revisions" is represented here as the
// consolidated version history of this RFQ's versioned children, rather
// than inventing an RFQ-header version field the schema doesn't have.
// Document versions are shown on the Documents tab already.

type RfqRevisionsPanelProps = {
  quotationVersions: Quotation[];
  boqVersions: Boq[];
};

export function RfqRevisionsPanel({ quotationVersions, boqVersions }: RfqRevisionsPanelProps) {
  return (
    <div className="space-y-6">
      <Panel className="bg-surface">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary">Quotation Versions</h2>
        </div>
        {quotationVersions.length === 0 ? (
          <EmptyState
            icon={<LayersIcon className="h-8 w-8" />}
            title="No quotation versions yet"
            description="Each revised quotation appears here as a new version — nothing is overwritten."
          />
        ) : (
          <ol className="divide-y divide-border">
            {quotationVersions.map((quotation, index) => (
              <li key={quotation.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-xs font-semibold text-text-primary">
                    v{quotation.versionNo}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{quotation.quotationNumber}</p>
                    <p className="text-xs text-text-secondary">{formatDate(quotation.quotationDate)}</p>
                  </div>
                  {index === quotationVersions.length - 1 && <StatusBadge label="Current" tone="secondary" />}
                </div>
                <QuotationStatusBadge status={quotation.status} />
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <Panel className="bg-surface">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary">BOQ Versions</h2>
        </div>
        {boqVersions.length === 0 ? (
          <EmptyState
            icon={<LayersIcon className="h-8 w-8" />}
            title="No BOQ versions yet"
            description="The Tentative and Final BOQ versions for this RFQ will appear here."
          />
        ) : (
          <ol className="divide-y divide-border">
            {boqVersions.map((boq, index) => (
              <li key={boq.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-xs font-semibold text-text-primary">
                    v{boq.versionNo}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{boq.boqNumber}</p>
                    <p className="text-xs text-text-secondary">
                      {formatDate(boq.createdAt)}
                      {boq.revisionReason && ` · ${boq.revisionReason}`}
                    </p>
                  </div>
                  {index === boqVersions.length - 1 && <StatusBadge label="Current" tone="secondary" />}
                </div>
                <div className="flex items-center gap-2">
                  <BoqTypeBadge type={boq.boqType} />
                  <BoqStatusBadge status={boq.status} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
