import { Panel } from "@/components/ui/Panel";
import { formatDate, formatDateTime, formatFileSize, formatNumber } from "@/lib/format";
import { RFQ_STATUS_LABELS } from "@/components/commercial/rfq/RfqStatusBadge";
import { userNames } from "@/lib/fixtures/audit";
import { isHeaderRfqItem } from "@/lib/fixtures/rfq";
import type { Rfq } from "@/types/commercial/rfq";
import type { RfqItemNode } from "@/lib/fixtures/rfq";
import type { CommercialDocument } from "@/types/commercial/shared";
import type { Approval } from "@/types/commercial/shared";

function ItemRow({ node, depth }: { node: RfqItemNode; depth: number }) {
  const isHeader = isHeaderRfqItem(node);
  return (
    <>
      <tr className={`border-b border-border ${isHeader ? "bg-background/60" : ""}`}>
        <td
          className={`py-2 pr-3 align-top ${isHeader ? "font-semibold" : "font-medium"} text-text-primary`}
          style={{ paddingLeft: `${depth * 1.25}rem` }}
        >
          {node.itemCode}
        </td>
        <td className={`py-2 pr-3 align-top ${isHeader ? "font-semibold" : ""} text-text-primary`}>
          {node.description}
        </td>
        <td className="py-2 pr-3 align-top text-text-secondary">{isHeader ? "—" : node.unit}</td>
        <td className="py-2 pr-3 text-right align-top text-text-secondary">
          {isHeader ? "—" : formatNumber(node.quantity, 3)}
        </td>
        <td className="py-2 align-top text-text-secondary">{node.remarks || "—"}</td>
      </tr>
      {node.children.map((child) => (
        <ItemRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

type RfqDocumentPreviewProps = {
  rfq: Rfq;
  siteName: string | null;
  tree: RfqItemNode[];
  documents: CommercialDocument[];
  approvals: Approval[];
};

// Formal, print-ready RFQ document layout — an internal record of what was
// received/entered and its current review state, not a client-facing
// commercial offer (that's the Quotation document). Fields shown are limited
// to what com_rfq / com_rfq_items / com_documents / com_approvals actually
// carry — no "specification" column (com_rfq_items has no field distinct
// from `description`) and no client-facing pricing (RFQ carries none).
export function RfqDocumentPreview({ rfq, siteName, tree, documents, approvals }: RfqDocumentPreviewProps) {
  return (
    <Panel className="print-document bg-surface p-6 print:border-0 print:p-0 print:shadow-none lg:p-10">
      <div className="border-b-2 border-text-primary pb-4 text-center">
        <p className="text-lg font-semibold tracking-wide text-text-primary">SAV Wind Foundations</p>
        <p className="mt-1 text-sm font-medium uppercase tracking-widest text-text-secondary">
          Request for Quotation — Internal Record
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 border-b border-border py-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Client</p>
          <p className="text-sm text-text-primary">{rfq.clientName}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Project</p>
          <p className="text-sm text-text-primary">{rfq.projectName}</p>
          {siteName && (
            <>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Site</p>
              <p className="text-sm text-text-primary">{siteName}</p>
            </>
          )}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">RFQ Number</p>
          <p className="text-sm text-text-primary">{rfq.rfqNumber}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">RFQ Date</p>
          <p className="text-sm text-text-primary">{formatDate(rfq.rfqDate)}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Status</p>
          <p className="text-sm text-text-primary">{RFQ_STATUS_LABELS[rfq.status]}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-b border-border py-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Scope of Work</p>
          <p className="mt-1 text-sm text-text-primary">{rfq.scopeOfWork || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Execution Timeline</p>
          <p className="mt-1 text-sm text-text-primary">{rfq.executionTimeline || "—"}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Payment Terms</p>
          <p className="mt-1 text-sm text-text-primary">{rfq.paymentTerms || "—"}</p>
        </div>
      </div>

      <div className="overflow-x-auto py-4">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-text-primary text-text-secondary">
              <th className="py-2 pr-3 font-medium">S.No</th>
              <th className="py-2 pr-3 font-medium">Description</th>
              <th className="py-2 pr-3 font-medium">Unit</th>
              <th className="py-2 pr-3 text-right font-medium">Quantity</th>
              <th className="py-2 font-medium">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {tree.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-text-secondary">
                  No items entered yet.
                </td>
              </tr>
            ) : (
              tree.map((node) => <ItemRow key={node.id} node={node} depth={0} />)
            )}
          </tbody>
        </table>
      </div>

      {rfq.remarks && (
        <p className="border-t border-border py-3 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Remarks: </span>
          {rfq.remarks}
        </p>
      )}

      <div className="border-t border-border py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Attached Documents</p>
        {documents.length === 0 ? (
          <p className="mt-1 text-sm text-text-secondary">No documents attached.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <span className="text-text-primary">
                  {doc.fileName} <span className="text-text-secondary">· v{doc.versionNo}</span>
                </span>
                <span className="text-text-secondary">
                  {formatFileSize(doc.fileSizeBytes)} · {formatDate(doc.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Approval</p>
        {approvals.length === 0 ? (
          <p className="mt-1 text-sm text-text-secondary">No approval recorded yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {approvals.map((approval) => (
              <li key={approval.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <span className="text-text-primary">
                  {approval.approvalStage}
                  <span className="text-text-secondary"> · {userNames[approval.approverId] ?? approval.approverId}</span>
                </span>
                <span className="text-text-secondary">
                  {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                  {approval.approvedAt && ` · ${formatDateTime(approval.approvedAt)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
