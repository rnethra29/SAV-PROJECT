"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { ArrowRightIcon, XIcon } from "@/components/ui/icons";
import { RfqStatusBadge } from "@/modules/commercial-lifecycle/components/rfq/RfqStatusBadge";
import { ServiceUnavailableNotice } from "@/modules/commercial-lifecycle/components/shared/ServiceUnavailableNotice";
import { transitionRfqStatus, type RfqStatusTransition } from "@/modules/commercial-lifecycle/lib/rfq-workflow";
import type { RfqStatus } from "@/modules/commercial-lifecycle/types/rfq";

type RfqStatusTransitionDialogProps = {
  rfqId: string;
  fromStatus: RfqStatus;
  transition: RfqStatusTransition;
  onClose: () => void;
};

export function RfqStatusTransitionDialog({ rfqId, fromStatus, transition, onClose }: RfqStatusTransitionDialogProps) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [status, setStatus] = useState<"idle" | "submitting" | "unavailable">("idle");

  async function handleConfirm() {
    if (transition.requiresReason && !reason.trim()) {
      setReasonError("A reason is required.");
      return;
    }
    setReasonError(undefined);
    setStatus("submitting");
    const result = await transitionRfqStatus(rfqId, transition.toStatus, reason.trim() || undefined);
    setStatus(result.ok === false ? "unavailable" : "idle");
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rfq-transition-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="rfq-transition-title" className="text-base font-semibold text-text-primary">
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

        <div className="mt-4 flex items-center justify-center gap-3">
          <RfqStatusBadge status={fromStatus} />
          <ArrowRightIcon className="h-4 w-4 shrink-0 text-text-secondary" />
          <RfqStatusBadge status={transition.toStatus} />
        </div>

        <p className="mt-4 text-sm text-text-secondary">{transition.description}</p>

        {transition.requiresReason && (
          <div className="mt-4">
            <TextArea
              id="rfq-transition-reason"
              label={transition.reasonLabel ?? "Reason"}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={reasonError}
              required
            />
          </div>
        )}

        {status === "unavailable" && (
          <div className="mt-4">
            <ServiceUnavailableNotice message="The RFQ service isn't connected yet — this status change is a frontend preview only. Nothing was saved." />
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
