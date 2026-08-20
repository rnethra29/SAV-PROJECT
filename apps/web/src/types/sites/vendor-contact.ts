/**
 * vnd_vendor_contact, per architecture doc §6.7 and
 * src/validators/vndVendorContact.validator.js.
 */

export type VndVendorContact = {
  vendor_contact_id: string;
  vendor_id: string;
  contact_name: string;
  designation: string | null;
  contact_role: string;
  mobile_number: string;
  alternate_number: string | null;
  email: string | null;
  is_primary_contact: boolean;
  is_active: boolean;
  created_at: string;
};

/** POST /vendors/:vendorId/contacts body, per `createContactForVendor` schema. */
export type VndVendorContactCreateInput = {
  contact_name: string;
  designation?: string;
  contact_role: string;
  mobile_number: string;
  alternate_number?: string;
  email?: string;
  is_primary_contact: boolean;
  is_active: boolean;
};
