import type { VndPaymentStatus } from "@/types/sites/vendor-payment";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

export const PAYMENT_STATUS_TONE: Record<VndPaymentStatus, StatusTone> = {
  Pending: "warning",
  Processed: "success",
  Failed: "danger",
  Reversed: "inactive",
};

export function VendorPaymentStatusBadge({ status }: { status: VndPaymentStatus }) {
  return <StatusBadge label={status} tone={PAYMENT_STATUS_TONE[status]} />;
}
