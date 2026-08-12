"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { AlertCircleIcon, FolderIcon } from "@/components/ui/icons";
import type { ClientOption, ProjectOption, SiteOption } from "@/lib/fixtures/commercial-references";

type RfqCreateFormProps = {
  clients: ClientOption[];
  projects: ProjectOption[];
  sites: SiteOption[];
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

const EMPTY_DRAFT: RfqDraft = {
  clientId: "",
  projectId: "",
  siteId: "",
  rfqDate: "",
  scopeOfWork: "",
  executionTimeline: "",
  paymentTerms: "",
  remarks: "",
};

// TEMPORARY — no RFQ backend endpoint exists yet (Module 1 backend not
// built). Replace with a real apiFetch("/rfq", { method: "POST", ... }) call
// once the Express com_rfq endpoint exists. Until then this honestly
// reports the service as unavailable rather than pretending to save the RFQ.
async function submitRfq(draft: RfqDraft): Promise<{ ok: false; kind: "service-unavailable" }> {
  void draft;
  return { ok: false, kind: "service-unavailable" };
}

function validateDraft(draft: RfqDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.clientId) errors.clientId = "Select a client.";
  if (!draft.projectId) errors.projectId = "Select a project.";
  if (!draft.rfqDate) errors.rfqDate = "Enter the RFQ date.";
  return errors;
}

export function RfqCreateForm({ clients, projects, sites }: RfqCreateFormProps) {
  const [draft, setDraft] = useState<RfqDraft>(EMPTY_DRAFT);
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

  function updateField<K extends keyof RfqDraft>(key: K, value: RfqDraft[K]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      // Cascading references — a client/project change invalidates any
      // downstream selection made against the previous parent's options.
      if (key === "clientId") {
        next.projectId = "";
        next.siteId = "";
      }
      if (key === "projectId") next.siteId = "";
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateDraft(draft);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setStatus("submitting");

    const result = await submitRfq(draft);

    setStatus(result.ok === false ? "unavailable" : "idle");
  }

  return (
    <Panel className="bg-surface p-6 lg:p-8">
      <form noValidate onSubmit={handleSubmit} className="space-y-6">
        {status === "unavailable" && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/5 px-3.5 py-3"
          >
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-sm text-text-primary">
              The RFQ service isn&apos;t connected yet — this form is a frontend preview only. Nothing
              was saved.
            </p>
          </div>
        )}

        <div>
          <TextField id="rfq-number" label="RFQ Number" value="Auto-generated on save" disabled />
          <p className="mt-1.5 text-xs text-text-secondary">System-generated once the RFQ is saved.</p>
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
            disabled={status === "submitting"}
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
            disabled={!draft.clientId || status === "submitting"}
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
            disabled={!draft.projectId || status === "submitting"}
          />
          <TextField
            id="rfq-date"
            label="RFQ Date"
            type="date"
            value={draft.rfqDate}
            onChange={(e) => updateField("rfqDate", e.target.value)}
            error={fieldErrors.rfqDate}
            disabled={status === "submitting"}
            required
          />
        </div>

        <TextArea
          id="rfq-scope"
          label="Scope of Work"
          rows={4}
          value={draft.scopeOfWork}
          onChange={(e) => updateField("scopeOfWork", e.target.value)}
          disabled={status === "submitting"}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            id="rfq-execution-timeline"
            label="Execution Timeline"
            placeholder="e.g. 90 days from PO"
            value={draft.executionTimeline}
            onChange={(e) => updateField("executionTimeline", e.target.value)}
            disabled={status === "submitting"}
          />
          <TextArea
            id="rfq-payment-terms"
            label="Payment Terms"
            rows={2}
            value={draft.paymentTerms}
            onChange={(e) => updateField("paymentTerms", e.target.value)}
            disabled={status === "submitting"}
          />
        </div>

        <TextArea
          id="rfq-remarks"
          label="Remarks"
          rows={3}
          value={draft.remarks}
          onChange={(e) => updateField("remarks", e.target.value)}
          disabled={status === "submitting"}
        />

        <div className="space-y-1.5">
          <p className="block text-sm font-medium text-text-primary">Original Document</p>
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-background px-4 py-4">
            <FolderIcon className="h-5 w-5 shrink-0 text-text-secondary" />
            <div className="flex-1">
              <p className="text-sm text-text-primary">Document upload — coming soon</p>
              <p className="text-xs text-text-secondary">
                Original RFQ documents will be attached here once document storage is connected.
              </p>
            </div>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              Choose File
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
          <Link
            href="/commercial/rfq"
            className="text-sm font-medium text-secondary underline-offset-2 hover:underline"
          >
            Cancel
          </Link>
          <Button type="submit" isLoading={status === "submitting"}>
            {status === "submitting" ? "Saving…" : "Save RFQ"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
