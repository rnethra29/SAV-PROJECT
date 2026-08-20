import { apiFetch } from "@/lib/api-client";
import type { VndMaterialCategory, VndMaterialService, VndMaterialServiceCreateInput } from "@/types/sites/material-service";

type VndMaterialListResponse = {
  success: boolean;
  message: string;
  data: VndMaterialService[];
};

type VndMaterialResponse = {
  success: boolean;
  message: string;
  data: VndMaterialService;
};

type VndLookupListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
};

/** GET /vendors/:vendorId/materials — src/routes/vndVendor.routes.js:64. */
export async function getVendorMaterials(vendorId: string): Promise<VndMaterialService[]> {
  const response = await apiFetch<VndMaterialListResponse>(`/vendors/${vendorId}/materials`);
  return response.data;
}

/**
 * POST /vendors/:vendorId/materials — src/routes/vndVendor.routes.js:65-71,
 * requires Procurement Officer/Manager and validates against
 * src/validators/vndMaterialService.validator.js#createMaterialServiceForVendor.
 */
export async function createVendorMaterial(
  vendorId: string,
  input: VndMaterialServiceCreateInput,
): Promise<VndMaterialService> {
  const response = await apiFetch<VndMaterialResponse>(`/vendors/${vendorId}/materials`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

/**
 * GET /vendor-lookups/material-categories — mounted at
 * src/routes/index.js:114, defined at src/routes/vndLookup.routes.js:32.
 */
export async function getMaterialCategoryOptions(): Promise<VndMaterialCategory[]> {
  const response = await apiFetch<VndLookupListResponse<VndMaterialCategory>>("/vendor-lookups/material-categories");
  return response.data;
}
