/**
 * vnd_material_service (vendor catalog), per architecture doc §6.9 and
 * src/validators/vndMaterialService.validator.js.
 */

export type VndMaterialService = {
  material_service_id: string;
  vendor_id: string;
  material_category_id: string | null;
  item_name: string;
  description: string | null;
  unit: string;
  standard_rate: string | null;
  tax_rate: string;
  minimum_order_quantity: string | null;
  delivery_time_days: number | null;
  is_active: boolean;
};

/** POST /vendors/:vendorId/materials body, per `createMaterialServiceForVendor` schema. */
export type VndMaterialServiceCreateInput = {
  material_category_id?: string;
  item_name: string;
  description?: string;
  unit: string;
  standard_rate?: number;
  tax_rate: number;
  minimum_order_quantity?: number;
  delivery_time_days?: number;
  is_active: boolean;
};

/** vnd_material_category lookup row, per architecture doc §6.5. */
export type VndMaterialCategory = {
  material_category_id: string;
  category_name: string;
  is_active: boolean;
};
