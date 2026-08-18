import type { ClmRequirementPriority, ClmRequirementStatus } from "@/types/sites/requirement";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

const REQUIREMENT_STATUS_TONE: Record<ClmRequirementStatus, StatusTone> = {
  New: "info",
  "Under Review": "warning",
  "Converted to RFQ": "secondary",
  "Under Estimation": "secondary",
  Quoted: "primary",
  Won: "success",
  Lost: "danger",
  Cancelled: "inactive",
};

export function RequirementStatusBadge({ status }: { status: ClmRequirementStatus }) {
  return <StatusBadge label={status} tone={REQUIREMENT_STATUS_TONE[status]} />;
}

const REQUIREMENT_PRIORITY_TONE: Record<ClmRequirementPriority, StatusTone> = {
  Low: "inactive",
  Medium: "info",
  High: "warning",
  Urgent: "danger",
};

export function RequirementPriorityBadge({ priority }: { priority: ClmRequirementPriority }) {
  return <StatusBadge label={priority} tone={REQUIREMENT_PRIORITY_TONE[priority]} />;
}
