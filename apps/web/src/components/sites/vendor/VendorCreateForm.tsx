"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextArea } from "@/components/ui/TextArea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { AlertCircleIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { createVendor } from "@/lib/sites/vendors-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devCreateVendor } from "@/lib/dev-preview/vendor-fixtures";
import type { VndVendorCreateInput, VndVendorStatus, VndVendorType } from "@/types/sites/vendor";

type VendorCreateFormProps = {
  vendorTypes: VndVendorType[];
};

type Draft = {
  vendor_code: string;
  vendor_name: string;
  vendor_type_id: string;
  company_type: string;
  registration_date: string;
  vendor_status: VndVendorStatus;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  website: string;
  gst_number: string;
  pan_number: string;
  gst_registration_type: string;
  msme_status: boolean;
  msme_number: string;
  company_registration_number: string;
  tds_applicable: boolean;
  tds_category: string;
  notes: string;
};

type FieldErrors = Partial<Record<keyof Draft, string>>;

const VENDOR_STATUS_OPTIONS: { value: VndVendorStatus; label: string }[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Under Review", label: "Under Review" },
  { value: "Blacklisted", label: "Blacklisted" },
];

const COMPANY_TYPE_OPTIONS = [
  { value: "Proprietorship", label: "Proprietorship" },
  { value: "Partnership", label: "Partnership" },
  { value: "Pvt Ltd", label: "Pvt Ltd" },
  { value: "LLP", label: "LLP" },
  { value: "Individual", label: "Individual" },
];

const GST_REGISTRATION_TYPE_OPTIONS = [
  { value: "Regular", label: "Regular" },
  { value: "Composition", label: "Composition" },
  { value: "Unregistered", label: "Unregistered" },
];

function emptyDraft(): Draft {
  return {
    vendor_code: "",
    vendor_name: "",
    vendor_type_id: "",
    company_type: "",
    registration_date: "",
    vendor_status: "Active",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    website: "",
    gst_number: "",
    pan_number: "",
    gst_registration_type: "",
    msme_status: false,
    msme_number: "",
    company_registration_number: "",
    tds_applicable: true,
    tds_category: "",
    notes: "",
  };
}

/**
 * Client-side pre-check for the fields the backend requires (per
 * src/validators/vndVendor.validator.js#createVendor). This is a first pass
 * only — the backend's own Joi validation (format, uniqueness) still runs.
 */
function validateDraft(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};

  if (!draft.vendor_code.trim()) errors.vendor_code = "Enter a vendor code.";
  if (!draft.vendor_name.trim()) errors.vendor_name = "Enter the vendor name.";
  if (!draft.vendor_type_id) errors.vendor_type_id = "Select a vendor type.";

  if (!draft.address_line1.trim()) errors.address_line1 = "Enter the address.";
  if (!draft.city.trim()) errors.city = "Enter the city.";
  if (!draft.state.trim()) errors.state = "Enter the state.";
  if (!draft.pincode.trim()) errors.pincode = "Enter the pincode.";

  if (draft.msme_status && !draft.msme_number.trim()) {
    errors.msme_number = "Enter the MSME registration number, or clear the MSME checkbox.";
  }

  return errors;
}

