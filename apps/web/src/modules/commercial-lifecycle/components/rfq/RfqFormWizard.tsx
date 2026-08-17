"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { FolderIcon, CheckIcon } from "@/components/ui/icons";
import { ServiceUnavailableNotice } from "@/modules/commercial-lifecycle/components/shared/ServiceUnavailableNotice";
import { RfqItemsEditor, type DraftRfqItem } from "@/modules/commercial-lifecycle/components/rfq/RfqItemsEditor";
import { formatNumber } from "@/lib/format";
import type { ClientOption, ProjectOption, SiteOption } from "@/modules/commercial-lifecycle/fixtures/commercial-references";
import type { ItemCategoryOption } from "@/modules/commercial-lifecycle/fixtures/item-categories";
import type { Rfq } from "@/modules/commercial-lifecycle/types/rfq";

type RfqFormWizardProps = {
  mode: "create" | "edit";
  clients: ClientOption[];
  projects: ProjectOption[];
  sites: SiteOption[];
  categories: ItemCategoryOption[];
  initialRfq?: Rfq;
  initialItems?: DraftRfqItem[];
  initialStep?: number;
};

type RfqDraft = {
  clientId: string;
  projectId: string;
  siteId: string;
  rfqDate: string;
  scopeOfWork: string;
  executionTimeline: string;
  paymentTerms: string;
  remarks: string;
};

type FieldErrors = Partial<Record<"clientId" | "projectId" | "rfqDate", string>>;

const STEPS = ["Basic Information", "Scope / Items", "Documents", "Review"] as const;

function emptyDraft(): RfqDraft {
  return {
    clientId: "",
    projectId: "",
    siteId: "",
    rfqDate: "",
    scopeOfWork: "",
    executionTimeline: "",
    paymentTerms: "",
    remarks: "",
  };
}

function draftFromRfq(rfq: Rfq): RfqDraft {
  return {
    clientId: rfq.clientId,
    projectId: rfq.projectId,
    siteId: rfq.siteId ?? "",
    rfqDate: rfq.rfqDate,
    scopeOfWork: rfq.scopeOfWork ?? "",
    executionTimeline: rfq.executionTimeline ?? "",
    paymentTerms: rfq.paymentTerms ?? "",
    remarks: rfq.remarks ?? "",
  };
}

function validateBasics(draft: RfqDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.clientId) errors.clientId = "Select a client.";
  if (!draft.projectId) errors.projectId = "Select a project.";
  if (!draft.rfqDate) errors.rfqDate = "Enter the RFQ date.";
  return errors;
}

// TEMPORARY — no RFQ backend endpoint exists yet (Module 1 backend not
// built). Replace with real apiFetch("/rfq", { method: mode === "create" ?
// "POST" : "PATCH", ... }) calls once the Express com_rfq / com_rfq_items
// endpoints exist. Until then this honestly reports the service as
// unavailable rather than pretending to save the RFQ.
async function submitRfq(
  draft: RfqDraft,
  items: DraftRfqItem[],
  mode: "create" | "edit",
): Promise<{ ok: false; kind: "service-unavailable" }> {
  void draft;
  void items;
  void mode;
  return { ok: false, kind: "service-unavailable" };
}

