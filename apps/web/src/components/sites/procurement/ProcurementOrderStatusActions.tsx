"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProcurementOrderTransitionDialog, type ProcurementOrderTransition } from "./ProcurementOrderTransitionDialog";
import { ProcurementOrderReceiveDialog } from "./ProcurementOrderReceiveDialog";
import {
  approveProcurementOrderStage,
  cancelProcurementOrder,
  receiveProcurementOrderItems,
  submitProcurementOrder,
  updateProcurementOrderStatus,
} from "@/lib/sites/procurement-orders-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import {
  devApproveProcurementOrderStage,
  devCancelProcurementOrder,
  devReceiveProcurementOrderItems,
  devSubmitProcurementOrder,
  devUpdateProcurementOrderStatus,
} from "@/lib/dev-preview/procurement-fixtures";
import type { VndPoReceiveLine, VndPurchaseOrderDetail, VndPurchaseOrderItem } from "@/types/sites/procurement-order";

type ProcurementOrderStatusActionsProps = {
  order: VndPurchaseOrderDetail;
  items: VndPurchaseOrderItem[];
  onChanged: () => void;
};

/**
 * PO status/approval action bar — the four actions Checkpoint 2 adds
 * (Submit, Approve[Manager/Finance], Receive, Cancel) plus the two plain
 * status moves with no dedicated endpoint (Send to Vendor, Close). Exactly
 * mirrors src/routes/vndPurchaseOrder.routes.js and
 * src/models/statusTransitions.js's VND_PO_TRANSITIONS /
 * VND_PO_APPROVAL_STATUS_TRANSITIONS — no status or action invented beyond
 * what those actually expose.
 */
export function ProcurementOrderStatusActions({ order, items, onChanged }: ProcurementOrderStatusActionsProps) {
  const [activeTransition, setActiveTransition] = useState<ProcurementOrderTransition | null>(null);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);

  const buttons: { key: string; label: string; onClick: () => void; danger?: boolean; disabled?: boolean; title?: string }[] = [];

  if (order.status === "Draft") {
    buttons.push({
      key: "submit",
      label: "Submit for Approval",
      disabled: items.length === 0,
      title: items.length === 0 ? "Add at least one line item before submitting." : undefined,
      onClick: () =>
        setActiveTransition({
          actionLabel: "Submit for Approval",
          dialogTitle: "Submit this purchase order for approval?",
          description: "Moves the PO into the approval queue. Line items can no longer be added once submitted.",
          tone: "primary",
          fromStatus: order.status,
          toStatus: "Pending Approval",
          fromApproval: order.approval_status,
          toApproval: "Pending",
          run: () =>
            (DEV_FIXTURE_MODE ? devSubmitProcurementOrder(order.po_id) : submitProcurementOrder(order.po_id)).then(() => {}),
        }),
    });
  }

  if (order.status === "Pending Approval" && order.approval_status === "Pending") {
    buttons.push({
      key: "approve-manager",
      label: "Record Manager Approval",
      onClick: () =>
        setActiveTransition({
          actionLabel: "Record Manager Approval",
          dialogTitle: "Record Manager approval?",
          description: "Advances the two-stage approval chain — Finance approval is recorded next.",
          tone: "primary",
          fromStatus: order.status,
          toStatus: order.status,
          fromApproval: order.approval_status,
          toApproval: "Manager Approved",
          run: () =>
            (DEV_FIXTURE_MODE
              ? devApproveProcurementOrderStage(order.po_id, "Manager")
              : approveProcurementOrderStage(order.po_id, "Manager")
            ).then(() => {}),
        }),
    });
  }

  if (order.status === "Pending Approval" && order.approval_status === "Manager Approved") {
    buttons.push({
      key: "approve-finance",
      label: "Record Finance Approval",
      onClick: () =>
        setActiveTransition({
          actionLabel: "Record Finance Approval",
          dialogTitle: "Record Finance approval?",
          description: "Completes the approval chain — the purchase order becomes Approved and ready to send to the vendor.",
          tone: "primary",
          fromStatus: order.status,
          toStatus: "Approved",
          fromApproval: order.approval_status,
          toApproval: "Finance Approved",
          run: () =>
            (DEV_FIXTURE_MODE
              ? devApproveProcurementOrderStage(order.po_id, "Finance")
              : approveProcurementOrderStage(order.po_id, "Finance")
            ).then(() => {}),
        }),
    });
  }

  if (order.status === "Approved") {
    buttons.push({
      key: "send-to-vendor",
      label: "Send to Vendor",
      onClick: () =>
        setActiveTransition({
          actionLabel: "Send to Vendor",
          dialogTitle: "Mark this purchase order as sent to the vendor?",
          description: "Records that the PO has been issued to the vendor and is awaiting delivery.",
          tone: "primary",
          fromStatus: order.status,
          toStatus: "Sent to Vendor",
          run: () =>
            (DEV_FIXTURE_MODE
              ? devUpdateProcurementOrderStatus(order.po_id, "Sent to Vendor")
              : updateProcurementOrderStatus(order.po_id, "Sent to Vendor")
            ).then(() => {}),
        }),
    });
  }

  if (order.status === "Sent to Vendor" || order.status === "Partially Received") {
    buttons.push({
      key: "receive",
      label: "Receive Goods",
      onClick: () => setIsReceiveOpen(true),
    });
  }

  if (order.status === "Received") {
    buttons.push({
      key: "close",
      label: "Close Purchase Order",
      onClick: () =>
        setActiveTransition({
          actionLabel: "Close Purchase Order",
          dialogTitle: "Close this purchase order?",
          description: "Marks procurement as complete for this PO. This is a terminal state.",
          tone: "primary",
          fromStatus: order.status,
          toStatus: "Closed",
          run: () =>
            (DEV_FIXTURE_MODE
              ? devUpdateProcurementOrderStatus(order.po_id, "Closed")
              : updateProcurementOrderStatus(order.po_id, "Closed")
            ).then(() => {}),
        }),
    });
  }

  const canCancel = ["Draft", "Pending Approval", "Approved", "Sent to Vendor", "Partially Received"].includes(order.status);
  if (canCancel) {
    buttons.push({
      key: "cancel",
      label: "Cancel Purchase Order",
      danger: true,
      onClick: () =>
        setActiveTransition({
          actionLabel: "Cancel Purchase Order",
          dialogTitle: "Cancel this purchase order?",
          description: "This is a terminal state — a cancelled PO cannot be reopened.",
          tone: "danger",
          fromStatus: order.status,
          toStatus: "Cancelled",
          run: () => (DEV_FIXTURE_MODE ? devCancelProcurementOrder(order.po_id) : cancelProcurementOrder(order.po_id)).then(() => {}),
        }),
    });
  }

  if (buttons.length === 0) return null;

  async function handleReceive(lines: VndPoReceiveLine[]) {
    if (DEV_FIXTURE_MODE) {
      await devReceiveProcurementOrderItems(order.po_id, lines);
    } else {
      await receiveProcurementOrderItems(order.po_id, lines);
    }
  }

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
        <ProcurementOrderTransitionDialog
          transition={activeTransition}
          onClose={() => setActiveTransition(null)}
          onSuccess={onChanged}
        />
      )}

      {isReceiveOpen && (
        <ProcurementOrderReceiveDialog
          items={items}
          onReceive={handleReceive}
          onClose={() => setIsReceiveOpen(false)}
          onSuccess={onChanged}
        />
      )}
    </>
  );
}
