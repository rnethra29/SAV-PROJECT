import { apiFetch } from "@/lib/api-client";
import type {
  ClmClientRequirement,
  ClmClientRequirementCreateInput,
  ClmRequirementListMeta,
} from "@/types/sites/requirement";

type ClmRequirementListResponse = {
  success: boolean;
  message: string;
  data: ClmClientRequirement[];
  meta: ClmRequirementListMeta;
};

type ClmRequirementResponse = {
  success: boolean;
  message: string;
  data: ClmClientRequirement;
};

/**
 * GET /clients/:clientId/requirements — src/routes/clmClient.routes.js:59,
 * backed by clmClientRequirement.service.js#listByClient /
 * clmClientRequirement.repository.js. Real backend call, no fixture
 * fallback: a client with no requirements yet is a legitimate, expected
 * state — never masked with mock rows.
 */
export async function getClientRequirements(clientId: string): Promise<{
  requirements: ClmClientRequirement[];
  meta: ClmRequirementListMeta;
}> {
  const response = await apiFetch<ClmRequirementListResponse>(`/clients/${clientId}/requirements`);
  return { requirements: response.data, meta: response.meta };
}

/**
 * POST /clients/:clientId/requirements — src/routes/clmClient.routes.js:60,
 * requires the Sales/Commercial Manager or Estimation Engineer role
 * (src/models/enums.js ROLES) and validates against
 * src/validators/clmClientRequirement.validator.js#createClientRequirementForClient.
 * Real persistence — no local/optimistic fallback.
 */
export async function createClientRequirement(
  clientId: string,
  input: ClmClientRequirementCreateInput,
): Promise<ClmClientRequirement> {
  const response = await apiFetch<ClmRequirementResponse>(`/clients/${clientId}/requirements`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}
