"use client";

import { useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { CheckIcon } from "@/components/ui/icons";
import { ServiceUnavailableNotice } from "@/modules/commercial-lifecycle/components/shared/ServiceUnavailableNotice";
import { BoqLineItemsEditor } from "@/modules/commercial-lifecycle/components/boq/BoqLineItemsEditor";
import { BoqDocumentPreview } from "@/modules/commercial-lifecycle/components/boq/BoqDocumentPreview";
import type { BoqDraftLine } from "@/modules/commercial-lifecycle/lib/boq-generation";
import type { BoqType } from "@/modules/commercial-lifecycle/types/boq";

type BoqCreateWizardProps = {
  rfqId: string;
  rfqNumber: string;
  clientName: string;
  projectName: string;
  siteName: string | null;
  mode: "create" | "revise";
  boqNumber: string; // "Auto-generated on save" placeholder for create mode, existing number for revise mode
  nextVersionNo: number;
  defaultTitle: string;
  initialLines: BoqDraftLine[];
};

const STEPS = ["Draft Items", "BOQ Details", "Review"] as const;

// TEMPORARY — no BOQ backend endpoint exists yet (Module 1 backend not
// built). Replace with real apiFetch("/boq", { method: "POST", ... }) once
// the Express com_boq / com_boq_items endpoints exist. Honestly reports the
// service as unavailable rather than pretending to persist a version.
async function submitBoq(): Promise<{ ok: false; kind: "service-unavailable" }> {
  return { ok: false, kind: "service-unavailable" };
}

export function BoqCreateWizard({
  rfqId,
  rfqNumber,
  clientName,
  projectName,
  siteName,
  mode,
  boqNumber,
  nextVersionNo,
  defaultTitle,
  initialLines,
}: BoqCreateWizardProps) {
  const [step, setStep] = useState(0);
  const [lines, setLines] = useState<BoqDraftLine[]>(initialLines);
  const [title, setTitle] = useState(defaultTitle);
  const [boqType, setBoqType] = useState<BoqType>("tentative");
  const [revisionReason, setRevisionReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [status, setStatus] = useState<"idle" | "submitting" | "unavailable">("idle");

  function goNext() {
    if (step === 1 && mode === "revise" && !revisionReason.trim()) {
      setReasonError("A revision reason is required when creating a new version.");
      return;
    }
    setReasonError(undefined);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setStatus("submitting");
    const result = await submitBoq();
    setStatus(result.ok === false ? "unavailable" : "idle");
  }

  return (
    <Panel className="bg-surface">
      <ol className="flex flex-wrap gap-1 border-b border-border p-2 sm:p-3" aria-label="BOQ wizard steps">
        {STEPS.map((label, index) => {
          const isActive = index === step;
          const isDone = index < step;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(index)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-primary/10 text-text-primary" : "text-text-secondary hover:bg-background"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                    isDone ? "bg-secondary text-surface" : isActive ? "bg-primary text-text-primary" : "bg-background text-text-secondary"
                  }`}
                >
                  {isDone ? <CheckIcon className="h-3 w-3" /> : index + 1}
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="p-6 lg:p-8">
        {status === "unavailable" && (
          <div className="mb-6">
            <ServiceUnavailableNotice message="The BOQ service isn't connected yet — this workflow is a frontend preview only. Nothing was saved." />
          </div>
        )}

        {step === 0 && <BoqLineItemsEditor lines={lines} onChange={setLines} />}

        {step === 1 && (
          <div className="max-w-xl space-y-5">
            <TextField
              id="boq-number"
              label="BOQ Number"
              value={mode === "create" ? "Auto-generated on save" : boqNumber}
              disabled
            />
            <TextField id="boq-title" label="BOQ Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Select
              id="boq-type"
              label="BOQ Type"
              value={boqType}
              onChange={(e) => setBoqType(e.target.value as BoqType)}
              options={[
                { value: "tentative", label: "Tentative" },
                { value: "final", label: "Final" },
              ]}
            />
            {mode === "revise" && (
              <TextArea
                id="boq-revision-reason"
                label="Revision Reason"
                rows={2}
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                error={reasonError}
                required
              />
            )}
            <TextArea id="boq-remarks" label="Remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        )}

        {step === 2 && (
          <BoqDocumentPreview
            boqNumber={mode === "create" ? "Auto-generated" : boqNumber}
            versionNo={nextVersionNo}
            boqType={boqType}
            title={title}
            date={new Date().toISOString()}
            clientName={clientName}
            projectName={projectName}
            siteName={siteName}
            rfqNumber={rfqNumber}
            revisionReason={mode === "revise" ? revisionReason : null}
            remarks={remarks || null}
            lines={lines}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border p-6 print:hidden">
        <Link
          href={`/commercial/rfq/${rfqId}/boq`}
          className="text-sm font-medium text-secondary underline-offset-2 hover:underline"
        >
          Cancel
        </Link>
        <div className="flex items-center gap-3">
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={goBack} disabled={status === "submitting"}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} disabled={status === "submitting"}>
              Next
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} isLoading={status === "submitting"}>
              {status === "submitting" ? "Saving…" : boqType === "final" ? "Finalize BOQ" : "Save as Tentative"}
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}
