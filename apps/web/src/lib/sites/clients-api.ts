import { apiFetch } from "@/lib/api-client";
import type {
  ClmClient,
  ClmClientCreateInput,
  ClmClientDetail,
  ClmClientListMeta,
  ClmClientType,
  ClmIndustry,
} from "@/types/sites/client";

type ClmClientListResponse = {
  success: boolean;
  message: string;
  data: ClmClient[];
  meta: ClmClientListMeta;
};

type ClmClientResponse = {
  success: boolean;
  message: string;
  data: ClmClientDetail;
};

type ClmLookupListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
};

/**
 * GET /clients (Sites module -> Client Management submodule, clm_client) —
 * src/routes/clmClient.routes.js, registered at src/routes/index.js:67.
 * Real backend call, no fixture fallback: clm_client has no seed data by
 * design (only clm_client_type/clm_industry/clm_contact_type lookups are
 * seeded), so an empty result here is a legitimate, expected state — never
 * masked with mock rows.
 */
export async function getClientList(): Promise<{ clients: ClmClient[]; meta: ClmClientListMeta }> {
  const response = await apiFetch<ClmClientListResponse>("/clients");
  return { clients: response.data, meta: response.meta };
}

/**
 * GET /clients/:id — src/routes/clmClient.routes.js:37, backed by
 * clmClient.service.js#getById / clmClient.repository.js (plain
 * `SELECT * FROM clm_client WHERE client_id = $1`). Used by the Client
 * detail / 360 shell.
 */
export async function getClientById(clientId: string): Promise<ClmClientDetail> {
  const response = await apiFetch<ClmClientResponse>(`/clients/${clientId}`);
  return response.data;
}

/**
 * POST /clients — src/routes/clmClient.routes.js:36, requires the
 * Sales/Commercial Manager role (src/models/enums.js ROLES.
 * SALES_COMMERCIAL_MANAGER) and validates against
 * src/validators/clmClient.validator.js#createClient. Real persistence —
 * no local/optimistic fallback: if this call fails, the caller must surface
 * that failure rather than pretending the client was saved.
 */
export async function createClient(input: ClmClientCreateInput): Promise<ClmClientDetail> {
  const response = await apiFetch<ClmClientResponse>("/clients", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

/**
 * GET /client-lookups/client-types — mounted at src/routes/index.js:73,
 * defined at src/routes/clmLookup.routes.js:35. Seeded lookup data only
 * (src/database/seed.js), never client business records.
 */
export async function getClientTypeOptions(): Promise<ClmClientType[]> {
  const response = await apiFetch<ClmLookupListResponse<ClmClientType>>("/client-lookups/client-types");
  return response.data;
}

/**
 * GET /client-lookups/industries — mounted at src/routes/index.js:73,
 * defined at src/routes/clmLookup.routes.js:36. Seeded lookup data only.
 */
export async function getIndustryOptions(): Promise<ClmIndustry[]> {
  const response = await apiFetch<ClmLookupListResponse<ClmIndustry>>("/client-lookups/industries");
  return response.data;
}
