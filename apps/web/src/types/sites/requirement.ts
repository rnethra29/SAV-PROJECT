/**
 * Client Management (Sites module) — clm_client_requirement, per
 * src/database/migrations/015_clm_requirement_tables.sql (architecture doc
 * §6.6). Field names mirror the raw API response (snake_case): both
 * GET /clients/:clientId/requirements and POST /clients/:clientId/requirements
 * (src/routes/clmClient.routes.js) return `SELECT *` rows with no
 * server-side field transformation (src/repositories/clmClientRequirement.repository.js
 * extends BaseRepository with no custom select).
 */

export type ClmRequirementPriority = "Low" | "Medium" | "High" | "Urgent";

export type ClmRequirementStatus =
  | "New"
  | "Under Review"
  | "Converted to RFQ"
  | "Under Estimation"
  | "Quoted"
  | "Won"
  | "Lost"
  | "Cancelled";

export type ClmClientRequirement = {
  requirement_id: string;
  requirement_number: string;
  client_id: string;
  project_id: string | null;
  requirement_title: string;
  requirement_description: string | null;
  received_date: string;
  required_completion_date: string | null;
  priority: ClmRequirementPriority;
  requirement_status: ClmRequirementStatus;
  assigned_employee_id: string | null;
  notes: string | null;
  created_at: string;
};

export type ClmRequirementListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * POST /clients/:clientId/requirements body, per
 * src/validators/clmClientRequirement.validator.js `createClientRequirementForClient`
 * (the `client_id` fork of `createClientRequirement` — the client is taken
 * from the URL, not the body, for this nested endpoint).
 */
export type ClmClientRequirementCreateInput = {
  requirement_number: string;
  requirement_title: string;
  requirement_description?: string;
  received_date: string;
  required_completion_date?: string;
  priority: ClmRequirementPriority;
};
