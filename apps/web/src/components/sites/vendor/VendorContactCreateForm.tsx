"use client";

import { useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import type { VndVendorContactCreateInput } from "@/types/sites/vendor-contact";

type Draft = {
  contact_name: string;
  designation: string;
  contact_role: string;
  mobile_number: string;
  alternate_number: string;
  email: string;
  is_primary_contact: boolean;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// contact_role is a low-cardinality free-text field on the backend (per
// architecture doc §6.7 — "rarely queried on its own"), not a lookup table.
// These are the roles the doc itself names as examples.
const CONTACT_ROLE_OPTIONS = [
  { value: "Purchase", label: "Purchase" },
  { value: "Accounts", label: "Accounts" },
  { value: "Dispatch", label: "Dispatch" },
  { value: "Technical", label: "Technical" },
  { value: "General", label: "General" },
];

function emptyDraft(): Draft {
  return {
    contact_name: "",
    designation: "",
    contact_role: "General",
    mobile_number: "",
    alternate_number: "",
    email: "",
    is_primary_contact: false,
  };
}

function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.contact_name.trim()) errors.contact_name = "Enter the contact's name.";
  if (!draft.mobile_number.trim()) errors.mobile_number = "Enter a mobile number.";
  if (draft.email.trim() && !EMAIL_PATTERN.test(draft.email.trim())) errors.email = "Enter a valid email address.";
  return errors;
}

function toCreateInput(draft: Draft): VndVendorContactCreateInput {
  const input: VndVendorContactCreateInput = {
    contact_name: draft.contact_name.trim(),
    contact_role: draft.contact_role,
    mobile_number: draft.mobile_number.trim(),
    is_primary_contact: draft.is_primary_contact,
    is_active: true,
  };
  if (draft.designation.trim()) input.designation = draft.designation.trim();
  if (draft.alternate_number.trim()) input.alternate_number = draft.alternate_number.trim();
  if (draft.email.trim()) input.email = draft.email.trim();
  return input;
}

function parseApiError(error: ApiError): { message: string; code?: string; details?: { field: string; message: string }[] } {
  try {
    const body = JSON.parse(error.message);
    return { message: body.message ?? error.message, code: body.code, details: body.details };
  } catch {
    return { message: error.message || "Something went wrong." };
  }
}

type VendorContactCreateFormProps = {
  onSubmit: (input: VndVendorContactCreateInput) => Promise<void>;
  onCancel: () => void;
};

export function VendorContactCreateForm({ onSubmit, onCancel }: VendorContactCreateFormProps) {
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
          setFormError("Some fields need attention before this contact can be saved.");
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to add contacts for this vendor.");
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
            id="vendor_contact_name"
            label="Name"
            placeholder="Full name"
            value={draft.contact_name}
            onChange={(e) => setField("contact_name", e.target.value)}
            error={fieldErrors.contact_name}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="vendor_contact_role"
            label="Role"
            options={CONTACT_ROLE_OPTIONS}
            value={draft.contact_role}
            onChange={(e) => setField("contact_role", e.target.value)}
            error={fieldErrors.contact_role}
            disabled={status === "submitting"}
          />
          <TextField
            id="vendor_contact_designation"
            label="Designation"
            placeholder="Optional"
            value={draft.designation}
            onChange={(e) => setField("designation", e.target.value)}
            error={fieldErrors.designation}
            disabled={status === "submitting"}
          />
          <TextField
            id="vendor_contact_mobile"
            label="Mobile Number"
            type="tel"
            value={draft.mobile_number}
            onChange={(e) => setField("mobile_number", e.target.value)}
            error={fieldErrors.mobile_number}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="vendor_contact_alternate"
            label="Alternate Number"
            type="tel"
            placeholder="Optional"
            value={draft.alternate_number}
            onChange={(e) => setField("alternate_number", e.target.value)}
            error={fieldErrors.alternate_number}
            disabled={status === "submitting"}
          />
          <TextField
            id="vendor_contact_email"
            label="Email"
            type="email"
            placeholder="Optional"
            value={draft.email}
            onChange={(e) => setField("email", e.target.value)}
            error={fieldErrors.email}
            disabled={status === "submitting"}
          />
        </div>

        <Checkbox
          id="vendor_contact_is_primary"
          label="Primary contact for this vendor"
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
