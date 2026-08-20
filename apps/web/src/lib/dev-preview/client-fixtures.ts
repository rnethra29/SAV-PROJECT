/**
 * DEVELOPMENT-ONLY in-memory data layer for Client Management.
 *
 * Lives outside apps/web/src/lib/sites/** (the real data-access layer) on
 * purpose — nothing here is imported by any file unless DEV_FIXTURE_MODE
 * (see dev-mode.ts) is active, and that constant folds to `false` and is
 * dead-code-eliminated in any real `next build`. Every function here
 * mirrors the async signature of its real counterpart in
 * apps/web/src/lib/sites/*-api.ts so Containers can branch between them with
 * a one-line ternary — no apiFetch/network call is ever made from here, and
 * nothing here is ever sent to the real backend or persisted to a database.
 * State lives in module-level variables and resets on a full page reload —
 * this is a demo/browsing aid, not a substitute for real persistence.
 */

import { ApiError } from "@/lib/api-client";
import type {
  ClmClient,
  ClmClientCreateInput,
  ClmClientDetail,
  ClmClientListMeta,
  ClmClientType,
  ClmIndustry,
} from "@/types/sites/client";
import type { ClmClientRequirement, ClmRequirementListMeta } from "@/types/sites/requirement";
import type { ClmClientContact, ClmClientContactCreateInput, ClmContactType } from "@/types/sites/contact";
import type { ClmClientBillingOverview } from "@/types/sites/billing";
import type { CommercialDocument } from "@/types/commercial/shared";
import type { DocumentCategory } from "@/types/sites/document";

function resolved<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

// ---------------------------------------------------------------------------
// Static lookups — same shape/fields as the real GET /client-lookups/* and
// GET /lookups/document-categories responses.
// ---------------------------------------------------------------------------

export const previewClientTypes: ClmClientType[] = [
  { client_type_id: "ct-epc", type_name: "EPC Contractor", is_active: true },
  { client_type_id: "ct-developer", type_name: "Developer", is_active: true },
  { client_type_id: "ct-oem", type_name: "OEM", is_active: true },
];

export const previewIndustries: ClmIndustry[] = [
  { industry_id: "ind-wind", industry_name: "Wind Energy", is_active: true },
  { industry_id: "ind-solar", industry_name: "Solar Energy", is_active: true },
  { industry_id: "ind-substation", industry_name: "Power Transmission", is_active: true },
];

export const previewContactTypes: ClmContactType[] = [
  { contact_type_id: "ct-procurement", type_name: "Procurement", is_active: true },
  { contact_type_id: "ct-site", type_name: "Site Engineering", is_active: true },
];

export const previewDocumentCategories: DocumentCategory[] = [
  { document_category_id: "cat-agreement", category_name: "Agreement", is_active: true },
  { document_category_id: "cat-gst", category_name: "Statutory / Tax", is_active: true },
  { document_category_id: "cat-other", category_name: "Other", is_active: true },
];

// ---------------------------------------------------------------------------
// Mutable in-memory stores, seeded with realistic clm_client-shaped data.
// ---------------------------------------------------------------------------

export const PREVIEW_CLIENT_ID = "dev-client-suzlon";

