"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { createClient } from "@/lib/sites/clients-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devCreateClient } from "@/lib/dev-preview/client-fixtures";
import type { ClmClientCreateInput, ClmClientStatus, ClmClientType, ClmIndustry } from "@/types/sites/client";

type ClientCreateFormProps = {
  clientTypes: ClmClientType[];
  industries: ClmIndustry[];
};

type Draft = {
  client_code: string;
  legal_name: string;
  display_name: string;
  client_type_id: string;
  industry_id: string;
  client_status: ClmClientStatus;
  gstin: string;
  pan: string;
  registration_number: string;
  billing_address_line1: string;
  billing_address_line2: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_pincode: string;
  registered_address_line1: string;
  registered_address_line2: string;
  registered_city: string;
  registered_state: string;
  registered_country: string;
  registered_pincode: string;
  site_office_address_line1: string;
  site_office_city: string;
  site_office_state: string;
  primary_email: string;
  secondary_email: string;
  primary_phone: string;
  secondary_phone: string;
  website: string;
  payment_terms: string;
  credit_terms: string;
  credit_limit_amount: string;
  onboarding_date: string;
  notes: string;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

const CLIENT_STATUS_OPTIONS: { value: ClmClientStatus; label: string }[] = [
  { value: "Prospect", label: "Prospect" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Blacklisted", label: "Blacklisted" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emptyDraft(): Draft {
  return {
    client_code: "",
    legal_name: "",
    display_name: "",
    client_type_id: "",
    industry_id: "",
    client_status: "Prospect",
    gstin: "",
    pan: "",
    registration_number: "",
    billing_address_line1: "",
    billing_address_line2: "",
    billing_city: "",
    billing_state: "",
    billing_country: "India",
    billing_pincode: "",
    registered_address_line1: "",
    registered_address_line2: "",
    registered_city: "",
    registered_state: "",
    registered_country: "",
    registered_pincode: "",
    site_office_address_line1: "",
    site_office_city: "",
    site_office_state: "",
    primary_email: "",
    secondary_email: "",
    primary_phone: "",
    secondary_phone: "",
    website: "",
    payment_terms: "",
    credit_terms: "",
    credit_limit_amount: "",
    onboarding_date: "",
    notes: "",
  };
}

/**
 * Client-side pre-check for the fields the backend requires (per
 * src/validators/clmClient.validator.js#createClient). This is a first
 * pass only — the backend's own Joi validation (format, uniqueness) still
 * runs and its errors are surfaced too (see handleSubmit's catch).
 */
function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};

  if (!draft.client_code.trim()) errors.client_code = "Enter a client code.";
  if (!draft.legal_name.trim()) errors.legal_name = "Enter the registered legal name.";
  if (!draft.display_name.trim()) errors.display_name = "Enter a display name.";
  if (!draft.client_type_id) errors.client_type_id = "Select a client type.";

  if (!draft.billing_address_line1.trim()) errors.billing_address_line1 = "Enter the billing address.";
  if (!draft.billing_city.trim()) errors.billing_city = "Enter the billing city.";
  if (!draft.billing_state.trim()) errors.billing_state = "Enter the billing state.";
  if (!draft.billing_pincode.trim()) errors.billing_pincode = "Enter the billing pincode.";

  if (!draft.primary_email.trim()) {
    errors.primary_email = "Enter a primary email address.";
  } else if (!EMAIL_PATTERN.test(draft.primary_email.trim())) {
    errors.primary_email = "Enter a valid email address.";
  }
  if (draft.secondary_email.trim() && !EMAIL_PATTERN.test(draft.secondary_email.trim())) {
    errors.secondary_email = "Enter a valid email address.";
  }
  if (!draft.primary_phone.trim()) errors.primary_phone = "Enter a primary phone number.";

  if (draft.credit_limit_amount.trim() && Number(draft.credit_limit_amount) < 0) {
    errors.credit_limit_amount = "Credit limit cannot be negative.";
  }

  return errors;
}

