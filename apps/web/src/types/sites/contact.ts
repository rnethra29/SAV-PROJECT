/**
 * Client Management (Sites module) — clm_client_contact, per
 * src/database/migrations/014_clm_client_tables.sql (architecture doc
 * §6.4). Field names mirror the raw API response (snake_case): both
 * GET /clients/:clientId/contacts and POST /clients/:clientId/contacts
 * (src/routes/clmClient.routes.js) return `SELECT *` rows with no
 * server-side field transformation (src/repositories/clmClientContact.repository.js
 * extends BaseRepository with no custom select).
 */

export type ClmClientContact = {
  contact_id: string;
  client_id: string;
  contact_name: string;
  designation: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  alternate_phone: string | null;
  contact_type_id: string;
  is_primary_contact: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

/**
 * POST /clients/:clientId/contacts body, per
 * src/validators/clmClientContact.validator.js `createClientContactForClient`
 * (the `client_id` fork of the base schema — the client is taken from the
 * URL, not the body, for this nested endpoint).
 */
export type ClmClientContactCreateInput = {
  contact_name: string;
  designation?: string;
  department?: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;
  contact_type_id: string;
  is_primary_contact?: boolean;
  is_active?: boolean;
  notes?: string;
};

/** clm_contact_type lookup row, per src/database/migrations/013_clm_lookup_tables.sql. */
export type ClmContactType = {
  contact_type_id: string;
  type_name: string;
  is_active: boolean;
};
