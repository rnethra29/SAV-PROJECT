/**
 * DEVELOPMENT-ONLY in-memory data layer for Vendor Management. Same
 * reasoning and isolation as client-fixtures.ts: lives outside
 * apps/web/src/lib/sites/** (the real data-access layer), nothing here is
 * imported unless DEV_FIXTURE_MODE (see dev-mode.ts) is active, and every
 * function mirrors the async signature of its real counterpart in
 * apps/web/src/lib/sites/vendor*-api.ts so Containers can branch between
 * them with a one-line ternary. No apiFetch/network call is ever made from
 * here, and nothing here is ever sent to the real backend or persisted to a
 * database. State lives in module-level variables and resets on a full page
 * reload — this is a demo/browsing aid, not a substitute for real
 * persistence.
 */

import { ApiError } from "@/lib/api-client";
import type { VndVendor, VndVendorCreateInput, VndVendorDetail, VndVendorListMeta, VndVendorType } from "@/types/sites/vendor";
import type { VndVendorContact, VndVendorContactCreateInput } from "@/types/sites/vendor-contact";
import type { VndVendorBankAccount, VndVendorBankAccountCreateInput } from "@/types/sites/vendor-bank-account";
import type { VndMaterialCategory, VndMaterialService, VndMaterialServiceCreateInput } from "@/types/sites/material-service";

function resolved<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

// ---------------------------------------------------------------------------
// Static lookups — same shape/fields as the real GET /vendor-lookups/*
// responses (architecture doc §6.4/§6.5).
// ---------------------------------------------------------------------------

export const previewVendorTypes: VndVendorType[] = [
  { vendor_type_id: "vt-material", type_name: "Material Supplier", is_active: true },
  { vendor_type_id: "vt-equipment", type_name: "Equipment Supplier", is_active: true },
  { vendor_type_id: "vt-subcontractor", type_name: "Subcontractor", is_active: true },
  { vendor_type_id: "vt-service", type_name: "Service Provider", is_active: true },
  { vendor_type_id: "vt-transporter", type_name: "Transporter", is_active: true },
];

export const previewMaterialCategories: VndMaterialCategory[] = [
  { material_category_id: "mc-cement", category_name: "Cement & Concrete", is_active: true },
  { material_category_id: "mc-steel", category_name: "Steel & TMT", is_active: true },
  { material_category_id: "mc-equipment", category_name: "Equipment Rental", is_active: true },
];

// ---------------------------------------------------------------------------
// Mutable in-memory stores, seeded with realistic vnd_vendor-shaped data —
// same illustrative story as the architecture doc's own seed data (§17):
// Ultratech Cement Ltd. (Material Supplier) and Apex Equipment Rentals
// (Equipment Supplier), plus a third vendor for list-page variety.
// ---------------------------------------------------------------------------

export const PREVIEW_VENDOR_ID = "dev-vendor-ultratech";

let vendorStore: VndVendorDetail[] = [
  {
    vendor_id: PREVIEW_VENDOR_ID,
    vendor_code: "VEN-0001",
    vendor_name: "Ultratech Cement Ltd.",
    vendor_type_id: "vt-material",
    city: "Mumbai",
    state: "Maharashtra",
    vendor_status: "Active",
    created_at: "2026-01-08T09:00:00.000Z",
    company_type: "Pvt Ltd",
    registration_date: "2015-04-01",
    address_line1: "Ultratech House, B Wing, Ahura Centre",
    address_line2: "Mahakali Caves Road, Andheri East",
    country: "India",
    pincode: "400093",
    website: "https://ultratech-preview.example",
    gst_number: "27AAACU1234D1ZP",
    pan_number: "AAACU1234D",
    gst_registration_type: "Regular",
    msme_status: false,
    msme_number: null,
    company_registration_number: "L26940MH1982PLC028420",
    tds_applicable: true,
    tds_category: "Contractor - Company",
    notes: "Development fixture — not a real vendor record.",
  },
  {
    vendor_id: "dev-vendor-apex",
    vendor_code: "VEN-0002",
    vendor_name: "Apex Equipment Rentals",
    vendor_type_id: "vt-equipment",
    city: "Pune",
    state: "Maharashtra",
    vendor_status: "Active",
    created_at: "2026-01-20T09:00:00.000Z",
    company_type: "Partnership",
    registration_date: "2018-07-15",
    address_line1: "Plot 14, MIDC Industrial Estate",
    address_line2: null,
    country: "India",
    pincode: "411019",
    website: null,
    gst_number: "27AABFA5678E1Z9",
    pan_number: null,
    gst_registration_type: "Regular",
    msme_status: true,
    msme_number: "UDYAM-MH-03-0012345",
    company_registration_number: null,
    tds_applicable: true,
    tds_category: "Contractor - Firm",
    notes: null,
  },
  {
    vendor_id: "dev-vendor-metro",
    vendor_code: "VEN-0003",
    vendor_name: "Metro Transport Services",
    vendor_type_id: "vt-transporter",
    city: "Chennai",
    state: "Tamil Nadu",
    vendor_status: "Under Review",
    created_at: "2026-02-05T09:00:00.000Z",
    company_type: "Proprietorship",
    registration_date: null,
    address_line1: "No. 22, GST Road",
    address_line2: "Guindy",
    country: "India",
    pincode: "600032",
    website: null,
    gst_number: null,
    pan_number: null,
    gst_registration_type: "Unregistered",
    msme_status: false,
    msme_number: null,
    company_registration_number: null,
    tds_applicable: false,
    tds_category: null,
    notes: "Awaiting document verification before activation.",
  },
];

