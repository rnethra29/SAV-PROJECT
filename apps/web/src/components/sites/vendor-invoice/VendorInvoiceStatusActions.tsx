"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { VendorInvoiceTransitionDialog, type VendorInvoiceTransition } from "./VendorInvoiceTransitionDialog";
import { updateVendorInvoiceStatus, verifyVendorInvoice } from "@/lib/sites/vendor-invoices-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devUpdateVendorInvoiceStatus, devVerifyVendorInvoice } from "@/lib/dev-preview/vendor-invoice-fixtures";
import type { VndVendorInvoiceDetail } from "@/types/sites/vendor-invoice";

type VendorInvoiceStatusActionsProps = {
  invoice: VndVendorInvoiceDetail;
  onChanged: () => void;
};

/**
 * Invoice status action bar — Draft -> Submitted -> Verified -> Approved
 * (doc §13), plus Dispute/Cancel. "Verified" is the one dedicated action
 * endpoint (POST /vendor-invoices/:id/verify, sets verified_by/verified_at)
 * — every other move is the generic PATCH /:id {status}, matching
 * src/routes/vndVendorInvoice.routes.js exactly. 'Partially Paid'/'Paid'
 * are reached through Vendor Payments (a later checkpoint), not a button
 * here.
 */
export function VendorInvoiceStatusActions({ invoice, onChanged }: VendorInvoiceStatusActionsProps) {
  const [activeTransition, setActiveTransition] = useState<VendorInvoiceTransition | null>(null);

  const buttons: { key: string; label: string; danger?: boolean; onClick: () => void }[] = [];

  if (invoice.status === "Draft") {
    buttons.push({
      key: "submit",
      label: "Submit Invoice",
      onClick: () =>
        setActiveTransition({
          actionLabel: "Submit Invoice",
          dialogTitle: "Submit this invoice?",
          description: "Moves the invoice into the verification queue.",
          tone: "primary",
          fromStatus: invoice.status,
          toStatus: "Submitted",
          run: () =>
            (DEV_FIXTURE_MODE
              ? devUpdateVendorInvoiceStatus(invoice.vendor_invoice_id, "Submitted")
              : updateVendorInvoiceStatus(invoice.vendor_invoice_id, "Submitted")
            ).then(() => {}),
        }),
    });
  }

  if (invoice.status === "Submitted") {
    buttons.push({
      key: "verify",
      label: "Verify Invoice",
      onClick: () =>
        setActiveTransition({
          actionLabel: "Verify Invoice",
          dialogTitle: "Verify this invoice?",
          description: "Records the mandatory verification checkpoint (doc §13) before it can be approved for payment.",
          tone: "primary",
          fromStatus: invoice.status,
          toStatus: "Verified",
          run: () =>
            (DEV_FIXTURE_MODE ? devVerifyVendorInvoice(invoice.vendor_invoice_id) : verifyVendorInvoice(invoice.vendor_invoice_id)).then(
              () => {},
            ),
        }),
    });
  }

  if (invoice.status === "Verified") {
    buttons.push({
      key: "approve",
      label: "Approve Invoice",
      onClick: () =>
        setActiveTransition({
          actionLabel: "Approve Invoice",
          dialogTitle: "Approve this invoice?",
          description: "Marks the invoice as approved and ready for payment allocation.",
          tone: "primary",
          fromStatus: invoice.status,
          toStatus: "Approved",
          run: () =>
            (DEV_FIXTURE_MODE
              ? devUpdateVendorInvoiceStatus(invoice.vendor_invoice_id, "Approved")
              : updateVendorInvoiceStatus(invoice.vendor_invoice_id, "Approved")
            ).then(() => {}),
        }),
    });
  }

  if (invoice.status === "Disputed") {
    buttons.push({
      key: "resubmit",
      label: "Resubmit Invoice",
      onClick: () =>
        setActiveTransition({
          actionLabel: "Resubmit Invoice",
          dialogTitle: "Resubmit this invoice?",
          description: "Returns the disputed invoice to the verification queue.",
          tone: "primary",
          fromStatus: invoice.status,
          toStatus: "Submitted",
          run: () =>
            (DEV_FIXTURE_MODE
              ? devUpdateVendorInvoiceStatus(invoice.vendor_invoice_id, "Submitted")
              : updateVendorInvoiceStatus(invoice.vendor_invoice_id, "Submitted")
            ).then(() => {}),
        }),
    });
  }

  const canDispute = ["Submitted", "Verified", "Approved", "Partially Paid"].includes(invoice.status);
  if (canDispute) {
    buttons.push({
      key: "dispute",
      label: "Mark as Disputed",
      danger: true,
      onClick: () =>
        setActiveTransition({
          actionLabel: "Mark as Disputed",
          dialogTitle: "Mark this invoice as disputed?",
          description: "Flags the invoice for resolution with the vendor. It can be resubmitted afterward.",
          tone: "danger",
          fromStatus: invoice.status,
          toStatus: "Disputed",
          run: () =>
            (DEV_FIXTURE_MODE
              ? devUpdateVendorInvoiceStatus(invoice.vendor_invoice_id, "Disputed")
              : updateVendorInvoiceStatus(invoice.vendor_invoice_id, "Disputed")
            ).then(() => {}),
        }),
    });
  }

  const canCancel = ["Draft", "Submitted", "Verified", "Approved", "Disputed"].includes(invoice.status);
  if (canCancel) {
    buttons.push({
      key: "cancel",
      label: "Cancel Invoice",
      danger: true,
      onClick: () =>
        setActiveTransition({
          actionLabel: "Cancel Invoice",
          dialogTitle: "Cancel this invoice?",
          description: "This is a terminal state — a cancelled invoice cannot be reopened.",
          tone: "danger",
          fromStatus: invoice.status,
          toStatus: "Cancelled",
          run: () =>
            (DEV_FIXTURE_MODE
              ? devUpdateVendorInvoiceStatus(invoice.vendor_invoice_id, "Cancelled")
              : updateVendorInvoiceStatus(invoice.vendor_invoice_id, "Cancelled")
            ).then(() => {}),
        }),
    });
  }

  if (buttons.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {buttons.map((button) => (
          <Button key={button.key} type="button" variant={button.danger ? "danger" : "primary"} onClick={button.onClick}>
            {button.label}
          </Button>
        ))}
      </div>

      {activeTransition && (
        <VendorInvoiceTransitionDialog
          transition={activeTransition}
          onClose={() => setActiveTransition(null)}
          onSuccess={onChanged}
        />
      )}
    </>
  );
}