let clientStore: ClmClientDetail[] = [
  {
    client_id: PREVIEW_CLIENT_ID,
    client_code: "CLI-0001",
    legal_name: "Suzlon Energy Limited",
    display_name: "Suzlon Energy Ltd.",
    client_status: "Active",
    primary_email: "procurement@suzlon-preview.example",
    primary_phone: "+91 98200 00001",
    created_at: "2026-01-10T09:00:00.000Z",
    client_type_id: "ct-epc",
    industry_id: "ind-wind",
    gstin: "27AAAPL1234C1ZV",
    pan: "AAAPL1234C",
    registration_number: "U40106MH2001PLC130485",
    billing_address_line1: "5th Floor, One Earth",
    billing_address_line2: "Hadapsar",
    billing_city: "Pune",
    billing_state: "Maharashtra",
    billing_country: "India",
    billing_pincode: "411028",
    registered_address_line1: "5th Floor, One Earth",
    registered_address_line2: null,
    registered_city: "Pune",
    registered_state: "Maharashtra",
    registered_country: "India",
    registered_pincode: "411028",
    site_office_address_line1: "Site Office, WTG Yard A",
    site_office_city: "Kutch",
    site_office_state: "Gujarat",
    secondary_email: null,
    secondary_phone: null,
    website: "https://suzlon-preview.example",
    payment_terms: "30% advance, 60% on delivery, 10% on completion",
    credit_terms: "Net 30",
    credit_limit_amount: "5000000",
    onboarding_date: "2026-01-10",
    notes: "Development fixture — not a real client record.",
  },
  {
    client_id: "dev-client-orient-green",
    client_code: "CLI-0002",
    legal_name: "Orient Green Power Company Limited",
    display_name: "Orient Green Power",
    client_status: "Active",
    primary_email: "contracts@orientgreen-preview.example",
    primary_phone: "+91 98200 00002",
    created_at: "2025-11-02T10:00:00.000Z",
    client_type_id: "ct-developer",
    industry_id: "ind-substation",
    gstin: null,
    pan: null,
    registration_number: null,
    billing_address_line1: "Cenotaph Road, Teynampet",
    billing_address_line2: null,
    billing_city: "Chennai",
    billing_state: "Tamil Nadu",
    billing_country: "India",
    billing_pincode: "600018",
    registered_address_line1: null,
    registered_address_line2: null,
    registered_city: null,
    registered_state: null,
    registered_country: null,
    registered_pincode: null,
    site_office_address_line1: null,
    site_office_city: null,
    site_office_state: null,
    secondary_email: null,
    secondary_phone: null,
    website: null,
    payment_terms: "As per PO terms",
    credit_terms: null,
    credit_limit_amount: null,
    onboarding_date: "2025-11-02",
    notes: null,
  },
  {
    client_id: "dev-client-inox-wind",
    client_code: "CLI-0003",
    legal_name: "Inox Wind Limited",
    display_name: "Inox Wind Ltd.",
    client_status: "Prospect",
    primary_email: "bd@inoxwind-preview.example",
    primary_phone: "+91 98200 00003",
    created_at: "2026-02-01T08:30:00.000Z",
    client_type_id: "ct-oem",
    industry_id: "ind-wind",
    gstin: null,
    pan: null,
    registration_number: null,
    billing_address_line1: "Plot No. 1, Sector 16A",
    billing_address_line2: null,
    billing_city: "Noida",
    billing_state: "Uttar Pradesh",
    billing_country: "India",
    billing_pincode: "201301",
    registered_address_line1: null,
    registered_address_line2: null,
    registered_city: null,
    registered_state: null,
    registered_country: null,
    registered_pincode: null,
    site_office_address_line1: null,
    site_office_city: null,
    site_office_state: null,
    secondary_email: null,
    secondary_phone: null,
    website: null,
    payment_terms: null,
    credit_terms: null,
    credit_limit_amount: null,
    onboarding_date: null,
    notes: null,
  },
];

const requirementsStore: Record<string, ClmClientRequirement[]> = {
  [PREVIEW_CLIENT_ID]: [
    {
      requirement_id: "dev-req-1",
      requirement_number: "REQ-2026-0011",
      client_id: PREVIEW_CLIENT_ID,
      project_id: null,
      requirement_title: "Foundation works — 3.15MW WTG (Site A)",
      requirement_description: "Earthwork, concrete and allied civil works per attached BOQ format.",
      received_date: "2026-01-12",
      required_completion_date: "2026-04-15",
      priority: "High",
      requirement_status: "Converted to RFQ",
      assigned_employee_id: null,
      notes: null,
      created_at: "2026-01-12T09:00:00.000Z",
    },
    {
      requirement_id: "dev-req-2",
      requirement_number: "REQ-2026-0018",
      client_id: PREVIEW_CLIENT_ID,
      project_id: null,
      requirement_title: "Internal road works — Site A",
      requirement_description: null,
      received_date: "2026-02-02",
      required_completion_date: null,
      priority: "Medium",
      requirement_status: "New",
      assigned_employee_id: null,
      notes: null,
      created_at: "2026-02-02T09:00:00.000Z",
    },
  ],
};

