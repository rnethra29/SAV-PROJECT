"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { RfqStatusTransitionDialog } from "@/modules/commercial-lifecycle/components/rfq/RfqStatusTransitionDialog";
import { canEditRfq, getRfqStatusTransitions, type RfqStatusTransition } from "@/modules/commercial-lifecycle/lib/rfq-workflow";
import type { Rfq } from "@/modules/commercial-lifecycle/types/rfq";

type RfqStatusActionsProps = {
  rfq: Rfq;
  hasItems: boolean;
  hasQuotation: boolean;
};

// Per-transition eligibility gates, keyed by the status the transition
// starts from — kept next to the component (not rfq-workflow.ts) because
// the gate depends on *other* RFQ-linked records (items, quotation) that
// the pure workflow module deliberately has no fixture access to.
function isTransitionBlocked(rfq: Rfq, transition: RfqStatusTransition, hasItems: boolean, hasQuotation: boolean): string | null {
  if (rfq.status === "draft" && transition.toStatus === "received" && !hasItems) {
    return "Add at least one line item before submitting.";
  }
  if (rfq.status === "under_estimation" && transition.toStatus === "quotation_prepared" && !hasQuotation) {
    return "Draft a quotation for this RFQ first — see the Quotation tab.";
  }
  return null;
}

export function RfqStatusActions({ rfq, hasItems, hasQuotation }: RfqStatusActionsProps) {
  const [activeTransition, setActiveTransition] = useState<RfqStatusTransition | null>(null);
  const canEdit = canEditRfq(rfq.status);
  const transitions = getRfqStatusTransitions(rfq.status);
  const isTerminal = transitions.length === 0 && !canEdit;

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {canEdit && (
          <Link
            href={`/commercial/rfq/${rfq.id}/edit`}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition hover:border-secondary"
          >
            Edit RFQ
          </Link>
        )}

        {isTerminal && (
          <Link
            href={`/commercial/rfq/${rfq.id}/audit`}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition hover:border-secondary"
          >
            View History
          </Link>
        )}

        {transitions.map((transition) => {
          const blockedReason = isTransitionBlocked(rfq, transition, hasItems, hasQuotation);
          return (
            <Button
              key={transition.toStatus}
              type="button"
              variant={transition.tone === "danger" ? "danger" : "primary"}
              disabled={Boolean(blockedReason)}
              title={blockedReason ?? undefined}
              onClick={() => setActiveTransition(transition)}
            >
              {transition.actionLabel}
            </Button>
          );
        })}
      </div>

      {activeTransition && (
        <RfqStatusTransitionDialog
          rfqId={rfq.id}
          fromStatus={rfq.status}
          transition={activeTransition}
          onClose={() => setActiveTransition(null)}
        />
      )}
    </>
  );
}