const contactsStore: Record<string, VndVendorContact[]> = {
  [PREVIEW_VENDOR_ID]: [
    {
      vendor_contact_id: "dev-vcontact-1",
      vendor_id: PREVIEW_VENDOR_ID,
      contact_name: "Rakesh Malhotra",
      designation: "Regional Sales Manager",
      contact_role: "Purchase",
      mobile_number: "+91 98200 33333",
      alternate_number: null,
      email: "rakesh.malhotra@ultratech-preview.example",
      is_primary_contact: true,
      is_active: true,
      created_at: "2026-01-08T09:15:00.000Z",
    },
    {
      vendor_contact_id: "dev-vcontact-2",
      vendor_id: PREVIEW_VENDOR_ID,
      contact_name: "Sunita Rao",
      designation: "Accounts Executive",
      contact_role: "Accounts",
      mobile_number: "+91 98200 44444",
      alternate_number: null,
      email: "sunita.rao@ultratech-preview.example",
      is_primary_contact: false,
      is_active: true,
      created_at: "2026-01-09T09:15:00.000Z",
    },
  ],
};

const bankAccountsStore: Record<string, VndVendorBankAccount[]> = {
  [PREVIEW_VENDOR_ID]: [
    {
      bank_account_id: "dev-vbank-1",
      vendor_id: PREVIEW_VENDOR_ID,
      account_holder_name: "Ultratech Cement Ltd.",
      bank_name: "HDFC Bank",
      account_number: "XXXXXXXX4821",
      ifsc_code: "HDFC0001234",
      branch: "Andheri East, Mumbai",
      account_type: "Current",
      upi_id: null,
      is_primary: true,
      is_verified: true,
      verified_at: "2026-01-09T10:00:00.000Z",
    },
  ],
};

const materialsStore: Record<string, VndMaterialService[]> = {
  [PREVIEW_VENDOR_ID]: [
    {
      material_service_id: "dev-vmat-1",
      vendor_id: PREVIEW_VENDOR_ID,
      material_category_id: "mc-cement",
      item_name: "OPC 53 Grade Cement",
      description: "Ordinary Portland Cement, 53 grade, 50kg bags.",
      unit: "Bag",
      standard_rate: "410.0000",
      tax_rate: "28.00",
      minimum_order_quantity: "500.000",
      delivery_time_days: 5,
      is_active: true,
    },
    {
      material_service_id: "dev-vmat-2",
      vendor_id: PREVIEW_VENDOR_ID,
      material_category_id: "mc-steel",
      item_name: "TMT Bar Fe 500D — 12mm",
      description: "Thermo-mechanically treated reinforcement bar.",
      unit: "MT",
      standard_rate: "62500.0000",
      tax_rate: "18.00",
      minimum_order_quantity: "5.000",
      delivery_time_days: 10,
      is_active: true,
    },
  ],
};

let nextVendorSeq = vendorStore.length + 1;
let nextContactSeq = 3;
let nextBankAccountSeq = 2;
let nextMaterialSeq = 3;

// ---------------------------------------------------------------------------
// Functions mirroring apps/web/src/lib/sites/vendors-api.ts
// ---------------------------------------------------------------------------

export async function devGetVendorList(): Promise<{ vendors: VndVendor[]; meta: VndVendorListMeta }> {
  return resolved({
    vendors: vendorStore,
    meta: { page: 1, limit: vendorStore.length, total: vendorStore.length, totalPages: 1 },
  });
}

export async function devGetVendorById(vendorId: string): Promise<VndVendorDetail> {
  const found = vendorStore.find((vendor) => vendor.vendor_id === vendorId);
  if (!found) throw new ApiError(404, "Vendor not found in the development fixture store.");
  return resolved(found);
}

