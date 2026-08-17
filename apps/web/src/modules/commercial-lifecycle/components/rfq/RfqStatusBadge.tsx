import type { RfqStatus } from "@/modules/commercial-lifecycle/types/rfq";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

export const RFQ_STATUS_LABELS: Record<RfqStatus, string> = {
  draft: "Draft",
  received: "Received",
  under_review: "Under Review",
  under_estimation: "Under Estimation",
  quotation_prepared: "Quotation Prepared",
  submitted: "Submitted",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
  cancelled: "Cancelled",
  expired: "Expired",
};

// Grouped by lifecycle stage rather than one bespoke color per status: not
// yet actioned (inactive), received/in-flight (info), active work
// (warning/secondary/primary), terminal (success/danger/inactive) — keeps
// the 11-value enum legible at a glance instead of needing 11 hues.
export const RFQ_STATUS_TONE: Record<RfqStatus, StatusTone> = {
  draft: "inactive",
  received: "info",
  under_review: "warning",
  under_estimation: "secondary",
  quotation_prepared: "primary",
  submitted: "info",
  negotiation: "warning",
  won: "success",
  lost: "danger",
  cancelled: "inactive",
  expired: "inactive",
};

type RfqStatusBadgeProps = {
  status: RfqStatus;
};

export function RfqStatusBadge({ status }: RfqStatusBadgeProps) {
  return <StatusBadge label={RFQ_STATUS_LABELS[status]} tone={RFQ_STATUS_TONE[status]} />;
}
