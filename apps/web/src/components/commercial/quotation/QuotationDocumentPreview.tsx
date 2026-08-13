import { Panel } from "@/components/ui/Panel";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { QUOTATION_LABELS } from "@/components/commercial/shared/StatusBadges";
import type { Quotation, QuotationItem } from "@/types/commercial/quotation";

export type QuotationDocumentLine = QuotationItem & { description: string };

type QuotationDocumentPreviewProps = {
  rfqNumber: string;
  clientName: string;
  projectName: string;
  siteName?: string | null;
  quotation: Quotation;
  lines: QuotationDocumentLine[];
};

// Formal, print-ready Quotation document — the client-facing commercial
// offer. Item descriptions are joined in from the source RFQ item via
// `rfqItemId` (com_quotation_items carries no description of its own, only
// a denormalized itemCode/quantity/unit snapshot per Phase 5 schema) —
// resolved by the caller, not invented here.
export function QuotationDocumentPreview({
  rfqNumber,
  clientName,
  projectName,
  siteName,
  quotation,
  lines,
}: QuotationDocumentPreviewProps) {
  const subtotal = lines.reduce((sum, line) => sum + line.quotedAmount, 0);
  const tax = lines.reduce((sum, line) => sum + (line.quotedAmount * line.taxPercentage) / 100, 0);
  const total = quotation.totalAmount ?? subtotal + tax;

  return (
    <Panel className="print-document bg-surface p-6 print:border-0 print:p-0 print:shadow-none lg:p-10">
      <div className="border-b-2 border-text-primary pb-4 text-center">
        <p className="text-lg font-semibold tracking-wide text-text-primary">SAV Wind Foundations</p>
        <p className="mt-1 text-sm font-medium uppercase tracking-widest text-text-secondary">Quotation</p>
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
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Quotation Number</p>
          <p className="text-sm text-text-primary">
            {quotation.quotationNumber} <span className="text-text-secondary">· v{quotation.versionNo}</span>
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Date</p>
          <p className="text-sm text-text-primary">{formatDate(quotation.quotationDate)}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Valid Until</p>
          <p className="text-sm text-text-primary">{formatDate(quotation.validityDate)}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Source RFQ</p>
          <p className="text-sm text-text-primary">{rfqNumber}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Status</p>
          <p className="text-sm text-text-primary">{QUOTATION_LABELS[quotation.status]}</p>
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
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-border">
                <td className="py-2 pr-3 align-top font-medium text-text-primary">{line.itemCode}</td>
                <td className="py-2 pr-3 align-top text-text-primary">{line.description}</td>
                <td className="py-2 pr-3 align-top text-text-secondary">{line.unit}</td>
                <td className="py-2 pr-3 text-right align-top text-text-secondary">{formatNumber(line.quantity, 3)}</td>
                <td className="py-2 pr-3 text-right align-top text-text-secondary">{formatCurrency(line.quotedRate)}</td>
                <td className="py-2 pr-3 text-right align-top text-text-secondary">{formatNumber(line.taxPercentage, 2)}</td>
                <td className="py-2 text-right align-top font-medium text-text-primary">
                  {formatCurrency(line.quotedAmount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <td colSpan={6} className="py-2 pr-3 text-right text-sm text-text-secondary">
                Subtotal
              </td>
              <td className="py-2 text-right text-sm text-text-secondary">{formatCurrency(subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={6} className="py-2 pr-3 text-right text-sm text-text-secondary">
                Tax
              </td>
              <td className="py-2 text-right text-sm text-text-secondary">{formatCurrency(tax)}</td>
            </tr>
            <tr className="border-t-2 border-text-primary">
              <td colSpan={6} className="py-2.5 pr-3 text-right text-sm font-semibold text-text-primary">
                Grand Total
              </td>
              <td className="py-2.5 text-right text-sm font-semibold text-text-primary">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-border py-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Payment Terms</p>
          <p className="mt-1 text-sm text-text-primary">{quotation.paymentTerms || "—"}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Execution Period</p>
          <p className="mt-1 text-sm text-text-primary">{quotation.executionPeriod || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Inclusions</p>
          <p className="mt-1 text-sm text-text-primary">{quotation.inclusions || "—"}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Exclusions</p>
          <p className="mt-1 text-sm text-text-primary">{quotation.exclusions || "—"}</p>
        </div>
        {quotation.commercialTerms && (
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Commercial Terms</p>
            <p className="mt-1 text-sm text-text-primary">{quotation.commercialTerms}</p>
          </div>
        )}
      </div>

      {quotation.remarks && (
        <p className="border-t border-border pt-3 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Remarks: </span>
          {quotation.remarks}
        </p>
      )}

      <div className="mt-10 grid grid-cols-1 gap-8 border-t border-border pt-6 text-sm sm:grid-cols-3">
        {["Prepared By", "Approved By", "Client Acceptance"].map((role) => (
          <div key={role}>
            <div className="h-10 border-b border-border" />
            <p className="mt-1.5 text-xs text-text-secondary">{role}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