function toCreateInput(draft: Draft): ClmClientCreateInput {
  const input: ClmClientCreateInput = {
    client_code: draft.client_code.trim(),
    legal_name: draft.legal_name.trim(),
    display_name: draft.display_name.trim(),
    client_type_id: draft.client_type_id,
    billing_address_line1: draft.billing_address_line1.trim(),
    billing_city: draft.billing_city.trim(),
    billing_state: draft.billing_state.trim(),
    billing_country: draft.billing_country.trim() || "India",
    billing_pincode: draft.billing_pincode.trim(),
    primary_email: draft.primary_email.trim(),
    primary_phone: draft.primary_phone.trim(),
    client_status: draft.client_status,
  };

  if (draft.industry_id) input.industry_id = draft.industry_id;
  if (draft.gstin.trim()) input.gstin = draft.gstin.trim();
  if (draft.pan.trim()) input.pan = draft.pan.trim();
  if (draft.registration_number.trim()) input.registration_number = draft.registration_number.trim();
  if (draft.billing_address_line2.trim()) input.billing_address_line2 = draft.billing_address_line2.trim();

  if (draft.registered_address_line1.trim()) input.registered_address_line1 = draft.registered_address_line1.trim();
  if (draft.registered_address_line2.trim()) input.registered_address_line2 = draft.registered_address_line2.trim();
  if (draft.registered_city.trim()) input.registered_city = draft.registered_city.trim();
  if (draft.registered_state.trim()) input.registered_state = draft.registered_state.trim();
  if (draft.registered_country.trim()) input.registered_country = draft.registered_country.trim();
  if (draft.registered_pincode.trim()) input.registered_pincode = draft.registered_pincode.trim();

  if (draft.site_office_address_line1.trim()) input.site_office_address_line1 = draft.site_office_address_line1.trim();
  if (draft.site_office_city.trim()) input.site_office_city = draft.site_office_city.trim();
  if (draft.site_office_state.trim()) input.site_office_state = draft.site_office_state.trim();

  if (draft.secondary_email.trim()) input.secondary_email = draft.secondary_email.trim();
  if (draft.secondary_phone.trim()) input.secondary_phone = draft.secondary_phone.trim();
  if (draft.website.trim()) input.website = draft.website.trim();

  if (draft.payment_terms.trim()) input.payment_terms = draft.payment_terms.trim();
  if (draft.credit_terms.trim()) input.credit_terms = draft.credit_terms.trim();
  if (draft.credit_limit_amount.trim()) input.credit_limit_amount = Number(draft.credit_limit_amount);

  if (draft.onboarding_date) input.onboarding_date = draft.onboarding_date;
  if (draft.notes.trim()) input.notes = draft.notes.trim();

  return input;
}

/**
 * Parses the backend's JSON error envelope (src/middlewares/error.middleware.js
 * `{ success, message, code, details }`) out of ApiError.message, which
 * carries the raw response body text (see api-client.ts). Falls back to the
 * raw text for non-JSON failures (network errors, proxy pages, etc).
 */
function parseApiError(error: ApiError): { message: string; code?: string; details?: { field: string; message: string }[] } {
  try {
    const body = JSON.parse(error.message);
    return { message: body.message ?? error.message, code: body.code, details: body.details };
  } catch {
    return { message: error.message || "Something went wrong." };
  }
}

const sectionHeadingClasses = "text-sm font-semibold text-text-primary";
const gridClasses = "grid grid-cols-1 gap-4 sm:grid-cols-2";

