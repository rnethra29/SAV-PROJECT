import type { ClmInvoiceStatus, ClmVerificationStatus } from "@/types/sites/billing";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

const INVOICE_STATUS_TONE: Record<ClmInvoiceStatus, StatusTone> = {
  Draft: "inactive",
  Submitted: "info",
  Approved: "secondary",
  "Partially Paid": "warning",
  Paid: "success",
  Overdue: "danger",
  Cancelled: "inactive",
};

export function InvoiceStatusBadge({ status }: { status: ClmInvoiceStatus }) {
  return <StatusBadge label={status} tone={INVOICE_STATUS_TONE[status]} />;
}

const VERIFICATION_STATUS_TONE: Record<ClmVerificationStatus, StatusTone> = {
  Pending: "warning",
  Verified: "success",
  Rejected: "danger",
};

export function VerificationStatusBadge({ status }: { status: ClmVerificationStatus }) {
  return <StatusBadge label={status} tone={VERIFICATION_STATUS_TONE[status]} />;
}
