import { Panel } from "@/components/ui/Panel";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { BoqStatus, BoqType } from "@/types/commercial/boq";

export type BoqPreviewLine = {
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  isHeader: boolean;
  // Tree depth for hierarchical S.No indentation (0 = root). Optional —
  // defaults to 0 for the Create/Revise BOQ wizard's draft lines, which
  // aren't assigned parent/child relationships until saved.
  depth?: number;
  remarks?: string | null;
};

function formatStatusLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}

type BoqDocumentPreviewProps = {
  boqNumber: string;
  versionNo: number;
  boqType: BoqType;
  // Only known for a saved BOQ — the Create/Revise wizard's Review step
  // previews a not-yet-saved draft, so it has no status of its own yet.
  status?: BoqStatus;
  title: string;
  date: string;
  clientName: string;
  projectName: string;
  siteName?: string | null;
  rfqNumber: string;
  revisionReason?: string | null;
  remarks?: string | null;
  lines: BoqPreviewLine[];
};

// Formal, print-ready BOQ document layout — reused by the Create/Revise BOQ
// wizard's Review step and by the "Preview" action on a saved BOQ. Kept
// visually distinct from the working BoqItemTable (which is optimized for
// screen editing/analysis, not for resembling the physical document).
export function BoqDocumentPreview({
  boqNumber,
  versionNo,
  boqType,
  status,
  title,
  date,
  clientName,
  projectName,
  siteName,
  rfqNumber,
  revisionReason,
  remarks,
  lines,
}: BoqDocumentPreviewProps) {
  const total = lines.reduce((sum, line) => sum + (line.isHeader ? 0 : line.quantity * line.unitRate), 0);
  const showRemarksColumn = lines.some((line) => line.remarks);

  return (
    <Panel className="print-document bg-surface p-6 print:border-0 print:p-0 print:shadow-none lg:p-10">
      <div className="border-b-2 border-text-primary pb-4 text-center">
        <p className="text-lg font-semibold tracking-wide text-text-primary">SAV Wind Foundations</p>
        <p className="mt-1 text-sm font-medium uppercase tracking-widest text-text-secondary">
          Bill of Quantities {boqType === "final" ? "— Final" : "— Tentative"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 border-b border-border py-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Client</p>
          <p className="text-sm text-text-primary">{clientName}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Project</p>
          <p className="text-sm text-text-primary">{projectName}</p>
          {siteName && (
            <>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Site</p>
              <p className="text-sm text-text-primary">{siteName}</p>
            </>
          )}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">BOQ Number</p>
          <p className="text-sm text-text-primary">
            {boqNumber} <span className="text-text-secondary">· v{versionNo}</span>
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Date</p>
          <p className="text-sm text-text-primary">{formatDate(date)}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Source RFQ</p>
          <p className="text-sm text-text-primary">{rfqNumber}</p>
          {status && (
            <>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Status</p>
              <p className="text-sm text-text-primary">{formatStatusLabel(status)}</p>
            </>
          )}
        </div>
      </div>

      {title && (
        <p className="border-b border-border py-3 text-sm font-medium text-text-primary">{title}</p>
      )}
      {revisionReason && (
        <p className="border-b border-border py-3 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Revision reason: </span>
          {revisionReason}
        </p>
      )}

      <div className="overflow-x-auto py-4">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-text-primary text-text-secondary">
              <th className="py-2 pr-3 font-medium">S.No</th>
              <th className="py-2 pr-3 font-medium">Description</th>
              <th className="py-2 pr-3 font-medium">Unit</th>
              <th className="py-2 pr-3 text-right font-medium">Qty</th>
              <th className="py-2 pr-3 text-right font-medium">Rate</th>
              <th className="py-2 pr-3 text-right font-medium">Amount</th>
              {showRemarksColumn && <th className="py-2 font-medium">Remarks</th>}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr
                key={`${line.itemCode}-${index}`}
                className={`border-b border-border ${line.isHeader ? "bg-background/60" : ""}`}
              >
                <td
                  className={`py-2 pr-3 align-top ${line.isHeader ? "font-semibold" : "font-medium"} text-text-primary`}
                  style={{ paddingLeft: `${(line.depth ?? 0) * 1.25}rem` }}
                >
                  {line.itemCode}
                </td>
                <td className={`py-2 pr-3 align-top ${line.isHeader ? "font-semibold" : ""} text-text-primary`}>
                  {line.description}
                </td>
                <td className="py-2 pr-3 align-top text-text-secondary">{line.isHeader ? "—" : line.unit}</td>
                <td className="py-2 pr-3 text-right align-top text-text-secondary">
                  {line.isHeader ? "—" : formatNumber(line.quantity, 3)}
                </td>
                <td className="py-2 pr-3 text-right align-top text-text-secondary">
                  {line.isHeader ? "—" : formatCurrency(line.unitRate)}
                </td>
                <td className="py-2 pr-3 text-right align-top font-medium text-text-primary">
                  {line.isHeader ? "—" : formatCurrency(line.quantity * line.unitRate)}
                </td>
                {showRemarksColumn && (
                  <td className="py-2 align-top text-text-secondary">{line.remarks || "—"}</td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-text-primary">
              <td colSpan={5} className="py-2.5 pr-3 text-right text-sm font-semibold text-text-primary">
                Total
              </td>
              <td className="py-2.5 pr-3 text-right text-sm font-semibold text-text-primary">{formatCurrency(total)}</td>
              {showRemarksColumn && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {remarks && (
        <p className="border-t border-border pt-3 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Remarks: </span>
          {remarks}
        </p>
      )}

      <div className="mt-10 grid grid-cols-1 gap-8 border-t border-border pt-6 text-sm sm:grid-cols-3">
        {["Prepared By", "Reviewed By", "Approved By"].map((role) => (
          <div key={role}>
            <div className="h-10 border-b border-border" />
            <p className="mt-1.5 text-xs text-text-secondary">{role}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
