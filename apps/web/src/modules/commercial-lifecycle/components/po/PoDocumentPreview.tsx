import { Panel } from "@/components/ui/Panel";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { PoStatus } from "@/modules/commercial-lifecycle/types/po";

export type PoPreviewLine = {
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  taxPercentage: number;
  remarks?: string | null;
};

function formatStatusLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}

type PoDocumentPreviewProps = {
  poNumber: string;
  poDate: string;
  vendorName: string;
  projectName: string;
  siteName?: string | null;
  rfqNumber: string;
  boqNumber: string;
  // Only known for a saved PO — the Create PO wizard's Review step previews
  // a not-yet-saved draft, so it has no status of its own yet.
  status?: PoStatus;
  paymentTerms?: string | null;
  deliveryTimeline?: string | null;
  termsAndConditions?: string | null;
  remarks?: string | null;
  lines: PoPreviewLine[];
};

// Formal, print-ready PO document layout — reused by the Create PO wizard's
// Review step and the saved-PO document preview. Kept visually distinct from
// the working list/detail views (optimized for screen scanning, not for
// resembling the physical document).
export function PoDocumentPreview({
  poNumber,
  poDate,
  vendorName,
  projectName,
  siteName,
  rfqNumber,
  boqNumber,
  status,
  paymentTerms,
  deliveryTimeline,
  termsAndConditions,
  remarks,
  lines,
}: PoDocumentPreviewProps) {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.rate, 0);
  const tax = lines.reduce((sum, line) => sum + line.quantity * line.rate * (line.taxPercentage / 100), 0);
  const total = subtotal + tax;
  const showRemarksColumn = lines.some((line) => line.remarks);

  return (
    <Panel className="print-document bg-surface p-6 print:border-0 print:p-0 print:shadow-none lg:p-10">
      <div className="border-b-2 border-text-primary pb-4 text-center">
        <p className="text-lg font-semibold tracking-wide text-text-primary">SAV Wind Foundations</p>
        <p className="mt-1 text-sm font-medium uppercase tracking-widest text-text-secondary">Purchase Order</p>
      </div>

      <div className="grid grid-cols-1 gap-4 border-b border-border py-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Vendor</p>
          <p className="text-sm text-text-primary">{vendorName}</p>
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
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">PO Number</p>
          <p className="text-sm text-text-primary">{poNumber}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Date</p>
          <p className="text-sm text-text-primary">{formatDate(poDate)}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Source RFQ / BOQ</p>
          <p className="text-sm text-text-primary">
            {rfqNumber} <span className="text-text-secondary">/ {boqNumber}</span>
          </p>
          {status && (
            <>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Status</p>
              <p className="text-sm text-text-primary">{formatStatusLabel(status)}</p>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto py-4">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-text-primary text-text-secondary">
              <th className="py-2 pr-3 font-medium">S.No</th>
              <th className="py-2 pr-3 font-medium">Description</th>
              <th className="py-2 pr-3 font-medium">Unit</th>
              <th className="py-2 pr-3 text-right font-medium">Qty</th>
              <th className="py-2 pr-3 text-right font-medium">Rate</th>
              <th className="py-2 pr-3 text-right font-medium">Tax %</th>
              <th className="py-2 pr-3 text-right font-medium">Amount</th>
              {showRemarksColumn && <th className="py-2 font-medium">Remarks</th>}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={`${line.description}-${index}`} className="border-b border-border">
                <td className="py-2 pr-3 align-top font-medium text-text-primary">{index + 1}</td>
                <td className="py-2 pr-3 align-top text-text-primary">{line.description}</td>
                <td className="py-2 pr-3 align-top text-text-secondary">{line.unit}</td>
                <td className="py-2 pr-3 text-right align-top text-text-secondary">{formatNumber(line.quantity, 3)}</td>
                <td className="py-2 pr-3 text-right align-top text-text-secondary">{formatCurrency(line.rate)}</td>
                <td className="py-2 pr-3 text-right align-top text-text-secondary">{formatNumber(line.taxPercentage, 2)}</td>
                <td className="py-2 pr-3 text-right align-top font-medium text-text-primary">
                  {formatCurrency(line.quantity * line.rate * (1 + line.taxPercentage / 100))}
                </td>
                {showRemarksColumn && (
                  <td className="py-2 align-top text-text-secondary">{line.remarks || "—"}</td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <td colSpan={6} className="py-2 pr-3 text-right text-sm text-text-secondary">
                Subtotal
              </td>
              <td className="py-2 text-right text-sm text-text-secondary">{formatCurrency(subtotal)}</td>
              {showRemarksColumn && <td />}
            </tr>
            <tr>
              <td colSpan={6} className="py-2 pr-3 text-right text-sm text-text-secondary">
                Tax
              </td>
              <td className="py-2 text-right text-sm text-text-secondary">{formatCurrency(tax)}</td>
              {showRemarksColumn && <td />}
            </tr>
            <tr className="border-t-2 border-text-primary">
              <td colSpan={6} className="py-2.5 pr-3 text-right text-sm font-semibold text-text-primary">
                Total
              </td>
              <td className="py-2.5 text-right text-sm font-semibold text-text-primary">{formatCurrency(total)}</td>
              {showRemarksColumn && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-border py-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Payment Terms</p>
          <p className="text-sm text-text-primary">{paymentTerms || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Delivery Timeline</p>
          <p className="text-sm text-text-primary">{deliveryTimeline || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Terms &amp; Conditions</p>
          <p className="text-sm text-text-primary">{termsAndConditions || "—"}</p>
        </div>
      </div>

      {remarks && (
        <p className="border-t border-border pt-3 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Remarks: </span>
          {remarks}
        </p>
      )}

      <div className="mt-10 grid grid-cols-1 gap-8 border-t border-border pt-6 text-sm sm:grid-cols-3">
        {["Prepared By", "Approved By", "Vendor Acknowledgement"].map((role) => (
          <div key={role}>
            <div className="h-10 border-b border-border" />
            <p className="mt-1.5 text-xs text-text-secondary">{role}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