const contactsStore: Record<string, ClmClientContact[]> = {
  [PREVIEW_CLIENT_ID]: [
    {
      contact_id: "dev-contact-1",
      client_id: PREVIEW_CLIENT_ID,
      contact_name: "Ramesh Iyer",
      designation: "Procurement Manager",
      department: "Procurement",
      email: "ramesh.iyer@suzlon-preview.example",
      phone: "+91 98200 11111",
      alternate_phone: null,
      contact_type_id: "ct-procurement",
      is_primary_contact: true,
      is_active: true,
      notes: null,
      created_at: "2026-01-10T09:15:00.000Z",
    },
    {
      contact_id: "dev-contact-2",
      client_id: PREVIEW_CLIENT_ID,
      contact_name: "Priya Nair",
      designation: "Site Engineer",
      department: "Site Engineering",
      email: "priya.nair@suzlon-preview.example",
      phone: "+91 98200 22222",
      alternate_phone: null,
      contact_type_id: "ct-site",
      is_primary_contact: false,
      is_active: true,
      notes: null,
      created_at: "2026-01-15T09:15:00.000Z",
    },
  ],
};

const documentsStore: Record<string, CommercialDocument[]> = {
  [PREVIEW_CLIENT_ID]: [
    {
      id: "dev-doc-1",
      entityType: "Client" as CommercialDocument["entityType"],
      entityId: PREVIEW_CLIENT_ID,
      documentCategoryId: "cat-agreement",
      fileName: "Suzlon-MSA-2026.pdf",
      fileType: "pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 482_331,
      storageBucket: "dev-fixture",
      storagePath: "dev-fixture/not-a-real-file",
      versionNo: 1,
      previousVersionId: null,
      status: "active",
      description: "Master service agreement (development fixture).",
      createdAt: "2026-01-10T09:20:00.000Z",
      updatedAt: "2026-01-10T09:20:00.000Z",
    },
    {
      id: "dev-doc-2",
      entityType: "Client" as CommercialDocument["entityType"],
      entityId: PREVIEW_CLIENT_ID,
      documentCategoryId: "cat-gst",
      fileName: "GST-Certificate.pdf",
      fileType: "pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 118_204,
      storageBucket: "dev-fixture",
      storagePath: "dev-fixture/not-a-real-file",
      versionNo: 1,
      previousVersionId: null,
      status: "active",
      description: "GST registration certificate (development fixture).",
      createdAt: "2026-01-11T09:20:00.000Z",
      updatedAt: "2026-01-11T09:20:00.000Z",
    },
  ],
};

const billingByClient: Record<string, ClmClientBillingOverview> = {
  [PREVIEW_CLIENT_ID]: {
    billing_summary: [
      {
        invoice_id: "dev-inv-1",
        invoice_number: "INV-2026-0004",
        client_id: PREVIEW_CLIENT_ID,
        net_amount: "1250000",
        paid_amount: "750000",
        balance_amount: "500000",
        status: "Partially Paid",
      },
      {
        invoice_id: "dev-inv-2",
        invoice_number: "INV-2026-0009",
        client_id: PREVIEW_CLIENT_ID,
        net_amount: "480000",
        paid_amount: "480000",
        balance_amount: "0",
        status: "Paid",
      },
    ],
    payment_summary: [
      {
        client_id: PREVIEW_CLIENT_ID,
        payment_id: "dev-pay-1",
        payment_reference_number: "PAY-2026-0007",
        amount: "750000",
        payment_date: "2026-02-10",
        verification_status: "Verified",
        allocated_total: "750000",
        unallocated_amount: "0",
      },
    ],
    outstanding: { client_id: PREVIEW_CLIENT_ID, total_outstanding: "500000" },
    financial_summary: {
      client_id: PREVIEW_CLIENT_ID,
      total_po_value: "0",
      total_billed: "1730000",
      total_received: "1230000",
      outstanding: "500000",
    },
  },
};

