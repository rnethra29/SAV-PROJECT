import { apiFetch } from "@/lib/api-client";
import type { VndVendorPerformance, VndVendorRating, VndVendorRatingCreateInput } from "@/types/sites/vendor-performance";

type VndPerformanceResponse = {
  success: boolean;
  message: string;
  data: VndVendorPerformance | null;
};

type VndRatingListResponse = {
  success: boolean;
  message: string;
  data: VndVendorRating[];
};

type VndRatingResponse = {
  success: boolean;
  message: string;
  data: VndVendorRating;
};

/**
 * GET /vendors/:vendorId/performance — src/routes/vndVendor.routes.js:40,
 * backed by vndAnalysisService.vendorPerformance ->
 * `SELECT * FROM v_vendor_performance WHERE vendor_id = $1`. Returns null
 * for a vendor with no matching view row (the view still emits a row via
 * its LEFT JOINs for every vendor, so null is only a defensive fallback).
 */
export async function getVendorPerformance(vendorId: string): Promise<VndVendorPerformance | null> {
  const response = await apiFetch<VndPerformanceResponse>(`/vendors/${vendorId}/performance`);
  return response.data;
}

/** GET /vendors/:vendorId/ratings — src/routes/vndVendor.routes.js:74. */
export async function getVendorRatings(vendorId: string): Promise<VndVendorRating[]> {
  const response = await apiFetch<VndRatingListResponse>(`/vendors/${vendorId}/ratings`);
  return response.data;
}

/**
 * POST /vendors/:vendorId/ratings — src/routes/vndVendor.routes.js:75-81,
 * requires Procurement Officer/Manager or Site Engineer, validates against
 * createRatingForVendor. Append-only — no update/delete exists (doc §6.10).
 */
export async function createVendorRating(vendorId: string, input: VndVendorRatingCreateInput): Promise<VndVendorRating> {
  const response = await apiFetch<VndRatingResponse>(`/vendors/${vendorId}/ratings`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}
