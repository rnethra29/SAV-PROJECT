/**
 * Client Management (Sites module) — clm_client, per
 * src/database/migrations/014_clm_client_tables.sql. Field names mirror the
 * raw GET /clients response (snake_case) rather than being remapped to
 * camelCase: BaseRepository does `SELECT * FROM clm_client` with no
 * server-side field transformation, so this type documents exactly what the
 * API returns. Only the fields the Client list page actually renders are
 * modeled — the row has many more billing/registration columns not needed
 * here yet.
 */

export type ClmClientStatus = "Prospect" | "Active" | "Inactive" | "Blacklisted";

export type ClmClient = {
  client_id: string;
  client_code: string;
  legal_name: string;
  display_name: string;
  client_status: ClmClientStatus;
  primary_email: string;
  primary_phone: string;
  created_at: string;
};

export type ClmClientListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * Full clm_client row, per src/validators/clmClient.validator.js +
 * src/database/migrations/014_clm_client_tables.sql (doc §6.3). This is
 * what GET /clients/:id and POST /clients return — company_id/branch_id/
 * created_by/updated_by/deleted_at audit columns are omitted since no
 * screen surfaces them yet.
 */
export type ClmClientDetail = ClmClient & {
  client_type_id: string;
  industry_id: string | null;
  gstin: string | null;
  pan: string | null;
  registration_number: string | null;

  billing_address_line1: string;
  billing_address_line2: string | null;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_pincode: string;

  registered_address_line1: string | null;
  registered_address_line2: string | null;
  registered_city: string | null;
  registered_state: string | null;
  registered_country: string | null;
  registered_pincode: string | null;

  site_office_address_line1: string | null;
  site_office_city: string | null;
  site_office_state: string | null;

  secondary_email: string | null;
  secondary_phone: string | null;
  website: string | null;

  payment_terms: string | null;
  credit_terms: string | null;
  credit_limit_amount: string | null;

  onboarding_date: string | null;
  notes: string | null;
};

/**
 * POST /clients body, per src/validators/clmClient.validator.js
 * `createClient` schema. `client_status`/`billing_country` are optional on
 * the wire (server-defaulted to 'Prospect'/'India') but the form always
 * sends them explicitly for a predictable review step.
 */
export type ClmClientCreateInput = {
  client_code: string;
  legal_name: string;
  display_name: string;
  client_type_id: string;
  industry_id?: string;
  gstin?: string;
  pan?: string;
  registration_number?: string;

  billing_address_line1: string;
  billing_address_line2?: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_pincode: string;

  registered_address_line1?: string;
  registered_address_line2?: string;
  registered_city?: string;
  registered_state?: string;
  registered_country?: string;
  registered_pincode?: string;

  site_office_address_line1?: string;
  site_office_city?: string;
  site_office_state?: string;

  primary_email: string;
  secondary_email?: string;
  primary_phone: string;
  secondary_phone?: string;
  website?: string;

  payment_terms?: string;
  credit_terms?: string;
  credit_limit_amount?: number;

  client_status: ClmClientStatus;
  onboarding_date?: string;
  notes?: string;
};

/** clm_client_type lookup row, per src/database/migrations/013_clm_lookup_tables.sql. */
export type ClmClientType = {
  client_type_id: string;
  type_name: string;
  is_active: boolean;
};

/** clm_industry lookup row, per src/database/migrations/013_clm_lookup_tables.sql. */
export type ClmIndustry = {
  industry_id: string;
  industry_name: string;
  is_active: boolean;
};