function emptyBillingOverview(clientId: string): ClmClientBillingOverview {
  return {
    billing_summary: [],
    payment_summary: [],
    outstanding: { client_id: clientId, total_outstanding: 0 },
    financial_summary: null,
  };
}

let nextClientSeq = clientStore.length + 1;
let nextRequirementSeq = 3;
let nextContactSeq = 3;
let nextDocumentSeq = 3;

// ---------------------------------------------------------------------------
// Functions mirroring apps/web/src/lib/sites/clients-api.ts
// ---------------------------------------------------------------------------

export async function devGetClientList(): Promise<{ clients: ClmClient[]; meta: ClmClientListMeta }> {
  return resolved({
    clients: clientStore,
    meta: { page: 1, limit: clientStore.length, total: clientStore.length, totalPages: 1 },
  });
}

export async function devGetClientById(clientId: string): Promise<ClmClientDetail> {
  const found = clientStore.find((client) => client.client_id === clientId);
  if (!found) throw new ApiError(404, "Client not found in the development fixture store.");
  return resolved(found);
}

export async function devCreateClient(input: ClmClientCreateInput): Promise<ClmClientDetail> {
  const client_id = `dev-client-${nextClientSeq++}`;
  const created: ClmClientDetail = {
    client_id,
    client_code: input.client_code,
    legal_name: input.legal_name,
    display_name: input.display_name,
    client_status: input.client_status,
    primary_email: input.primary_email,
    primary_phone: input.primary_phone,
    created_at: new Date().toISOString(),
    client_type_id: input.client_type_id,
    industry_id: input.industry_id ?? null,
    gstin: input.gstin ?? null,
    pan: input.pan ?? null,
    registration_number: input.registration_number ?? null,
    billing_address_line1: input.billing_address_line1,
    billing_address_line2: input.billing_address_line2 ?? null,
    billing_city: input.billing_city,
    billing_state: input.billing_state,
    billing_country: input.billing_country,
    billing_pincode: input.billing_pincode,
    registered_address_line1: input.registered_address_line1 ?? null,
    registered_address_line2: input.registered_address_line2 ?? null,
    registered_city: input.registered_city ?? null,
    registered_state: input.registered_state ?? null,
    registered_country: input.registered_country ?? null,
    registered_pincode: input.registered_pincode ?? null,
    site_office_address_line1: input.site_office_address_line1 ?? null,
    site_office_city: input.site_office_city ?? null,
    site_office_state: input.site_office_state ?? null,
    secondary_email: input.secondary_email ?? null,
    secondary_phone: input.secondary_phone ?? null,
    website: input.website ?? null,
    payment_terms: input.payment_terms ?? null,
    credit_terms: input.credit_terms ?? null,
    credit_limit_amount: input.credit_limit_amount != null ? String(input.credit_limit_amount) : null,
    onboarding_date: input.onboarding_date ?? null,
    notes: input.notes ?? null,
  };
  clientStore = [created, ...clientStore];
  requirementsStore[client_id] = [];
  contactsStore[client_id] = [];
  documentsStore[client_id] = [];
  billingByClient[client_id] = emptyBillingOverview(client_id);
  return resolved(created);
}

export async function devGetClientTypeOptions(): Promise<ClmClientType[]> {
  return resolved(previewClientTypes);
}

export async function devGetIndustryOptions(): Promise<ClmIndustry[]> {
  return resolved(previewIndustries);
}

// ---------------------------------------------------------------------------
// Functions mirroring apps/web/src/lib/sites/client-requirements-api.ts
// ---------------------------------------------------------------------------

export async function devGetClientRequirements(
  clientId: string,
): Promise<{ requirements: ClmClientRequirement[]; meta: ClmRequirementListMeta }> {
  const requirements = requirementsStore[clientId] ?? [];
  return resolved({
    requirements,
    meta: { page: 1, limit: requirements.length || 1, total: requirements.length, totalPages: 1 },
  });
}

