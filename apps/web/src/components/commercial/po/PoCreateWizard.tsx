"use client";

import { useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { CheckIcon } from "@/components/ui/icons";
import { ServiceUnavailableNotice } from "@/components/commercial/shared/ServiceUnavailableNotice";
import { PoLineItemsEditor } from "@/components/commercial/po/PoLineItemsEditor";
import { PoDocumentPreview } from "@/components/commercial/po/PoDocumentPreview";
import type { PoDraftLine } from "@/lib/commercial/po-generation";
import type { VendorOption } from "@/lib/fixtures/commercial-references";

type PoCreateWizardProps = {
  rfqId: string;
  rfqNumber: string;
  boqNumber: string;
  projectName: string;
  siteName: string | null;
  vendorOptions: VendorOption[];
  initialLines: PoDraftLine[];
};

const STEPS = ["Draft Items", "PO Details", "Review"] as const;
const TODAY = new Date().toISOString().slice(0, 10);

// TEMPORARY — no PO backend endpoint exists yet (Module 1 backend not
// built). Replace with real apiFetch("/po", { method: "POST", ... }) once
// the Express com_po / com_po_items endpoints exist. Honestly reports the
// service as unavailable rather than pretending to persist a PO.
async function submitPo(): Promise<{ ok: false; kind: "service-unavailable" }> {
  return { ok: false, kind: "service-unavailable" };
}

export function PoCreateWizard({
  rfqId,
  rfqNumber,
  boqNumber,
  projectName,
  siteName,
  vendorOptions,
  initialLines,
}: PoCreateWizardProps) {
  const [step, setStep] = useState(0);
  const [lines, setLines] = useState<PoDraftLine[]>(initialLines);
  const [vendorId, setVendorId] = useState("");
  const [poDate, setPoDate] = useState(TODAY);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTimeline, setDeliveryTimeline] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [remarks, setRemarks] = useState("");
  const [vendorError, setVendorError] = useState<string | undefined>();
  const [status, setStatus] = useState<"idle" | "submitting" | "unavailable">("idle");

  const vendorName = vendorOptions.find((v) => v.id === vendorId)?.name ?? "Vendor not selected";

  function goNext() {
    if (step === 1 && !vendorId) {
      setVendorError("Select the vendor this PO is being raised against.");
      return;
    }
    setVendorError(undefined);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setStatus("submitting");
    const result = await submitPo();
    setStatus(result.ok === false ? "unavailable" : "idle");
  }

  return (
    <Panel className="bg-surface">
      <ol className="flex flex-wrap gap-1 border-b border-border p-2 sm:p-3" aria-label="PO wizard steps">
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
            <ServiceUnavailableNotice message="The PO service isn't connected yet — this workflow is a frontend preview only. Nothing was saved." />
          </div>
        )}

        {step === 0 && <PoLineItemsEditor lines={lines} onChange={setLines} />}

        {step === 1 && (
          <div className="max-w-xl space-y-5">
            <TextField id="po-number" label="PO Number" value="Auto-generated on save" disabled />
            <Select
              id="po-vendor"
              label="Vendor"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              placeholder="Select vendor"
              options={vendorOptions.map((v) => ({ value: v.id, label: v.name }))}
              error={vendorError}
              required
            />
            <TextField
              id="po-date"
              label="PO Date"
              type="date"
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
            />
            <TextField
              id="po-payment-terms"
              label="Payment Terms"
              placeholder="e.g. 30% advance, 60% on delivery, 10% on completion"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
            <TextField
              id="po-delivery-timeline"
              label="Delivery Timeline"
              placeholder="e.g. 45 days from PO"
              value={deliveryTimeline}
              onChange={(e) => setDeliveryTimeline(e.target.value)}
            />
            <TextArea
              id="po-terms"
              label="Terms & Conditions"
              rows={3}
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
            />
            <TextArea id="po-remarks" label="Remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        )}

        {step === 2 && (
          <PoDocumentPreview
            poNumber="Auto-generated"
            poDate={poDate}
            vendorName={vendorName}
            projectName={projectName}
            siteName={siteName}
            rfqNumber={rfqNumber}
            boqNumber={boqNumber}
            paymentTerms={paymentTerms || null}
            deliveryTimeline={deliveryTimeline || null}
            termsAndConditions={termsAndConditions || null}
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
              {status === "submitting" ? "Saving…" : "Create PO"}
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}