export function RfqFormWizard({
  mode,
  clients,
  projects,
  sites,
  categories,
  initialRfq,
  initialItems,
  initialStep = 0,
}: RfqFormWizardProps) {
  const [step, setStep] = useState(initialStep);
  const [draft, setDraft] = useState<RfqDraft>(initialRfq ? draftFromRfq(initialRfq) : emptyDraft());
  const [items, setItems] = useState<DraftRfqItem[]>(initialItems ?? []);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "unavailable">("idle");

  const availableProjects = useMemo(
    () => projects.filter((project) => project.clientId === draft.clientId),
    [projects, draft.clientId],
  );
  const availableSites = useMemo(
    () => sites.filter((site) => site.projectId === draft.projectId),
    [sites, draft.projectId],
  );
  const clientName = clients.find((c) => c.id === draft.clientId)?.name ?? "—";
  const projectName = projects.find((p) => p.id === draft.projectId)?.name ?? "—";
  const siteName = sites.find((s) => s.id === draft.siteId)?.name ?? null;
  const lineItemCount = items.filter((item) => !item.isHeader).length;

  function updateField<K extends keyof RfqDraft>(key: K, value: RfqDraft[K]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "clientId") {
        next.projectId = "";
        next.siteId = "";
      }
      if (key === "projectId") next.siteId = "";
      return next;
    });
  }

  function goNext() {
    if (step === 0) {
      const errors = validateBasics(draft);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setStatus("submitting");
    const result = await submitRfq(draft, items, mode);
    setStatus(result.ok === false ? "unavailable" : "idle");
  }

  const backHref = mode === "edit" && initialRfq ? `/commercial/rfq/${initialRfq.id}` : "/commercial/rfq";

  return (
    <Panel className="bg-surface">
      <ol className="flex flex-wrap gap-1 border-b border-border p-2 sm:p-3" aria-label="RFQ form steps">
        {STEPS.map((label, index) => {
          const isActive = index === step;
          const isDone = index < step;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(index)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary/10 text-text-primary"
                    : isDone
                      ? "text-secondary hover:bg-background"
                      : "text-text-secondary hover:bg-background"
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
            <ServiceUnavailableNotice
              message={`The RFQ service isn't connected yet — this ${mode === "create" ? "creation" : "edit"} workflow is a frontend preview only. Nothing was saved.`}
            />
          </div>
        )}

        {step === 0 && (
          <div className="space-y-6">
            <div>
              <TextField
                id="rfq-number"
                label="RFQ Number"
                value={mode === "edit" && initialRfq ? initialRfq.rfqNumber : "Auto-generated on save"}
                disabled
              />
              <p className="mt-1.5 text-xs text-text-secondary">
                {mode === "edit" ? "RFQ number is fixed once assigned." : "System-generated once the RFQ is saved."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Select
                id="rfq-client"
                label="Client"
                placeholder="Select client"
                options={clients.map((client) => ({ value: client.id, label: client.name }))}
                value={draft.clientId}
                onChange={(e) => updateField("clientId", e.target.value)}
                error={fieldErrors.clientId}
                required
              />
              <Select
                id="rfq-project"
                label="Project"
                placeholder={draft.clientId ? "Select project" : "Select a client first"}
                options={availableProjects.map((project) => ({ value: project.id, label: project.name }))}
                value={draft.projectId}
                onChange={(e) => updateField("projectId", e.target.value)}
                error={fieldErrors.projectId}
                disabled={!draft.clientId}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Select
                id="rfq-site"
                label="Site"
                placeholder={draft.projectId ? "No specific site" : "Select a project first"}
                options={availableSites.map((site) => ({ value: site.id, label: site.name }))}
                value={draft.siteId}
                onChange={(e) => updateField("siteId", e.target.value)}
                disabled={!draft.projectId}
              />
              <TextField
                id="rfq-date"
                label="RFQ Date"
                type="date"
                value={draft.rfqDate}
                onChange={(e) => updateField("rfqDate", e.target.value)}
                error={fieldErrors.rfqDate}
                required
              />
            </div>

            <TextArea
              id="rfq-scope"
              label="Scope of Work"
              rows={4}
              value={draft.scopeOfWork}
              onChange={(e) => updateField("scopeOfWork", e.target.value)}
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField
                id="rfq-execution-timeline"
                label="Execution Timeline"
                placeholder="e.g. 90 days from PO"
                value={draft.executionTimeline}
                onChange={(e) => updateField("executionTimeline", e.target.value)}
              />
              <TextArea
                id="rfq-payment-terms"
                label="Payment Terms"
                rows={2}
                value={draft.paymentTerms}
                onChange={(e) => updateField("paymentTerms", e.target.value)}
              />
            </div>

            <TextArea
              id="rfq-remarks"
              label="Remarks"
              rows={3}
              value={draft.remarks}
              onChange={(e) => updateField("remarks", e.target.value)}
            />
          </div>
        )}

        {step === 1 && <RfqItemsEditor items={items} categories={categories} onChange={setItems} />}

        {step === 2 && (
          <div className="space-y-1.5">
            <p className="block text-sm font-medium text-text-primary">Documents</p>
            <p className="text-xs text-text-secondary">
              Attach the original RFQ document, drawings, specifications or reference BOQ files.
            </p>
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-border bg-background px-4 py-4">
              <FolderIcon className="h-5 w-5 shrink-0 text-text-secondary" />
              <div className="flex-1">
                <p className="text-sm text-text-primary">Document upload — coming soon</p>
                <p className="text-xs text-text-secondary">
                  Document storage isn&apos;t connected yet. Once it is, uploads here attach directly to this RFQ.
                </p>
              </div>
              <button
                type="button"
                disabled
                title="Document storage not connected yet"
                className="shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                Choose File
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Review</h3>
              <p className="mt-0.5 text-xs text-text-secondary">
                Confirm the details below before {mode === "create" ? "submitting" : "saving"} the RFQ.
              </p>
            </div>

            <dl className="grid grid-cols-1 gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Client</dt>
                <dd className="mt-1 text-sm text-text-primary">{clientName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Project</dt>
                <dd className="mt-1 text-sm text-text-primary">{projectName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Site</dt>
                <dd className="mt-1 text-sm text-text-primary">{siteName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">RFQ Date</dt>
                <dd className="mt-1 text-sm text-text-primary">{draft.rfqDate || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Scope of Work</dt>
                <dd className="mt-1 text-sm text-text-primary">{draft.scopeOfWork || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Execution Timeline</dt>
                <dd className="mt-1 text-sm text-text-primary">{draft.executionTimeline || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Payment Terms</dt>
                <dd className="mt-1 text-sm text-text-primary">{draft.paymentTerms || "—"}</dd>
              </div>
            </dl>

            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-2.5">
                <p className="text-sm font-semibold text-text-primary">
                  Items <span className="font-normal text-text-secondary">({formatNumber(lineItemCount, 0)} line item(s))</span>
                </p>
              </div>
              {items.length === 0 ? (
                <p className="px-4 py-4 text-sm text-text-secondary">No items added.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <li key={item.key} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                      <span className={`w-20 shrink-0 ${item.isHeader ? "font-semibold" : "font-medium"} text-text-primary`}>
                        {item.itemCode || "—"}
                      </span>
                      <span className={`flex-1 ${item.isHeader ? "font-semibold" : ""} text-text-primary`}>
                        {item.description || "—"}
                      </span>
                      {!item.isHeader && (
                        <span className="shrink-0 text-text-secondary">
                          {formatNumber(item.quantity, 3)} {item.unit}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border p-6">
        <Link href={backHref} className="text-sm font-medium text-secondary underline-offset-2 hover:underline">
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
              {status === "submitting" ? "Saving…" : mode === "create" ? "Submit RFQ" : "Save Changes"}
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}