function toCreateInput(draft: Draft): VndVendorCreateInput {
  const input: VndVendorCreateInput = {
    vendor_code: draft.vendor_code.trim(),
    vendor_name: draft.vendor_name.trim(),
    vendor_type_id: draft.vendor_type_id,
    address_line1: draft.address_line1.trim(),
    city: draft.city.trim(),
    state: draft.state.trim(),
    country: draft.country.trim() || "India",
    pincode: draft.pincode.trim(),
    msme_status: draft.msme_status,
    tds_applicable: draft.tds_applicable,
    vendor_status: draft.vendor_status,
  };

  if (draft.company_type) input.company_type = draft.company_type;
  if (draft.registration_date) input.registration_date = draft.registration_date;
  if (draft.address_line2.trim()) input.address_line2 = draft.address_line2.trim();
  if (draft.website.trim()) input.website = draft.website.trim();

  if (draft.gst_number.trim()) input.gst_number = draft.gst_number.trim();
  if (draft.pan_number.trim()) input.pan_number = draft.pan_number.trim();
  if (draft.gst_registration_type) input.gst_registration_type = draft.gst_registration_type;

  if (draft.msme_number.trim()) input.msme_number = draft.msme_number.trim();
  if (draft.company_registration_number.trim()) {
    input.company_registration_number = draft.company_registration_number.trim();
  }
  if (draft.tds_category.trim()) input.tds_category = draft.tds_category.trim();
  if (draft.notes.trim()) input.notes = draft.notes.trim();

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

const sectionHeadingClasses = "text-sm font-semibold text-text-primary";
const gridClasses = "grid grid-cols-1 gap-4 sm:grid-cols-2";

export function VendorCreateForm({ vendorTypes }: VendorCreateFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  const vendorTypeOptions = vendorTypes.map((t) => ({ value: t.vendor_type_id, label: t.type_name }));

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
      // store (vendor-fixtures.ts) — never a real POST /vendors call, never
      // persisted. Same success path (navigate to the new vendor's detail
      // page) so the form's real UX is still fully demonstrable.
      const created = DEV_FIXTURE_MODE
        ? await devCreateVendor(toCreateInput(draft))
        : await createVendor(toCreateInput(draft));
      router.replace(`/sites/vendors/${created.vendor_id}`);
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
          setFormError("Some fields need attention before this vendor can be created.");
        } else if (error.status === 401) {
          router.replace("/login");
          return;
        } else if (error.status === 403) {
          setFormError("Your account doesn't have permission to create vendors. Contact an administrator.");
        } else if (error.status === 409) {
          setFormError(parsed.message);
        } else {
          setFormError("Something went wrong while creating the vendor. Try again, and contact support if the problem continues.");
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
        <h2 className={sectionHeadingClasses}>Vendor Identity</h2>
        <div className={gridClasses}>
          <TextField
            id="vendor_code"
            label="Vendor Code"
            placeholder="VEN-0042"
            value={draft.vendor_code}
            onChange={(e) => setField("vendor_code", e.target.value)}
            error={fieldErrors.vendor_code}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="vendor_name"
            label="Vendor Name"
            placeholder="Registered/trade name"
            value={draft.vendor_name}
            onChange={(e) => setField("vendor_name", e.target.value)}
            error={fieldErrors.vendor_name}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="vendor_type_id"
            label="Vendor Type"
            placeholder="Select a vendor type"
            options={vendorTypeOptions}
            value={draft.vendor_type_id}
            onChange={(e) => setField("vendor_type_id", e.target.value)}
            error={fieldErrors.vendor_type_id}
            disabled={status === "submitting"}
            required
          />
          <Select
            id="company_type"
            label="Company Type"
            placeholder="Select a company type (optional)"
            options={COMPANY_TYPE_OPTIONS}
            value={draft.company_type}
            onChange={(e) => setField("company_type", e.target.value)}
            error={fieldErrors.company_type}
            disabled={status === "submitting"}
          />
          <TextField
            id="registration_date"
            label="Registration Date"
            type="date"
            value={draft.registration_date}
            onChange={(e) => setField("registration_date", e.target.value)}
            error={fieldErrors.registration_date}
            disabled={status === "submitting"}
          />
          <Select
            id="vendor_status"
            label="Vendor Status"
            options={VENDOR_STATUS_OPTIONS}
            value={draft.vendor_status}
            onChange={(e) => setField("vendor_status", e.target.value as VndVendorStatus)}
            error={fieldErrors.vendor_status}
            disabled={status === "submitting"}
          />
        </div>
      </Panel>

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Statutory Details</h2>
        <div className={gridClasses}>
          <TextField
            id="gst_number"
            label="GSTIN"
            placeholder="Optional"
            value={draft.gst_number}
            onChange={(e) => setField("gst_number", e.target.value)}
            error={fieldErrors.gst_number}
            disabled={status === "submitting"}
            maxLength={15}
          />
          <TextField
            id="pan_number"
            label="PAN"
            placeholder="Optional"
            value={draft.pan_number}
            onChange={(e) => setField("pan_number", e.target.value)}
            error={fieldErrors.pan_number}
            disabled={status === "submitting"}
            maxLength={10}
          />
          <Select
            id="gst_registration_type"
            label="GST Registration Type"
            placeholder="Select (optional)"
            options={GST_REGISTRATION_TYPE_OPTIONS}
            value={draft.gst_registration_type}
            onChange={(e) => setField("gst_registration_type", e.target.value)}
            error={fieldErrors.gst_registration_type}
            disabled={status === "submitting"}
          />
          <TextField
            id="company_registration_number"
            label="Company Registration Number"
            placeholder="CIN or equivalent (optional)"
            value={draft.company_registration_number}
            onChange={(e) => setField("company_registration_number", e.target.value)}
            error={fieldErrors.company_registration_number}
            disabled={status === "submitting"}
          />
          <TextField
            id="tds_category"
            label="TDS Category"
            placeholder="Optional"
            value={draft.tds_category}
            onChange={(e) => setField("tds_category", e.target.value)}
            error={fieldErrors.tds_category}
            disabled={status === "submitting"}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
          <Checkbox
            id="tds_applicable"
            label="TDS applicable"
            checked={draft.tds_applicable}
            onChange={(e) => setField("tds_applicable", e.target.checked)}
            disabled={status === "submitting"}
          />
          <Checkbox
            id="msme_status"
            label="Registered under MSME"
            checked={draft.msme_status}
            onChange={(e) => setField("msme_status", e.target.checked)}
            disabled={status === "submitting"}
          />
        </div>
        {draft.msme_status && (
          <TextField
            id="msme_number"
            label="MSME Number"
            placeholder="UDYAM registration number"
            value={draft.msme_number}
            onChange={(e) => setField("msme_number", e.target.value)}
            error={fieldErrors.msme_number}
            disabled={status === "submitting"}
            required
          />
        )}
      </Panel>

      <Panel className="space-y-4 bg-surface p-5">
        <h2 className={sectionHeadingClasses}>Address</h2>
        <div className={gridClasses}>
          <TextField
            id="address_line1"
            label="Address Line 1"
            value={draft.address_line1}
            onChange={(e) => setField("address_line1", e.target.value)}
            error={fieldErrors.address_line1}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="address_line2"
            label="Address Line 2"
            placeholder="Optional"
            value={draft.address_line2}
            onChange={(e) => setField("address_line2", e.target.value)}
            error={fieldErrors.address_line2}
            disabled={status === "submitting"}
          />
          <TextField
            id="city"
            label="City"
            value={draft.city}
            onChange={(e) => setField("city", e.target.value)}
            error={fieldErrors.city}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="state"
            label="State"
            value={draft.state}
            onChange={(e) => setField("state", e.target.value)}
            error={fieldErrors.state}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="country"
            label="Country"
            value={draft.country}
            onChange={(e) => setField("country", e.target.value)}
            error={fieldErrors.country}
            disabled={status === "submitting"}
            required
          />
          <TextField
            id="pincode"
            label="Pincode"
            value={draft.pincode}
            onChange={(e) => setField("pincode", e.target.value)}
            error={fieldErrors.pincode}
            disabled={status === "submitting"}
            required
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
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={status === "submitting"}>
          Cancel
        </Button>
        <Button type="submit" isLoading={status === "submitting"}>
          {status === "submitting" ? "Creating…" : "Create Vendor"}
        </Button>
      </div>
    </form>
  );
}
