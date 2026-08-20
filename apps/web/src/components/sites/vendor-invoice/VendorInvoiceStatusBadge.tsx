import type { VndInvoiceStatus } from "@/types/sites/vendor-invoice";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

export const INVOICE_STATUS_TONE: Record<VndInvoiceStatus, StatusTone> = {
  Draft: "inactive",
  Submitted: "warning",
  Verified: "info",
  Approved: "secondary",
  "Partially Paid": "warning",
  Paid: "success",
  Disputed: "danger",
  Cancelled: "danger",
};

export function VendorInvoiceStatusBadge({ status }: { status: VndInvoiceStatus }) {
  return <StatusBadge label={status} tone={INVOICE_STATUS_TONE[status]} />;
}