export async function devCreateVendor(input: VndVendorCreateInput): Promise<VndVendorDetail> {
  const vendor_id = `dev-vendor-${nextVendorSeq++}`;
  const created: VndVendorDetail = {
    vendor_id,
    vendor_code: input.vendor_code,
    vendor_name: input.vendor_name,
    vendor_type_id: input.vendor_type_id,
    city: input.city,
    state: input.state,
    vendor_status: input.vendor_status,
    created_at: new Date().toISOString(),
    company_type: input.company_type ?? null,
    registration_date: input.registration_date ?? null,
    address_line1: input.address_line1,
    address_line2: input.address_line2 ?? null,
    country: input.country || "India",
    pincode: input.pincode,
    website: input.website ?? null,
    gst_number: input.gst_number ?? null,
    pan_number: input.pan_number ?? null,
    gst_registration_type: input.gst_registration_type ?? null,
    msme_status: input.msme_status,
    msme_number: input.msme_number ?? null,
    company_registration_number: input.company_registration_number ?? null,
    tds_applicable: input.tds_applicable,
    tds_category: input.tds_category ?? null,
    notes: input.notes ?? null,
  };
  vendorStore = [created, ...vendorStore];
  contactsStore[vendor_id] = [];
  bankAccountsStore[vendor_id] = [];
  materialsStore[vendor_id] = [];
  return resolved(created);
}

export async function devGetVendorTypeOptions(): Promise<VndVendorType[]> {
  return resolved(previewVendorTypes);
}

// ---------------------------------------------------------------------------
// Functions mirroring apps/web/src/lib/sites/vendor-contacts-api.ts
// ---------------------------------------------------------------------------

export async function devGetVendorContacts(vendorId: string): Promise<VndVendorContact[]> {
  return resolved(contactsStore[vendorId] ?? []);
}

export async function devCreateVendorContact(
  vendorId: string,
  input: VndVendorContactCreateInput,
): Promise<VndVendorContact> {
  const created: VndVendorContact = {
    vendor_contact_id: `dev-vcontact-${nextContactSeq++}`,
    vendor_id: vendorId,
    contact_name: input.contact_name,
    designation: input.designation ?? null,
    contact_role: input.contact_role,
    mobile_number: input.mobile_number,
    alternate_number: input.alternate_number ?? null,
    email: input.email ?? null,
    is_primary_contact: input.is_primary_contact,
    is_active: input.is_active,
    created_at: new Date().toISOString(),
  };
  contactsStore[vendorId] = [created, ...(contactsStore[vendorId] ?? [])];
  return resolved(created);
}

// ---------------------------------------------------------------------------
// Functions mirroring apps/web/src/lib/sites/vendor-bank-accounts-api.ts
// ---------------------------------------------------------------------------

export async function devGetVendorBankAccounts(vendorId: string): Promise<VndVendorBankAccount[]> {
  return resolved(bankAccountsStore[vendorId] ?? []);
}

export async function devCreateVendorBankAccount(
  vendorId: string,
  input: VndVendorBankAccountCreateInput,
): Promise<VndVendorBankAccount> {
  const created: VndVendorBankAccount = {
    bank_account_id: `dev-vbank-${nextBankAccountSeq++}`,
    vendor_id: vendorId,
    account_holder_name: input.account_holder_name,
    bank_name: input.bank_name,
    // Masked the same way the real list endpoint masks it (doc §20) — the
    // fixture never holds a real account number to begin with.
    account_number: `XXXXXXXX${input.account_number.slice(-4)}`,
    ifsc_code: input.ifsc_code,
    branch: input.branch ?? null,
    account_type: input.account_type ?? null,
    upi_id: input.upi_id ?? null,
    is_primary: input.is_primary,
    is_verified: false,
    verified_at: null,
  };
  bankAccountsStore[vendorId] = [created, ...(bankAccountsStore[vendorId] ?? [])];
  return resolved(created);
}

// ---------------------------------------------------------------------------
// Functions mirroring apps/web/src/lib/sites/vendor-materials-api.ts
// ---------------------------------------------------------------------------

export async function devGetVendorMaterials(vendorId: string): Promise<VndMaterialService[]> {
  return resolved(materialsStore[vendorId] ?? []);
}

export async function devCreateVendorMaterial(
  vendorId: string,
  input: VndMaterialServiceCreateInput,
): Promise<VndMaterialService> {
  const created: VndMaterialService = {
    material_service_id: `dev-vmat-${nextMaterialSeq++}`,
    vendor_id: vendorId,
    material_category_id: input.material_category_id ?? null,
    item_name: input.item_name,
    description: input.description ?? null,
    unit: input.unit,
    standard_rate: input.standard_rate != null ? String(input.standard_rate) : null,
    tax_rate: String(input.tax_rate),
    minimum_order_quantity: input.minimum_order_quantity != null ? String(input.minimum_order_quantity) : null,
    delivery_time_days: input.delivery_time_days ?? null,
    is_active: input.is_active,
  };
  materialsStore[vendorId] = [created, ...(materialsStore[vendorId] ?? [])];
  return resolved(created);
}

export async function devGetMaterialCategoryOptions(): Promise<VndMaterialCategory[]> {
  return resolved(previewMaterialCategories);
}
