import { apiFetch } from "@/lib/api-client";
import type { VndVendor, VndVendorCreateInput, VndVendorDetail, VndVendorListMeta, VndVendorType } from "@/types/sites/vendor";

type VndVendorListResponse = {
  success: boolean;
  message: string;
  data: VndVendor[];
  meta: VndVendorListMeta;
};

type VndVendorResponse = {
  success: boolean;
  message: string;
  data: VndVendorDetail;
};

type VndLookupListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
};

/**
 * GET /vendors (Sites module -> Vendor Management submodule, vnd_vendor) —
 * src/routes/vndVendor.routes.js, registered at src/routes/index.js:105.
 * Real backend call, no fixture fallback in production — matches the
 * clients-api.ts convention.
 */
export async function getVendorList(): Promise<{ vendors: VndVendor[]; meta: VndVendorListMeta }> {
  const response = await apiFetch<VndVendorListResponse>("/vendors");
  return { vendors: response.data, meta: response.meta };
}

/** GET /vendors/:id — src/routes/vndVendor.routes.js:36. Used by Vendor 360. */
export async function getVendorById(vendorId: string): Promise<VndVendorDetail> {
  const response = await apiFetch<VndVendorResponse>(`/vendors/${vendorId}`);
  return response.data;
}

/**
 * POST /vendors — src/routes/vndVendor.routes.js:35, requires the
 * Procurement Manager role and validates against
 * src/validators/vndVendor.validator.js#createVendor.
 */
export async function createVendor(input: VndVendorCreateInput): Promise<VndVendorDetail> {
  const response = await apiFetch<VndVendorResponse>("/vendors", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

/**
 * GET /vendor-lookups/vendor-types — mounted at src/routes/index.js:114,
 * defined at src/routes/vndLookup.routes.js:31. Seeded lookup data only.
 */
export async function getVendorTypeOptions(): Promise<VndVendorType[]> {
  const response = await apiFetch<VndLookupListResponse<VndVendorType>>("/vendor-lookups/vendor-types");
  return response.data;
}
