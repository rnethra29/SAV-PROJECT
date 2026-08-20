import type { VndPoApprovalStatus, VndPoStatus } from "@/types/sites/procurement-order";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

export const PO_STATUS_TONE: Record<VndPoStatus, StatusTone> = {
  Draft: "inactive",
  "Pending Approval": "warning",
  Approved: "info",
  "Sent to Vendor": "secondary",
  "Partially Received": "warning",
  Received: "success",
  Closed: "success",
  Cancelled: "danger",
};

export function ProcurementOrderStatusBadge({ status }: { status: VndPoStatus }) {
  return <StatusBadge label={status} tone={PO_STATUS_TONE[status]} />;
}

export const PO_APPROVAL_STATUS_TONE: Record<VndPoApprovalStatus, StatusTone> = {
  "Not Required": "inactive",
  Pending: "warning",
  "Manager Approved": "info",
  "Finance Approved": "success",
  Rejected: "danger",
};

export function ProcurementOrderApprovalBadge({ status }: { status: VndPoApprovalStatus }) {
  return <StatusBadge label={status} tone={PO_APPROVAL_STATUS_TONE[status]} />;
}
