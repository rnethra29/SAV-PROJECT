"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { VendorPaymentTransitionDialog, type VendorPaymentTransition } from "./VendorPaymentTransitionDialog";
import { approveVendorPayment, updateVendorPaymentStatus } from "@/lib/sites/vendor-payments-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devApproveVendorPayment, devUpdateVendorPaymentStatus } from "@/lib/dev-preview/vendor-payment-fixtures";
import type { VndVendorPaymentDetail } from "@/types/sites/vendor-payment";

type VendorPaymentStatusActionsProps = {
  payment: VndVendorPaymentDetail;
  onChanged: () => void;
};

/**
 * Payment status/approval action bar — mirrors
 * src/routes/vndVendorPayment.routes.js exactly: POST /:id/approve stamps
 * approved_by (required-approval-before-payment gate, doc §6.15/§20) and is
 * a one-time action, separate from payment_status; POST /:id/status moves
 * payment_status per VND_PAYMENT_TRANSITIONS (Pending<->Failed,
 * Pending->Processed [requires approved_by], Processed->Reversed).
 */
export function VendorPaymentStatusActions({ payment, onChanged }: VendorPaymentStatusActionsProps) {
  const [activeTransition, setActiveTransition] = useState<VendorPaymentTransition | null>(null);

  const buttons: { key: string; label: string; danger?: boolean; disabled?: boolean; title?: string; onClick: () => void }[] = [];

  if (!payment.approved_by) {
    buttons.push({
      key: "approve",
      label: "Approve Payment",
      onClick: () =>
        setActiveTransition({
          actionLabel: "Approve Payment",
          dialogTitle: "Approve this payment?",
          description: "Records Finance approval (doc §6.15) — required before the payment can be marked Processed.",
          tone: "primary",
          run: () => (DEV_FIXTURE_MODE ? devApproveVendorPayment(payment.vendor_payment_id) : approveVendorPayment(payment.vendor_payment_id)).then(() => {}),
        }),
    });
  }

  if (payment.payment_status === "Pending") {
    buttons.push({
      key: "processed",
      label: "Mark as Processed",
      disabled: !payment.approved_by,
      title: !payment.approved_by ? "Approve this payment first." : undefined,
      onClick: () =>
        setActiveTransition({
          actionLabel: "Mark as Processed",
          dialogTitle: "Mark this payment as processed?",
          description: "Confirms the payment has actually gone through (funds transferred/cheque cleared).",
          tone: "primary",
          fromStatus: payment.payment_status,
          toStatus: "Processed",
          run: () =>
            (DEV_FIXTURE_MODE
              ? devUpdateVendorPaymentStatus(payment.vendor_payment_id, "Processed")
              : updateVendorPaymentStatus(payment.vendor_payment_id, "Processed")
            ).then(() => {}),
        }),
    });
    buttons.push({
      key: "failed",
      label: "Mark as Failed",
      danger: true,
      onClick: () =>
        setActiveTransition({
          actionLabel: "Mark as Failed",
          dialogTitle: "Mark this payment as failed?",
          description: "Records that the payment attempt did not go through — it can be retried afterward.",
          tone: "danger",
          fromStatus: payment.payment_status,
          toStatus: "Failed",
          run: () =>
            (DEV_FIXTURE_MODE
              ? devUpdateVendorPaymentStatus(payment.vendor_payment_id, "Failed")
              : updateVendorPaymentStatus(payment.vendor_payment_id, "Failed")
            ).then(() => {}),
        }),
    });
  }

  if (payment.payment_status === "Failed") {
    buttons.push({
      key: "retry",
      label: "Retry Payment",
      onClick: () =>
        setActiveTransition({
          actionLabel: "Retry Payment",
          dialogTitle: "Retry this payment?",
          description: "Returns the payment to Pending so it can be attempted again.",
          tone: "primary",
          fromStatus: payment.payment_status,
          toStatus: "Pending",
          run: () =>
            (DEV_FIXTURE_MODE
              ? devUpdateVendorPaymentStatus(payment.vendor_payment_id, "Pending")
              : updateVendorPaymentStatus(payment.vendor_payment_id, "Pending")
            ).then(() => {}),
        }),
    });
  }

  if (payment.payment_status === "Processed") {
    buttons.push({
      key: "reverse",
      label: "Reverse Payment",
      danger: true,
      onClick: () =>
        setActiveTransition({
          actionLabel: "Reverse Payment",
          dialogTitle: "Reverse this payment?",
          description: "This is a terminal state — a reversed payment cannot be reopened.",
          tone: "danger",
          fromStatus: payment.payment_status,
          toStatus: "Reversed",
          run: () =>
            (DEV_FIXTURE_MODE
              ? devUpdateVendorPaymentStatus(payment.vendor_payment_id, "Reversed")
              : updateVendorPaymentStatus(payment.vendor_payment_id, "Reversed")
            ).then(() => {}),
        }),
    });
  }

  if (buttons.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {buttons.map((button) => (
          <Button
            key={button.key}
            type="button"
            variant={button.danger ? "danger" : "primary"}
            disabled={button.disabled}
            title={button.title}
            onClick={button.onClick}
          >
            {button.label}
          </Button>
        ))}
      </div>

      {activeTransition && (
        <VendorPaymentTransitionDialog transition={activeTransition} onClose={() => setActiveTransition(null)} onSuccess={onChanged} />
      )}
    </>
  );
}