export function ClientCreateForm({ clientTypes, industries }: ClientCreateFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  const clientTypeOptions = clientTypes.map((t) => ({ value: t.client_type_id, label: t.type_name }));
  const industryOptions = industries.map((i) => ({ value: i.industry_id, label: i.industry_name }));

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
      // Development fixture mode: "creates" only update the in-memory dev
      // store (client-fixtures.ts) — never a real POST /clients call, never
      // persisted. Same success path (navigate to the new client's detail
      // page) so the form's real UX is still fully demonstrable.
      const created = DEV_FIXTURE_MODE
        ? await devCreateClient(toCreateInput(draft))
        : await createClient(toCreateInput(draft));
      router.replace(`/sites/clients/${created.client_id}`);
      return;
    } catch (error) {
      if (error instanceof ApiError) {
        const parsed = parseApiError(error);

        if (error.status === 400 && parsed.code === "VALIDATION_ERROR" && parsed.details) {
          const nextFieldErrors: FieldErrors = {};
          for (const detail of parsed.details) {
            if (detail.field in draft) nextFieldErrors[detail.field as keyof Draft] = detail.message;
          }
          setFieldErrors(nextFieldErrors);
          setFormError("Some fields need attention before this client can be created.");
        } else if (error.status === 401) {
          router.replace("/login");
          return;
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to create clients. Contact an administrator.");
        } else if (error.status === 409) {
          setFormError(parsed.message);
        } else {
          setFormError("Something went wrong while creating the client. Try again, and contact support if the problem continues.");
        }
      } else {
        setFormError("Couldn't reach the server. Check your connection and try again.");
      }
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {formError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-3.5 py-3">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm text-text-primary">{formError}</p>
        </div>
      )}

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Client Identity</h2>
        <div className={gridClasses}>
          <TextField
            id="client_code"
            label="Client Code"
            placeholder="CLI-0042"
            value={draft.client_code}
            onChange={(e) => setField("client_code", e.target.value)}
            error={fieldErrors.client_code}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="client_type_id"
            label="Client Type"
            placeholder="Select a client type"
            options={clientTypeOptions}
            value={draft.client_type_id}
            onChange={(e) => setField("client_type_id", e.target.value)}
            error={fieldErrors.client_type_id}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="legal_name"
            label="Legal Name"
            placeholder="Registered legal entity name"
            value={draft.legal_name}
            onChange={(e) => setField("legal_name", e.target.value)}
            error={fieldErrors.legal_name}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="display_name"
            label="Display Name"
            placeholder="Short/trade name used across the app"
            value={draft.display_name}
            onChange={(e) => setField("display_name", e.target.value)}
            error={fieldErrors.display_name}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="industry_id"
            label="Industry"
            placeholder="Select an industry (optional)"
            options={industryOptions}
            value={draft.industry_id}
            onChange={(e) => setField("industry_id", e.target.value)}
            error={fieldErrors.industry_id}
            disabled={status === "submitting"}
          />
          <Select
            id="client_status"
            label="Client Status"
            options={CLIENT_STATUS_OPTIONS}
            value={draft.client_status}
            onChange={(e) => setField("client_status", e.target.value as ClmClientStatus)}
            error={fieldErrors.client_status}
            disabled={status === "submitting"}
          />
        </div>
      </Panel>

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Statutory Details</h2>
        <div className={gridClasses}>
          <TextField
            id="gstin"
            label="GSTIN"
            placeholder="Optional"
            value={draft.gstin}
            onChange={(e) => setField("gstin", e.target.value)}
            error={fieldErrors.gstin}
            disabled={status === "submitting"}
            maxLength={15}
          />
          <TextField
            id="pan"
            label="PAN"
            placeholder="Optional"
            value={draft.pan}
            onChange={(e) => setField("pan", e.target.value)}
            error={fieldErrors.pan}
            disabled={status === "submitting"}
            maxLength={10}
          />
          <TextField
            id="registration_number"
            label="Registration Number"
            placeholder="CIN or equivalent (optional)"
            value={draft.registration_number}
            onChange={(e) => setField("registration_number", e.target.value)}
            error={fieldErrors.registration_number}
            disabled={status === "submitting"}
          />
        </div>
      </Panel>

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Billing Address</h2>
        <div className={gridClasses}>
          <TextField
            id="billing_address_line1"
            label="Address Line 1"
            value={draft.billing_address_line1}
            onChange={(e) => setField("billing_address_line1", e.target.value)}
            error={fieldErrors.billing_address_line1}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="billing_address_line2"
            label="Address Line 2"
            placeholder="Optional"
            value={draft.billing_address_line2}
            onChange={(e) => setField("billing_address_line2", e.target.value)}
            error={fieldErrors.billing_address_line2}
            disabled={status === "submitting"}
          />
          <TextField
            id="billing_city"
            label="City"
            value={draft.billing_city}
            onChange={(e) => setField("billing_city", e.target.value)}
            error={fieldErrors.billing_city}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="billing_state"
            label="State"
            value={draft.billing_state}
            onChange={(e) => setField("billing_state", e.target.value)}
            error={fieldErrors.billing_state}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="billing_country"
            label="Country"
            value={draft.billing_country}
            onChange={(e) => setField("billing_country", e.target.value)}
            error={fieldErrors.billing_country}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="billing_pincode"
            label="Pincode"
            value={draft.billing_pincode}
            onChange={(e) => setField("billing_pincode", e.target.value)}
            error={fieldErrors.billing_pincode}
            disabled={status === "submitting"}
            required
          />
        </div>
      </Panel>

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Registered Address</h2>
        <p className="text-xs text-text-secondary">Optional — leave blank if same as billing address.</p>
        <div className={gridClasses}>
          <TextField
            id="registered_address_line1"
            label="Address Line 1"
            value={draft.registered_address_line1}
            onChange={(e) => setField("registered_address_line1", e.target.value)}
            error={fieldErrors.registered_address_line1}
            disabled={status === "submitting"}
          />
          <TextField
            id="registered_address_line2"
            label="Address Line 2"
            value={draft.registered_address_line2}
            onChange={(e) => setField("registered_address_line2", e.target.value)}
            error={fieldErrors.registered_address_line2}
            disabled={status === "submitting"}
          />
          <TextField
            id="registered_city"
            label="City"
            value={draft.registered_city}
            onChange={(e) => setField("registered_city", e.target.value)}
            error={fieldErrors.registered_city}
            disabled={status === "submitting"}
          />
          <TextField
            id="registered_state"
            label="State"
            value={draft.registered_state}
            onChange={(e) => setField("registered_state", e.target.value)}
            error={fieldErrors.registered_state}
            disabled={status === "submitting"}
          />
          <TextField
            id="registered_country"
            label="Country"
            value={draft.registered_country}
            onChange={(e) => setField("registered_country", e.target.value)}
            error={fieldErrors.registered_country}
            disabled={status === "submitting"}
          />
          <TextField
            id="registered_pincode"
            label="Pincode"
            value={draft.registered_pincode}
            onChange={(e) => setField("registered_pincode", e.target.value)}
            error={fieldErrors.registered_pincode}
            disabled={status === "submitting"}
          />
        </div>
      </Panel>

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Site Office Address</h2>
        <p className="text-xs text-text-secondary">Optional.</p>
        <div className={gridClasses}>
          <TextField
            id="site_office_address_line1"
            label="Address Line 1"
            value={draft.site_office_address_line1}
            onChange={(e) => setField("site_office_address_line1", e.target.value)}
            error={fieldErrors.site_office_address_line1}
            disabled={status === "submitting"}
          />
          <TextField
            id="site_office_city"
            label="City"
            value={draft.site_office_city}
            onChange={(e) => setField("site_office_city", e.target.value)}
            error={fieldErrors.site_office_city}
            disabled={status === "submitting"}
          />
          <TextField
            id="site_office_state"
            label="State"
            value={draft.site_office_state}
            onChange={(e) => setField("site_office_state", e.target.value)}
            error={fieldErrors.site_office_state}
            disabled={status === "submitting"}
          />
        </div>
      </Panel>

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Contact Information</h2>
        <div className={gridClasses}>
          <TextField
            id="primary_email"
            label="Primary Email"
            type="email"
            value={draft.primary_email}
            onChange={(e) => setField("primary_email", e.target.value)}
            error={fieldErrors.primary_email}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="primary_phone"
            label="Primary Phone"
            value={draft.primary_phone}
            onChange={(e) => setField("primary_phone", e.target.value)}
            error={fieldErrors.primary_phone}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="secondary_email"
            label="Secondary Email"
            type="email"
            placeholder="Optional"
            value={draft.secondary_email}
            onChange={(e) => setField("secondary_email", e.target.value)}
            error={fieldErrors.secondary_email}
            disabled={status === "submitting"}
          />
          <TextField
            id="secondary_phone"
            label="Secondary Phone"
            placeholder="Optional"
            value={draft.secondary_phone}
            onChange={(e) => setField("secondary_phone", e.target.value)}
            error={fieldErrors.secondary_phone}
            disabled={status === "submitting"}
          />
          <TextField
            id="website"
            label="Website"
            placeholder="https://example.com"
            value={draft.website}
            onChange={(e) => setField("website", e.target.value)}
            error={fieldErrors.website}
            disabled={status === "submitting"}
          />
        </div>
      </Panel>

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Commercial Terms</h2>
        <div className={gridClasses}>
          <TextField
            id="payment_terms"
            label="Payment Terms"
            placeholder="e.g. 30 days from invoice"
            value={draft.payment_terms}
            onChange={(e) => setField("payment_terms", e.target.value)}
            error={fieldErrors.payment_terms}
            disabled={status === "submitting"}
          />
          <TextField
            id="credit_terms"
            label="Credit Terms"
            placeholder="Optional"
            value={draft.credit_terms}
            onChange={(e) => setField("credit_terms", e.target.value)}
            error={fieldErrors.credit_terms}
            disabled={status === "submitting"}
          />
          <TextField
            id="credit_limit_amount"
            label="Credit Limit Amount"
            type="number"
            min={0}
            placeholder="Optional"
            value={draft.credit_limit_amount}
            onChange={(e) => setField("credit_limit_amount", e.target.value)}
            error={fieldErrors.credit_limit_amount}
            disabled={status === "submitting"}
          />
          <TextField
            id="onboarding_date"
            label="Onboarding Date"
            type="date"
            value={draft.onboarding_date}
            onChange={(e) => setField("onboarding_date", e.target.value)}
            error={fieldErrors.onboarding_date}
            disabled={status === "submitting"}
          />
        </div>
      </Panel>

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Notes</h2>
        <TextArea
          id="notes"
          label="Internal Notes"
          placeholder="Optional"
          value={draft.notes}
          onChange={(e) => setField("notes", e.target.value)}
          error={fieldErrors.notes}
          disabled={status === "submitting"}
          rows={4}
        />
      </Panel>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={status === "submitting"}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={status === "submitting"}>
          {status === "submitting" ? "Creating…" : "Create Client"}
        </Button>
      </div>
    </form>
  );
}
