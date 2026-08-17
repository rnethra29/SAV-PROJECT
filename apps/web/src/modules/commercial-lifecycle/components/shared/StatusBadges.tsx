import type { EstimationStatus } from "@/modules/commercial-lifecycle/types/estimation";
import type { QuotationStatus } from "@/modules/commercial-lifecycle/types/quotation";
import type { BoqStatus, BoqType } from "@/modules/commercial-lifecycle/types/boq";
import type { PoStatus } from "@/modules/commercial-lifecycle/types/po";
import type { ApprovalStatus, DocumentStatus } from "@/modules/commercial-lifecycle/types/shared";
import type { OfferResponseStatus } from "@/modules/commercial-lifecycle/types/negotiation";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

const ESTIMATION_LABELS: Record<EstimationStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  submitted_for_approval: "Submitted for Approval",
  approved: "Approved",
  rejected: "Rejected",
  revised: "Revised",
};
const ESTIMATION_TONE: Record<EstimationStatus, StatusTone> = {
  draft: "inactive",
  in_progress: "secondary",
  submitted_for_approval: "warning",
  approved: "success",
  rejected: "danger",
  revised: "info",
};
export function EstimationStatusBadge({ status }: { status: EstimationStatus }) {
  return <StatusBadge label={ESTIMATION_LABELS[status]} tone={ESTIMATION_TONE[status]} />;
}

export const QUOTATION_LABELS: Record<QuotationStatus, string> = {
  draft: "Draft",
  under_approval: "Under Approval",
  approved: "Approved",
  submitted: "Submitted",
  revised: "Revised",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  cancelled: "Cancelled",
};
export const QUOTATION_TONE: Record<QuotationStatus, StatusTone> = {
  draft: "inactive",
  under_approval: "warning",
  approved: "secondary",
  submitted: "info",
  revised: "info",
  accepted: "success",
  rejected: "danger",
  expired: "inactive",
  cancelled: "inactive",
};
export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return <StatusBadge label={QUOTATION_LABELS[status]} tone={QUOTATION_TONE[status]} />;
}

const BOQ_LABELS: Record<BoqStatus, string> = {
  draft: "Draft",
  tentative: "Tentative",
  under_review: "Under Review",
  approved: "Approved",
  final: "Final",
  revised: "Revised",
  cancelled: "Cancelled",
};
const BOQ_TONE: Record<BoqStatus, StatusTone> = {
  draft: "inactive",
  tentative: "secondary",
  under_review: "warning",
  approved: "info",
  final: "success",
  revised: "info",
  cancelled: "danger",
};
export function BoqStatusBadge({ status }: { status: BoqStatus }) {
  return <StatusBadge label={BOQ_LABELS[status]} tone={BOQ_TONE[status]} />;
}

const BOQ_TYPE_LABELS: Record<BoqType, string> = { tentative: "Tentative", final: "Final" };
const BOQ_TYPE_TONE: Record<BoqType, StatusTone> = { tentative: "secondary", final: "success" };
export function BoqTypeBadge({ type }: { type: BoqType }) {
  return <StatusBadge label={BOQ_TYPE_LABELS[type]} tone={BOQ_TYPE_TONE[type]} />;
}

const PO_LABELS: Record<PoStatus, string> = {
  draft: "Draft",
  under_approval: "Under Approval",
  approved: "Approved",
  issued: "Issued",
  acknowledged: "Acknowledged",
  cancelled: "Cancelled",
  closed: "Closed",
};
const PO_TONE: Record<PoStatus, StatusTone> = {
  draft: "inactive",
  under_approval: "warning",
  approved: "secondary",
  issued: "info",
  acknowledged: "success",
  cancelled: "danger",
  closed: "inactive",
};
export function PoStatusBadge({ status }: { status: PoStatus }) {
  return <StatusBadge label={PO_LABELS[status]} tone={PO_TONE[status]} />;
}

const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};
const APPROVAL_TONE: Record<ApprovalStatus, StatusTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};
export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return <StatusBadge label={APPROVAL_LABELS[status]} tone={APPROVAL_TONE[status]} />;
}

const DOCUMENT_LABELS: Record<DocumentStatus, string> = {
  active: "Active",
  superseded: "Superseded",
  archived: "Archived",
};
const DOCUMENT_TONE: Record<DocumentStatus, StatusTone> = {
  active: "success",
  superseded: "inactive",
  archived: "inactive",
};
export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <StatusBadge label={DOCUMENT_LABELS[status]} tone={DOCUMENT_TONE[status]} />;
}

const OFFER_RESPONSE_LABELS: Record<OfferResponseStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  countered: "Countered",
};
const OFFER_RESPONSE_TONE: Record<OfferResponseStatus, StatusTone> = {
  pending: "warning",
  accepted: "success",
  rejected: "danger",
  countered: "secondary",
};
export function OfferResponseBadge({ status }: { status: OfferResponseStatus }) {
  return <StatusBadge label={OFFER_RESPONSE_LABELS[status]} tone={OFFER_RESPONSE_TONE[status]} />;
}
