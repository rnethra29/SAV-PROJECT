/**
 * Vendor Management (Sites module) — vnd_vendor, per
 * docs/architecture/SAV_ERP_Sites_Vendor_Procurement_Module_Architecture.md
 * §6.6 and src/database/migrations/023_vnd_vendor_tables.sql. Field names
 * mirror the raw GET /vendors response (snake_case) — BaseRepository does
 * `SELECT * FROM vnd_vendor` with no server-side field transformation, same
 * convention as ClmClient. Only the fields the Vendor list page actually
 * renders are modeled in VndVendor; the full row is VndVendorDetail.
 */

export type VndVendorStatus = "Active" | "Inactive" | "Blacklisted" | "Under Review";

export type VndVendor = {
  vendor_id: string;
  vendor_code: string;
  vendor_name: string;
  vendor_type_id: string;
  city: string;
  state: string;
  vendor_status: VndVendorStatus;
  created_at: string;
};

export type VndVendorListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * Full vnd_vendor row, per src/validators/vndVendor.validator.js +
 * architecture doc §6.6. This is what GET /vendors/:id and POST /vendors
 * return — company_id/branch_id/created_by/updated_by/deleted_at audit
 * columns are omitted since no screen surfaces them yet.
 */
export type VndVendorDetail = VndVendor & {
  company_type: string | null;
  registration_date: string | null;

  address_line1: string;
  address_line2: string | null;
  country: string;
  pincode: string;
  website: string | null;

  gst_number: string | null;
  pan_number: string | null;
  gst_registration_type: string | null;

  msme_status: boolean;
  msme_number: string | null;
  company_registration_number: string | null;

  tds_applicable: boolean;
  tds_category: string | null;

  notes: string | null;
};

/**
 * POST /vendors body, per src/validators/vndVendor.validator.js
 * `createVendor` schema. `vendor_status`/`country`/`msme_status`/
 * `tds_applicable` are optional on the wire (server-defaulted) but the form
 * always sends them explicitly for a predictable review step.
 */
export type VndVendorCreateInput = {
  vendor_code: string;
  vendor_name: string;
  vendor_type_id: string;
  company_type?: string;
  registration_date?: string;

  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  website?: string;

  gst_number?: string;
  pan_number?: string;
  gst_registration_type?: string;

  msme_status: boolean;
  msme_number?: string;
  company_registration_number?: string;

  tds_applicable: boolean;
  tds_category?: string;

  vendor_status: VndVendorStatus;
  notes?: string;
};

/** vnd_vendor_type lookup row, per architecture doc §6.4. */
export type VndVendorType = {
  vendor_type_id: string;
  type_name: string;
  is_active: boolean;
};
