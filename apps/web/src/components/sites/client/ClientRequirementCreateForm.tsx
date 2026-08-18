"use client";

import { useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import type { ClmClientRequirementCreateInput, ClmRequirementPriority } from "@/types/sites/requirement";

type Draft = {
  requirement_number: string;
  requirement_title: string;
  requirement_description: string;
  received_date: string;
  required_completion_date: string;
  priority: ClmRequirementPriority;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

const PRIORITY_OPTIONS: { value: ClmRequirementPriority; label: string }[] = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

function emptyDraft(): Draft {
  return {
    requirement_number: "",
    requirement_title: "",
    requirement_description: "",
    received_date: "",
    required_completion_date: "",
    priority: "Medium",
  };
}

function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.requirement_number.trim()) errors.requirement_number = "Enter a requirement number.";
  if (!draft.requirement_title.trim()) errors.requirement_title = "Enter a title for this requirement.";
  if (!draft.received_date) errors.received_date = "Enter the date this requirement was received.";
  return errors;
}

function toCreateInput(draft: Draft): ClmClientRequirementCreateInput {
  const input: ClmClientRequirementCreateInput = {
    requirement_number: draft.requirement_number.trim(),
    requirement_title: draft.requirement_title.trim(),
    received_date: draft.received_date,
    priority: draft.priority,
  };
  if (draft.requirement_description.trim()) input.requirement_description = draft.requirement_description.trim();
  if (draft.required_completion_date) input.required_completion_date = draft.required_completion_date;
  return input;
}

/** Parses the backend's JSON error envelope, same pattern as ClientCreateForm. */
function parseApiError(error: ApiError): { message: string; code?: string; details?: { field: string; message: string }[] } {
  try {
    const body = JSON.parse(error.message);
    return { message: body.message ?? error.message, code: body.code, details: body.details };
  } catch {
    return { message: error.message || "Something went wrong." };
  }
}

type ClientRequirementCreateFormProps = {
  onSubmit: (input: ClmClientRequirementCreateInput) => Promise<void>;
  onCancel: () => void;
};

export function ClientRequirementCreateForm({ onSubmit, onCancel }: ClientRequirementCreateFormProps) {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const errors = validateDraft(draft);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setStatus("submitting");
    try {
      await onSubmit(toCreateInput(draft));
    } catch (error) {
      if (error instanceof ApiError) {
        const parsed = parseApiError(error);
        if (error.status === 400 && parsed.code === "VALIDATION_ERROR" && parsed.details) {
          const nextFieldErrors: FieldErrors = {};
          for (const detail of parsed.details) {
            if (detail.field in draft) nextFieldErrors[detail.field as keyof Draft] = detail.message;
          }
          setFieldErrors(nextFieldErrors);
          setFormError("Some fields need attention before this requirement can be saved.");
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to add requirements for this client.");
        } else if (error.status === 409) {
          setFormError(parsed.message);
        } else {
          setFormError("Something went wrong while saving this requirement. Try again.");
        }
      } else {
        setFormError("Couldn't reach the server. Check your connection and try again.");
      }
      setStatus("idle");
    }
  }

  return (
    <Panel className="border-t-0 bg-background/40">
      <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-3.5 py-3">
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-sm text-text-primary">{formError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="requirement_number"
            label="Requirement Number"
            placeholder="REQ-2026-0011"
            value={draft.requirement_number}
            onChange={(e) => setField("requirement_number", e.target.value)}
            error={fieldErrors.requirement_number}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="priority"
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={draft.priority}
            onChange={(e) => setField("priority", e.target.value as ClmRequirementPriority)}
            error={fieldErrors.priority}
            disabled={status === "submitting"}
          />
          <TextField
            id="requirement_title"
            label="Title"
            placeholder="Short summary of what the client needs"
            value={draft.requirement_title}
            onChange={(e) => setField("requirement_title", e.target.value)}
            error={fieldErrors.requirement_title}
            disabled={status === "submitting"}
            className="sm:col-span-2"
            required
          />
          <TextField
            id="received_date"
            label="Received Date"
            type="date"
            value={draft.received_date}
            onChange={(e) => setField("received_date", e.target.value)}
            error={fieldErrors.received_date}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="required_completion_date"
            label="Required Completion Date"
            type="date"
            placeholder="Optional"
            value={draft.required_completion_date}
            onChange={(e) => setField("required_completion_date", e.target.value)}
            error={fieldErrors.required_completion_date}
            disabled={status === "submitting"}
          />
        </div>

        <TextArea
          id="requirement_description"
          label="Description"
          placeholder="Optional"
          value={draft.requirement_description}
          onChange={(e) => setField("requirement_description", e.target.value)}
          error={fieldErrors.requirement_description}
          disabled={status === "submitting"}
          rows={3}
        />

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={status === "submitting"}>
            Cancel
          </Button>
          <Button type="submit" isLoading={status === "submitting"}>
            {status === "submitting" ? "Saving…" : "Add Requirement"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
