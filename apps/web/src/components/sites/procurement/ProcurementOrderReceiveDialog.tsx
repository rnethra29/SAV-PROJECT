"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon, XIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { formatNumber } from "@/lib/format";
import type { VndPoReceiveLine, VndPurchaseOrderItem } from "@/types/sites/procurement-order";

type ProcurementOrderReceiveDialogProps = {
  items: VndPurchaseOrderItem[];
  onReceive: (lines: VndPoReceiveLine[]) => Promise<void>;
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * Goods receipt dialog — vnd_purchase_order_item.received_quantity (doc
 * §6.12), recorded via POST /procurement-orders/:id/receive
 * {items:[{poItemId, receivedQuantity}]}. Separate from
 * ProcurementOrderTransitionDialog because this is the one PO action that's
 * item-level, not a plain status swap.
 */
export function ProcurementOrderReceiveDialog({ items, onReceive, onClose, onSuccess }: ProcurementOrderReceiveDialogProps) {
  const [quantities, setQuantities] = useState<Record<string, string>>(
    Object.fromEntries(items.map((item) => [item.po_item_id, item.received_quantity])),
  );
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  function setQuantity(poItemId: string, value: string) {
    setQuantities((prev) => ({ ...prev, [poItemId]: value }));
  }

  async function handleConfirm() {
    setStatus("submitting");
    setError(null);
    try {
      const lines: VndPoReceiveLine[] = items.map((item) => ({
        poItemId: item.po_item_id,
        receivedQuantity: Number(quantities[item.po_item_id] ?? item.received_quantity),
      }));
      await onReceive(lines);
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        try {
          const body = JSON.parse(err.message);
          setError(body.message ?? err.message);
        } catch {
          setError(err.message || "Something went wrong.");
        }
      } else {
        setError("Couldn't reach the server. Check your connection and try again.");
      }
      setStatus("idle");
    }
  }

  return (
    <div role="presentation" onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="po-receive-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="po-receive-title" className="text-base font-semibold text-text-primary">
            Record goods receipt
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1 text-text-secondary transition hover:bg-background hover:text-text-primary"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-sm text-text-secondary">
          Enter the total quantity received to date for each line. The PO moves to &quot;Partially Received&quot; or
          &quot;Received&quot; automatically based on these values.
        </p>

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.po_item_id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{item.item_name}</p>
                <p className="text-xs text-text-secondary">
                  Ordered: {formatNumber(Number(item.quantity), 3)} {item.unit}
                </p>
              </div>
              <input
                type="number"
                min={0}
                max={Number(item.quantity)}
                step="any"
                value={quantities[item.po_item_id] ?? ""}
                onChange={(e) => setQuantity(item.po_item_id, e.target.value)}
                aria-label={`Received quantity for ${item.item_name}`}
                disabled={status === "submitting"}
                className="w-28 shrink-0 rounded-md border border-border bg-surface px-2.5 py-1.5 text-right text-sm text-text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1"
              />
            </div>
          ))}
        </div>

        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-3.5 py-3">
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-sm text-text-primary">{error}</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={status === "submitting"}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} isLoading={status === "submitting"}>
            {status === "submitting" ? "Saving…" : "Record Receipt"}
          </Button>
        </div>
      </div>
    </div>
  );
}
