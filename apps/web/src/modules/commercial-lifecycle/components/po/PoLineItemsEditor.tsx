"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { LayersIcon, TrashIcon, PlusIcon } from "@/components/ui/icons";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { PoDraftLine } from "@/modules/commercial-lifecycle/lib/po-generation";

const fieldClasses =
  "w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-secondary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-background disabled:opacity-60";

function lineAmount(line: PoDraftLine): number {
  return line.quantity * line.rate * (1 + line.taxPercentage / 100);
}

type PoLineItemsEditorProps = {
  lines: PoDraftLine[];
  onChange: (lines: PoDraftLine[]) => void;
};

export function PoLineItemsEditor({ lines, onChange }: PoLineItemsEditorProps) {
  function updateLine(key: string, patch: Partial<PoDraftLine>) {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function removeLine(key: string) {
    onChange(lines.filter((line) => line.key !== key));
  }

  function addLine() {
    onChange([
      ...lines,
      {
        key: `po-line-${Math.random().toString(36).slice(2, 10)}`,
        boqItemId: null,
        description: "",
        unit: "",
        quantity: 0,
        rate: 0,
        taxPercentage: 0,
        remarks: "",
      },
    ]);
  }

  const total = lines.reduce((sum, line) => sum + lineAmount(line), 0);

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-background">
        <EmptyState
          icon={<LayersIcon className="h-8 w-8" />}
          title="No items to raise a PO for"
          description="Remove this PO for now, or add a line manually if this vendor is supplying something outside the BOQ."
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
          Lines are pre-filled from the Final BOQ — remove any items covered by a different vendor&apos;s PO, or
          adjust quantity/rate before saving.
        </p>
        <Button type="button" variant="ghost" onClick={addLine}>
          <PlusIcon className="h-4 w-4" />
          Add Line
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="border-b border-border bg-background text-text-secondary">
            <tr>
              <th className="px-3 py-2.5 font-medium">Description</th>
              <th className="w-20 px-3 py-2.5 font-medium">Unit</th>
              <th className="w-24 px-3 py-2.5 text-right font-medium">Qty</th>
              <th className="w-28 px-3 py-2.5 text-right font-medium">Rate</th>
              <th className="w-20 px-3 py-2.5 text-right font-medium">Tax %</th>
              <th className="w-32 px-3 py-2.5 text-right font-medium">Amount</th>
              <th className="w-12 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key} className="border-b border-border last:border-0">
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
                    onChange={(e) => updateLine(line.key, { unit: e.target.value })}
                    aria-label="Unit"
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    type="number"
                    className={`${fieldClasses} text-right`}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) || 0 })}
                    aria-label="Quantity"
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    type="number"
                    className={`${fieldClasses} text-right`}
                    value={line.rate}
                    onChange={(e) => updateLine(line.key, { rate: Number(e.target.value) || 0 })}
                    aria-label="Rate"
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    type="number"
                    className={`${fieldClasses} text-right`}
                    value={line.taxPercentage}
                    onChange={(e) => updateLine(line.key, { taxPercentage: Number(e.target.value) || 0 })}
                    aria-label="Tax percentage"
                  />
                </td>
                <td className="px-3 py-2 text-right align-top font-medium text-text-primary">
                  {formatCurrency(lineAmount(line))}
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
                Total ({formatNumber(lines.length, 0)} item(s))
              </td>
              <td className="px-3 py-3 text-right text-sm font-semibold text-text-primary">{formatCurrency(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
