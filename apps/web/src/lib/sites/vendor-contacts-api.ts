import { apiFetch } from "@/lib/api-client";
import type { VndVendorContact, VndVendorContactCreateInput } from "@/types/sites/vendor-contact";

type VndContactListResponse = {
  success: boolean;
  message: string;
  data: VndVendorContact[];
};

type VndContactResponse = {
  success: boolean;
  message: string;
  data: VndVendorContact;
};

/**
 * GET /vendors/:vendorId/contacts — src/routes/vndVendor.routes.js:44. No
 * pagination — matches the client-contacts-api.ts convention. A vendor with
 * no contacts yet is a legitimate, expected state.
 */
export async function getVendorContacts(vendorId: string): Promise<VndVendorContact[]> {
  const response = await apiFetch<VndContactListResponse>(`/vendors/${vendorId}/contacts`);
  return response.data;
}

/**
 * POST /vendors/:vendorId/contacts — src/routes/vndVendor.routes.js:45-51,
 * requires Procurement Manager/Officer and validates against
 * src/validators/vndVendorContact.validator.js#createContactForVendor.
 */
export async function createVendorContact(
  vendorId: string,
  input: VndVendorContactCreateInput,
): Promise<VndVendorContact> {
  const response = await apiFetch<VndContactResponse>(`/vendors/${vendorId}/contacts`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}
