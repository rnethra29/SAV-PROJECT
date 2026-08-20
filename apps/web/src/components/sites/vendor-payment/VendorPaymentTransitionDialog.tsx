"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon, ArrowRightIcon, XIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import type { VndPaymentStatus } from "@/types/sites/vendor-payment";

export type VendorPaymentTransition = {
  actionLabel: string;
  dialogTitle: string;
  description: string;
  tone: "primary" | "danger";
  // Approve doesn't change payment_status (it only stamps approved_by), so
  // there's nothing meaningful to diff — omit fromStatus/toStatus to hide
  // the badge row rather than show a confusing "Pending -> Pending".
  fromStatus?: VndPaymentStatus;
  toStatus?: VndPaymentStatus;
  run: () => Promise<void>;
};

type VendorPaymentTransitionDialogProps = {
  transition: VendorPaymentTransition;
  onClose: () => void;
  onSuccess: () => void;
};

/** Generic one-click payment status/approval confirmation dialog — same shape as VendorInvoiceTransitionDialog. */
export function VendorPaymentTransitionDialog({ transition, onClose, onSuccess }: VendorPaymentTransitionDialogProps) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setStatus("submitting");
    setError(null);
    try {
      await transition.run();
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
        aria-labelledby="payment-transition-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="payment-transition-title" className="text-base font-semibold text-text-primary">
            {transition.dialogTitle}
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

        {transition.fromStatus && transition.toStatus && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <span className="rounded-full border border-border px-2.5 py-0.5">{transition.fromStatus}</span>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-text-secondary" />
            <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 text-secondary">
              {transition.toStatus}
            </span>
          </div>
        )}

        <p className="mt-4 text-sm text-text-secondary">{transition.description}</p>

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
          <Button
            type="button"
            variant={transition.tone === "danger" ? "danger" : "primary"}
            onClick={handleConfirm}
            isLoading={status === "submitting"}
          >
            {status === "submitting" ? "Saving…" : transition.actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
