/**
 * Direct procurement PO (vnd_purchase_order/_item), per architecture doc
 * §6.11-6.12 and src/validators/vndPurchaseOrder.validator.js +
 * vndPurchaseOrderItem.validator.js. Distinct from com_po (Commercial
 * Lifecycle's subcontract PO, doc §0) — field names mirror the raw
 * GET /procurement-orders response (snake_case), same convention as
 * VndVendor/ClmClient.
 */

export type VndPoStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Sent to Vendor"
  | "Partially Received"
  | "Received"
  | "Closed"
  | "Cancelled";

export type VndPoApprovalStatus = "Not Required" | "Pending" | "Manager Approved" | "Finance Approved" | "Rejected";

export type VndPurchaseOrder = {
  po_id: string;
  po_number: string;
  project_id: string;
  vendor_id: string;
  po_date: string;
  status: VndPoStatus;
  approval_status: VndPoApprovalStatus;
  total_amount: string;
  created_at: string;
  // Not previously modeled on the list-row type since no earlier checkpoint
  // rendered it — the real GET /procurement-orders list endpoint returns
  // the full row regardless (same SELECT * convention as everywhere else).
  // Vendor Performance's delayed_deliveries figure (doc §6.17) needs it.
  expected_delivery_date: string | null;
  // Standard Core-table audit column (doc §6, every Core table) — not
  // previously modeled since no earlier checkpoint needed it. Vendor
  // Performance's delayed_deliveries figure (doc §6.17) is defined against
  // it: a 'Closed' PO counts as delayed when updated_at (the moment it was
  // closed) falls after expected_delivery_date.
  updated_at: string;
};

export type VndPurchaseOrderListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * Full vnd_purchase_order row, per architecture doc §6.11.
 * subtotal_amount/discount_amount/tax_amount/total_amount are all
 * trigger-maintained server-side from the item rows — never sent by the
 * client on create/update.
 */
export type VndPurchaseOrderDetail = VndPurchaseOrder & {
  delivery_location: string | null;
  payment_terms: string | null;
  subtotal_amount: string;
  discount_amount: string;
  tax_amount: string;
  remarks: string | null;
};

/** POST /procurement-orders body, per `createPurchaseOrder` schema. */
export type VndPurchaseOrderCreateInput = {
  po_number: string;
  project_id: string;
  vendor_id: string;
  po_date: string;
  expected_delivery_date?: string;
  delivery_location?: string;
  payment_terms?: string;
  remarks?: string;
};

/** vnd_purchase_order_item row, per architecture doc §6.12. */
export type VndPurchaseOrderItem = {
  po_item_id: string;
  po_id: string;
  material_service_id: string | null;
  item_name: string;
  description: string | null;
  quantity: string;
  unit: string;
  unit_price: string;
  discount_amount: string;
  tax_percentage: string;
  line_amount: string;
  received_quantity: string;
  sequence_no: number;
  remarks: string | null;
};

/** POST /procurement-orders/:poId/items body, per `createItemForPo` schema. */
export type VndPurchaseOrderItemCreateInput = {
  material_service_id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_amount: number;
  tax_percentage: number;
  sequence_no: number;
  remarks?: string;
};

/** Two-stage approval chain (doc §13): Manager then Finance. */
export type VndPoApprovalStage = "Manager" | "Finance";

/** POST /procurement-orders/:id/receive body item, per `receivePoItems` schema. */
export type VndPoReceiveLine = {
  poItemId: string;
  receivedQuantity: number;
};
