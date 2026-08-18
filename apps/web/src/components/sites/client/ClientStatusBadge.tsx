import type { ClmClientStatus } from "@/types/sites/client";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

export const CLIENT_STATUS_LABELS: Record<ClmClientStatus, string> = {
  Prospect: "Prospect",
  Active: "Active",
  Inactive: "Inactive",
  Blacklisted: "Blacklisted",
};

export const CLIENT_STATUS_TONE: Record<ClmClientStatus, StatusTone> = {
  Prospect: "info",
  Active: "success",
  Inactive: "inactive",
  Blacklisted: "danger",
};

type ClientStatusBadgeProps = {
  status: ClmClientStatus;
};

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  return <StatusBadge label={CLIENT_STATUS_LABELS[status]} tone={CLIENT_STATUS_TONE[status]} />;
}
