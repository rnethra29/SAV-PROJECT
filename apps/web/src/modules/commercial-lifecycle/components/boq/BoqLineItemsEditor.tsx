"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { LayersIcon, TrashIcon, PlusIcon } from "@/components/ui/icons";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { BoqDraftLine, BoqRateSource } from "@/modules/commercial-lifecycle/lib/boq-generation";

const RATE_SOURCE_LABELS: Record<BoqRateSource, string> = {
  negotiated_final: "Final negotiated rate",
  quoted: "Quoted rate",
  previous_boq: "Carried from prior version",
  manual: "Manual entry",
};
const RATE_SOURCE_TONE: Record<BoqRateSource, StatusTone> = {
  negotiated_final: "success",
  quoted: "info",
  previous_boq: "secondary",
  manual: "warning",
};

const fieldClasses =
  "w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-secondary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-background disabled:opacity-60";

type BoqLineItemsEditorProps = {
  lines: BoqDraftLine[];
  onChange: (lines: BoqDraftLine[]) => void;
};

export function BoqLineItemsEditor({ lines, onChange }: BoqLineItemsEditorProps) {
  function updateLine(key: string, patch: Partial<BoqDraftLine>) {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function removeLine(key: string) {
    onChange(lines.filter((line) => line.key !== key));
  }

  function addLine() {
    onChange([
      ...lines,
      {
        key: `boq-line-${Math.random().toString(36).slice(2, 10)}`,
        itemCode: "",
        description: "",
        unit: "",
        quantity: 0,
        unitRate: 0,
        isHeader: false,
        sourceRfqItemId: null,
        sourceQuotationItemId: null,
        rateSource: "manual",
        remarks: "",
      },
    ]);
  }

  const total = lines.reduce((sum, line) => sum + (line.isHeader ? 0 : line.quantity * line.unitRate), 0);

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-background">
        <EmptyState
          icon={<LayersIcon className="h-8 w-8" />}
          title="No items to draft into a BOQ"
          description="This RFQ has no line items yet. Add items to the RFQ first, or add a BOQ line manually."
          action={
            <Button type="button" onClick={addLine}>
              <PlusIcon className="h-4 w-4" />
              Add Line
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          Rates are pre-filled from the settled commercial position where available — edit any rate before
          finalizing.
        </p>
        <Button type="button" variant="ghost" onClick={addLine}>
          <PlusIcon className="h-4 w-4" />
          Add Line
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-border bg-background text-text-secondary">
            <tr>
              <th className="w-20 px-3 py-2.5 font-medium">S.No</th>
              <th className="px-3 py-2.5 font-medium">Description</th>
              <th className="w-20 px-3 py-2.5 font-medium">Unit</th>
              <th className="w-24 px-3 py-2.5 text-right font-medium">Qty</th>
              <th className="w-28 px-3 py-2.5 text-right font-medium">Rate</th>
              <th className="w-32 px-3 py-2.5 text-right font-medium">Amount</th>
              <th className="w-40 px-3 py-2.5 font-medium">Rate Source</th>
              <th className="w-12 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key} className={`border-b border-border last:border-0 ${line.isHeader ? "bg-background/60" : ""}`}>
                <td className="px-3 py-2 align-top">
                  <input
                    className={fieldClasses}
                    value={line.itemCode}
                    onChange={(e) => updateLine(line.key, { itemCode: e.target.value })}
                    aria-label="Item code"
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    className={`${fieldClasses} resize-y`}
                    rows={2}
                    value={line.description}
                    onChange={(e) => updateLine(line.key, { description: e.target.value })}
                    aria-label="Description"
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    className={fieldClasses}
                    value={line.unit}
                    disabled={line.isHeader}
                    onChange={(e) => updateLine(line.key, { unit: e.target.value })}
                    aria-label="Unit"
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    type="number"
                    className={`${fieldClasses} text-right`}
                    value={line.isHeader ? 0 : line.quantity}
                    disabled={line.isHeader}
                    onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) || 0 })}
                    aria-label="Quantity"
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    type="number"
                    className={`${fieldClasses} text-right`}
                    value={line.isHeader ? 0 : line.unitRate}
                    disabled={line.isHeader}
                    onChange={(e) =>
                      updateLine(line.key, { unitRate: Number(e.target.value) || 0, rateSource: "manual" })
                    }
                    aria-label="Unit rate"
                  />
                </td>
                <td className="px-3 py-2 text-right align-top font-medium text-text-primary">
                  {line.isHeader ? "—" : formatCurrency(line.quantity * line.unitRate)}
                </td>
                <td className="px-3 py-2 align-top">
                  {!line.isHeader && <StatusBadge label={RATE_SOURCE_LABELS[line.rateSource]} tone={RATE_SOURCE_TONE[line.rateSource]} />}
                </td>
                <td className="px-3 py-2 align-top">
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    title="Remove line"
                    className="rounded-md border border-border p-1.5 text-text-secondary transition hover:border-danger hover:text-danger"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-background">
              <td colSpan={5} className="px-3 py-3 text-right text-sm font-semibold text-text-primary">
                Total ({formatNumber(lines.filter((l) => !l.isHeader).length, 0)} item(s))
              </td>
              <td className="px-3 py-3 text-right text-sm font-semibold text-text-primary">{formatCurrency(total)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
