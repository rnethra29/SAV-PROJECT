import { apiFetch } from "@/lib/api-client";
import type { ClmClientContact, ClmClientContactCreateInput, ClmContactType } from "@/types/sites/contact";

type ClmContactListResponse = {
  success: boolean;
  message: string;
  data: ClmClientContact[];
};

type ClmContactResponse = {
  success: boolean;
  message: string;
  data: ClmClientContact;
};

type ClmLookupListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
};

/**
 * GET /clients/:clientId/contacts — src/routes/clmClient.routes.js:49,
 * backed by clmClientContact.service.js#listByClient /
 * clmClientContact.repository.js#findByClientId (no pagination — the
 * controller returns `success(res, { data: contacts })` with no meta).
 * Real backend call, no fixture fallback: a client with no contacts yet is
 * a legitimate, expected state — never masked with mock rows.
 */
export async function getClientContacts(clientId: string): Promise<ClmClientContact[]> {
  const response = await apiFetch<ClmContactListResponse>(`/clients/${clientId}/contacts`);
  return response.data;
}

/**
 * POST /clients/:clientId/contacts — src/routes/clmClient.routes.js:50-56,
 * requires the Sales/Commercial Manager role (src/models/enums.js ROLES)
 * and validates against
 * src/validators/clmClientContact.validator.js#createClientContactForClient.
 * Real persistence — no local/optimistic fallback. The backend enforces
 * "one primary contact per (client_id, contact_type_id)" itself
 * (clmClientContact.service.js#assertNoConflictingPrimary, 409
 * UNIQUE_VIOLATION) — the frontend does not pre-empt or auto-unset another
 * primary contact.
 */
export async function createClientContact(
  clientId: string,
  input: ClmClientContactCreateInput,
): Promise<ClmClientContact> {
  const response = await apiFetch<ClmContactResponse>(`/clients/${clientId}/contacts`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

/**
 * GET /client-lookups/contact-types — mounted at src/routes/index.js:73,
 * defined at src/routes/clmLookup.routes.js:37. Seeded lookup data only
 * (src/database/seed.js), never client business records.
 */
export async function getContactTypeOptions(): Promise<ClmContactType[]> {
  const response = await apiFetch<ClmLookupListResponse<ClmContactType>>("/client-lookups/contact-types");
  return response.data;
}
