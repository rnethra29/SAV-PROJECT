import type { RfqStatus } from "@/types/commercial/rfq";

/**
 * RFQ status-transition rules — the isolated frontend transition layer.
 *
 * Source of truth for the sequence: com_rfq_status ENUM order in
 * MODULE-1-COMMERCIAL-LIFECYCLE.md §5.1 / §17 — 'Draft','Received',
 * 'Under Review','Under Estimation','Quotation Prepared','Submitted',
 * 'Negotiation','Won','Lost','Cancelled','Expired'. Per the doc's own
 * "Status transitions" business rule: "enforced at the application layer
 * against the ENUM state machines... DB ENUM constrains the *set* of valid
 * values, app logic constrains the *sequence*" — this file is that app-layer
 * sequence constraint. No status beyond the documented eleven is used here.
 *
 * This module knows nothing about fixtures or React — it's the seam meant
 * to be swapped later: `transitionRfqStatus` becomes a real
 * apiFetch(`/rfq/${id}/status`, { method: "PATCH", ... }) call, and every
 * caller (RfqStatusActions, RfqStatusTransitionDialog) keeps working
 * unchanged.
 */

export const RFQ_LIFECYCLE_SEQUENCE: RfqStatus[] = [
  "draft",
  "received",
  "under_review",
  "under_estimation",
  "quotation_prepared",
  "submitted",
  "negotiation",
];

export const RFQ_TERMINAL_STATUSES: RfqStatus[] = ["won", "lost", "cancelled", "expired"];

export type RfqStatusTransition = {
  toStatus: RfqStatus;
  actionLabel: string;
  dialogTitle: string;
  description: string;
  tone: "primary" | "danger";
  requiresReason: boolean;
  reasonLabel?: string;
};

// One forward transition per non-terminal status, following the ENUM's
// documented sequence — except "negotiation", which is the single point the
// doc's own pipeline (Phase 3) branches into the two terminal outcomes,
// Won/Lost. Cancelled/Expired are real ENUM values but the doc never
// specifies who/when triggers them (no approval-gate or timeout rule is
// documented for either), so no UI action forces those two here rather than
// inventing an undocumented business rule.
const FORWARD_TRANSITIONS: Partial<Record<RfqStatus, RfqStatusTransition[]>> = {
  draft: [
    {
      toStatus: "received",
      actionLabel: "Submit RFQ",
      dialogTitle: "Submit this RFQ?",
      description: "Marks RFQ intake as complete and logged. The RFQ moves into the review queue.",
      tone: "primary",
      requiresReason: false,
    },
  ],
  received: [
    {
      toStatus: "under_review",
      actionLabel: "Start Review",
      dialogTitle: "Start review?",
      description: "Begins internal review of the RFQ scope and items before estimation starts.",
      tone: "primary",
      requiresReason: false,
    },
  ],
  under_review: [
    {
      toStatus: "under_estimation",
      actionLabel: "Move to Estimation",
      dialogTitle: "Move to Estimation?",
      description: "Review is complete. The RFQ moves to the Estimation Engineer for item-level cost build-up.",
      tone: "primary",
      requiresReason: false,
    },
  ],
  under_estimation: [
    {
      toStatus: "quotation_prepared",
      actionLabel: "Mark Quotation Prepared",
      dialogTitle: "Mark quotation as prepared?",
      description: "Confirms a quotation has been drafted for this RFQ and is ready to submit to the client.",
      tone: "primary",
      requiresReason: false,
    },
  ],
  quotation_prepared: [
    {
      toStatus: "submitted",
      actionLabel: "Submit to Client",
      dialogTitle: "Submit quotation to client?",
      description: "Marks the quotation as sent to the client.",
      tone: "primary",
      requiresReason: false,
    },
  ],
  submitted: [
    {
      toStatus: "negotiation",
      actionLabel: "Start Negotiation",
      dialogTitle: "Start negotiation?",
      description: "Records that the client has responded and commercial negotiation is underway.",
      tone: "primary",
      requiresReason: false,
    },
  ],
  negotiation: [
    {
      toStatus: "won",
      actionLabel: "Mark as Won",
      dialogTitle: "Mark this RFQ as Won?",
      description: "Closes negotiation with the client accepting the final commercial position. This unlocks BOQ creation.",
      tone: "primary",
      requiresReason: false,
    },
    {
      toStatus: "lost",
      actionLabel: "Mark as Lost",
      dialogTitle: "Mark this RFQ as Lost?",
      description: "Closes negotiation without a deal. This RFQ becomes read-only.",
      tone: "danger",
      requiresReason: true,
      reasonLabel: "Reason (saved to RFQ remarks)",
    },
  ],
};

export function getRfqStatusTransitions(status: RfqStatus): RfqStatusTransition[] {
  return FORWARD_TRANSITIONS[status] ?? [];
}

// RFQ items/scope feed Estimation and then Quotation (Phase 2 walkthrough) —
// once a quotation exists for this RFQ (status 'quotation_prepared' or
// later), the RFQ's own record is the input a quotation was already drafted
// against. com_rfq carries no version_no/previous_version_id (only
// Quotation/BOQ/Documents are versioned per Phase 6), so there's no "RFQ
// revision" to fall back on — silently editing it here would leave the
// existing quotation referencing stale RFQ data. Locking it steers any
// correction toward a new quotation version instead.
export function canEditRfq(status: RfqStatus): boolean {
  return status === "draft" || status === "received" || status === "under_review" || status === "under_estimation";
}

export type RfqTransitionResult = { ok: false; kind: "service-unavailable" };

// TEMPORARY — no RFQ backend endpoint exists yet (Module 1 backend not
// built). Replace with a real apiFetch(`/rfq/${id}/status`, { method:
// "PATCH", body: { status: toStatus, reason } }) call once the Express
// com_rfq endpoint exists. Honestly reports the service as unavailable
// rather than pretending the status changed.
export async function transitionRfqStatus(
  rfqId: string,
  toStatus: RfqStatus,
  reason?: string,
): Promise<RfqTransitionResult> {
  void rfqId;
  void toStatus;
  void reason;
  return { ok: false, kind: "service-unavailable" };
}
