import type { RfqStatus } from "@/types/commercial/rfq";
import { RFQ_STATUS_LABELS } from "./RfqStatusBadge";

const MAIN_STAGES: RfqStatus[] = [
  "draft",
  "received",
  "under_review",
  "under_estimation",
  "quotation_prepared",
  "submitted",
  "negotiation",
];

const TERMINAL_STAGES: Record<string, { label: string; className: string }> = {
  won: { label: "Won", className: "bg-success text-white" },
  lost: { label: "Lost", className: "bg-danger text-white" },
  cancelled: { label: "Cancelled", className: "bg-inactive text-white" },
  expired: { label: "Expired", className: "bg-inactive text-white" },
};

type RfqStatusWorkflowProps = {
  status: RfqStatus;
};

// Linear stepper for the main intake→negotiation flow; won/lost/cancelled/
// expired are terminal branches off that flow rather than further steps in
// it, so they render as a distinct end chip instead of extending the line.
export function RfqStatusWorkflow({ status }: RfqStatusWorkflowProps) {
  const terminal = TERMINAL_STAGES[status];
  const currentIndex = MAIN_STAGES.indexOf(status);
  const effectiveIndex = terminal ? MAIN_STAGES.length - 1 : currentIndex;

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-1">
      {MAIN_STAGES.map((stage, index) => {
        const isComplete = index < effectiveIndex || (!terminal && index === effectiveIndex);
        const isCurrent = !terminal && index === effectiveIndex;
        return (
          <div key={stage} className="flex shrink-0 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  isComplete || isCurrent
                    ? "bg-primary text-text-primary"
                    : "bg-border text-text-secondary"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`max-w-[5.5rem] text-center text-[11px] leading-tight ${
                  isCurrent ? "font-semibold text-text-primary" : "text-text-secondary"
                }`}
              >
                {RFQ_STATUS_LABELS[stage]}
              </span>
            </div>
            {index < MAIN_STAGES.length - 1 && (
              <div className={`mx-1.5 h-0.5 w-8 shrink-0 ${index < effectiveIndex ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
      {terminal && (
        <>
          <div className="mx-1.5 h-0.5 w-8 shrink-0 bg-primary" />
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${terminal.className}`}>
            {terminal.label}
          </span>
        </>
      )}
    </div>
  );
}
