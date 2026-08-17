import { AlertCircleIcon } from "@/components/ui/icons";

type ServiceUnavailableNoticeProps = {
  message?: string;
};

// Shared banner for every write-workflow stub in Module 1 — no Express
// endpoint exists yet for RFQ/BOQ/PO/Quotation mutations, so every "Save" /
// "Submit" action in these wizards honestly reports that instead of faking
// a persisted record. Swap out once the corresponding com_* endpoint ships.
export function ServiceUnavailableNotice({
  message = "This service isn't connected yet — this workflow is a frontend preview only. Nothing was saved.",
}: ServiceUnavailableNoticeProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/5 px-3.5 py-3"
    >
      <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <p className="text-sm text-text-primary">{message}</p>
    </div>
  );
}