export async function devCreateClientRequirement(
  clientId: string,
  input: { requirement_number: string; requirement_title: string; requirement_description?: string; received_date: string; required_completion_date?: string; priority: ClmClientRequirement["priority"] },
): Promise<ClmClientRequirement> {
  const created: ClmClientRequirement = {
    requirement_id: `dev-req-${nextRequirementSeq++}`,
    requirement_number: input.requirement_number,
    client_id: clientId,
    project_id: null,
    requirement_title: input.requirement_title,
    requirement_description: input.requirement_description ?? null,
    received_date: input.received_date,
    required_completion_date: input.required_completion_date ?? null,
    priority: input.priority,
    requirement_status: "New",
    assigned_employee_id: null,
    notes: null,
    created_at: new Date().toISOString(),
  };
  requirementsStore[clientId] = [created, ...(requirementsStore[clientId] ?? [])];
  return resolved(created);
}

// ---------------------------------------------------------------------------
// Functions mirroring apps/web/src/lib/sites/client-contacts-api.ts
// ---------------------------------------------------------------------------

export async function devGetClientContacts(clientId: string): Promise<ClmClientContact[]> {
  return resolved(contactsStore[clientId] ?? []);
}

export async function devGetContactTypeOptions(): Promise<ClmContactType[]> {
  return resolved(previewContactTypes);
}

export async function devCreateClientContact(
  clientId: string,
  input: ClmClientContactCreateInput,
): Promise<ClmClientContact> {
  const created: ClmClientContact = {
    contact_id: `dev-contact-${nextContactSeq++}`,
    client_id: clientId,
    contact_name: input.contact_name,
    designation: input.designation ?? null,
    department: input.department ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    alternate_phone: input.alternate_phone ?? null,
    contact_type_id: input.contact_type_id,
    is_primary_contact: input.is_primary_contact ?? false,
    is_active: input.is_active ?? true,
    notes: input.notes ?? null,
    created_at: new Date().toISOString(),
  };
  contactsStore[clientId] = [created, ...(contactsStore[clientId] ?? [])];
  return resolved(created);
}

// ---------------------------------------------------------------------------
// Functions mirroring apps/web/src/lib/sites/client-documents-api.ts
// ---------------------------------------------------------------------------

export async function devGetClientDocuments(clientId: string): Promise<CommercialDocument[]> {
  return resolved(documentsStore[clientId] ?? []);
}

export async function devGetDocumentCategoryOptions(): Promise<DocumentCategory[]> {
  return resolved(previewDocumentCategories);
}

export async function devUploadClientDocument(
  clientId: string,
  input: { file: File; documentCategoryId: string; description?: string },
): Promise<CommercialDocument> {
  const created: CommercialDocument = {
    id: `dev-doc-${nextDocumentSeq++}`,
    entityType: "Client" as CommercialDocument["entityType"],
    entityId: clientId,
    documentCategoryId: input.documentCategoryId,
    fileName: input.file.name,
    fileType: input.file.name.split(".").pop() || "file",
    mimeType: input.file.type || "application/octet-stream",
    fileSizeBytes: input.file.size,
    storageBucket: "dev-fixture",
    storagePath: "dev-fixture/not-a-real-file",
    versionNo: 1,
    previousVersionId: null,
    status: "active",
    description: input.description ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  documentsStore[clientId] = [created, ...(documentsStore[clientId] ?? [])];
  return resolved(created);
}

/**
 * No real file storage is connected in development fixture mode (per the
 * "do not create fake downloadable files" constraint) — this throws so the
 * caller's existing error handling shows an honest "couldn't generate a
 * download link" state instead of opening a broken/fake URL.
 */
export async function devGetClientDocumentDownloadUrl(): Promise<string> {
  throw new Error("Document download isn't available in development fixture mode — no file storage is connected.");
}

// ---------------------------------------------------------------------------
// Functions mirroring apps/web/src/lib/sites/client-billing-api.ts
// ---------------------------------------------------------------------------

export async function devGetClientBillingOverview(clientId: string): Promise<ClmClientBillingOverview> {
  return resolved(billingByClient[clientId] ?? emptyBillingOverview(clientId));
}
