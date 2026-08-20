import type { VndVendorStatus } from "@/types/sites/vendor";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

export const VENDOR_STATUS_LABELS: Record<VndVendorStatus, string> = {
  Active: "Active",
  Inactive: "Inactive",
  Blacklisted: "Blacklisted",
  "Under Review": "Under Review",
};

export const VENDOR_STATUS_TONE: Record<VndVendorStatus, StatusTone> = {
  Active: "success",
  Inactive: "inactive",
  Blacklisted: "danger",
  "Under Review": "warning",
};

type VendorStatusBadgeProps = {
  status: VndVendorStatus;
};

export function VendorStatusBadge({ status }: VendorStatusBadgeProps) {
  return <StatusBadge label={VENDOR_STATUS_LABELS[status]} tone={VENDOR_STATUS_TONE[status]} />;
}
