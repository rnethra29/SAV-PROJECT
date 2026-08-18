"use client";

import { useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import type { ClmClientContactCreateInput, ClmContactType } from "@/types/sites/contact";

type Draft = {
  contact_name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  alternate_phone: string;
  contact_type_id: string;
  is_primary_contact: boolean;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emptyDraft(): Draft {
  return {
    contact_name: "",
    designation: "",
    department: "",
    email: "",
    phone: "",
    alternate_phone: "",
    contact_type_id: "",
    is_primary_contact: false,
  };
}

function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.contact_name.trim()) errors.contact_name = "Enter the contact's name.";
  if (!draft.contact_type_id) errors.contact_type_id = "Select a contact type.";
  if (draft.email.trim() && !EMAIL_PATTERN.test(draft.email.trim())) errors.email = "Enter a valid email address.";
  return errors;
}

function toCreateInput(draft: Draft): ClmClientContactCreateInput {
  const input: ClmClientContactCreateInput = {
    contact_name: draft.contact_name.trim(),
    contact_type_id: draft.contact_type_id,
    is_primary_contact: draft.is_primary_contact,
  };
  if (draft.designation.trim()) input.designation = draft.designation.trim();
  if (draft.department.trim()) input.department = draft.department.trim();
  if (draft.email.trim()) input.email = draft.email.trim();
  if (draft.phone.trim()) input.phone = draft.phone.trim();
  if (draft.alternate_phone.trim()) input.alternate_phone = draft.alternate_phone.trim();
  return input;
}

/** Parses the backend's JSON error envelope, same pattern as ClientRequirementCreateForm. */
function parseApiError(error: ApiError): { message: string; code?: string; details?: { field: string; message: string }[] } {
  try {
    const body = JSON.parse(error.message);
    return { message: body.message ?? error.message, code: body.code, details: body.details };
  } catch {
    return { message: error.message || "Something went wrong." };
  }
}

type ClientContactCreateFormProps = {
  contactTypes: ClmContactType[];
  onSubmit: (input: ClmClientContactCreateInput) => Promise<void>;
  onCancel: () => void;
};

export function ClientContactCreateForm({ contactTypes, onSubmit, onCancel }: ClientContactCreateFormProps) {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  const contactTypeOptions = contactTypes.map((type) => ({ value: type.contact_type_id, label: type.type_name }));

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
          setFormError("Some fields need attention before this contact can be saved.");
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to add contacts for this client.");
        } else if (error.status === 409) {
          setFormError(parsed.message);
        } else {
          setFormError("Something went wrong while saving this contact. Try again.");
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
            id="contact_name"
            label="Name"
            placeholder="Full name"
            value={draft.contact_name}
            onChange={(e) => setField("contact_name", e.target.value)}
            error={fieldErrors.contact_name}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="contact_type_id"
            label="Contact Type"
            placeholder="Select a type"
            options={contactTypeOptions}
            value={draft.contact_type_id}
            onChange={(e) => setField("contact_type_id", e.target.value)}
            error={fieldErrors.contact_type_id}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="designation"
            label="Designation"
            placeholder="Optional"
            value={draft.designation}
            onChange={(e) => setField("designation", e.target.value)}
            error={fieldErrors.designation}
            disabled={status === "submitting"}
          />
          <TextField
            id="department"
            label="Department"
            placeholder="Optional"
            value={draft.department}
            onChange={(e) => setField("department", e.target.value)}
            error={fieldErrors.department}
            disabled={status === "submitting"}
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            placeholder="Optional"
            value={draft.email}
            onChange={(e) => setField("email", e.target.value)}
            error={fieldErrors.email}
            disabled={status === "submitting"}
          />
          <TextField
            id="phone"
            label="Phone"
            type="tel"
            placeholder="Optional"
            value={draft.phone}
            onChange={(e) => setField("phone", e.target.value)}
            error={fieldErrors.phone}
            disabled={status === "submitting"}
          />
          <TextField
            id="alternate_phone"
            label="Alternate Phone"
            type="tel"
            placeholder="Optional"
            value={draft.alternate_phone}
            onChange={(e) => setField("alternate_phone", e.target.value)}
            error={fieldErrors.alternate_phone}
            disabled={status === "submitting"}
          />
        </div>

        <Checkbox
          id="is_primary_contact"
          label="Primary contact for this contact type"
          checked={draft.is_primary_contact}
          onChange={(e) => setField("is_primary_contact", e.target.checked)}
          disabled={status === "submitting"}
        />

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={status === "submitting"}>
            Cancel
          </Button>
          <Button type="submit" isLoading={status === "submitting"}>
            {status === "submitting" ? "Saving…" : "Add Contact"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
