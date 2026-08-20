import { apiFetch } from "@/lib/api-client";
import type {
  VndPoApprovalStage,
  VndPoReceiveLine,
  VndPoStatus,
  VndPurchaseOrder,
  VndPurchaseOrderCreateInput,
  VndPurchaseOrderDetail,
  VndPurchaseOrderItem,
  VndPurchaseOrderItemCreateInput,
  VndPurchaseOrderListMeta,
} from "@/types/sites/procurement-order";

type VndPoListResponse = {
  success: boolean;
  message: string;
  data: VndPurchaseOrder[];
  meta: VndPurchaseOrderListMeta;
};

type VndPoResponse = {
  success: boolean;
  message: string;
  data: VndPurchaseOrderDetail;
};

type VndPoItemListResponse = {
  success: boolean;
  message: string;
  data: VndPurchaseOrderItem[];
};

type VndPoItemResponse = {
  success: boolean;
  message: string;
  data: VndPurchaseOrderItem;
};

/**
 * GET /procurement-orders — src/routes/vndPurchaseOrder.routes.js, mounted
 * at src/routes/index.js:109 as /procurement-orders (NOT /purchase-orders —
 * that path is already Commercial Lifecycle's com_po, doc §0).
 */
export async function getProcurementOrderList(): Promise<{ orders: VndPurchaseOrder[]; meta: VndPurchaseOrderListMeta }> {
  const response = await apiFetch<VndPoListResponse>("/procurement-orders");
  return { orders: response.data, meta: response.meta };
}

/** GET /procurement-orders/:id — used by the PO detail/workspace shell. */
export async function getProcurementOrderById(poId: string): Promise<VndPurchaseOrderDetail> {
  const response = await apiFetch<VndPoResponse>(`/procurement-orders/${poId}`);
  return response.data;
}

/**
 * POST /procurement-orders — requires the Procurement Officer role,
 * validates against createPurchaseOrder. Header only — subtotal/tax/total
 * start at 0 and are trigger-maintained once items are added.
 */
export async function createProcurementOrder(input: VndPurchaseOrderCreateInput): Promise<VndPurchaseOrderDetail> {
  const response = await apiFetch<VndPoResponse>("/procurement-orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

/** GET /procurement-orders/:poId/items — nested under the PO. */
export async function getProcurementOrderItems(poId: string): Promise<VndPurchaseOrderItem[]> {
  const response = await apiFetch<VndPoItemListResponse>(`/procurement-orders/${poId}/items`);
  return response.data;
}

/**
 * POST /procurement-orders/:poId/items — requires Procurement Officer,
 * validates against createItemForPo. The backend's AFTER-write trigger
 * recalculates the PO header's subtotal/tax/total after this call.
 */
export async function createProcurementOrderItem(
  poId: string,
  input: VndPurchaseOrderItemCreateInput,
): Promise<VndPurchaseOrderItem> {
  const response = await apiFetch<VndPoItemResponse>(`/procurement-orders/${poId}/items`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

/**
 * PATCH /procurement-orders/:id — generic update, used here only for the
 * two plain status moves that don't have their own dedicated action
 * endpoint (Approved -> Sent to Vendor, Received -> Closed). The backend's
 * VND_PO_TRANSITIONS map (src/models/statusTransitions.js) is the real
 * gate; this is a thin pass-through.
 */
export async function updateProcurementOrderStatus(poId: string, status: VndPoStatus): Promise<VndPurchaseOrderDetail> {
  const response = await apiFetch<VndPoResponse>(`/procurement-orders/${poId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return response.data;
}

/**
 * POST /procurement-orders/:id/submit — src/routes/vndPurchaseOrder.routes.js.
 * Draft -> Pending Approval, approval_status -> Pending. Backend requires at
 * least one line item.
 */
export async function submitProcurementOrder(poId: string): Promise<VndPurchaseOrderDetail> {
  const response = await apiFetch<VndPoResponse>(`/procurement-orders/${poId}/submit`, { method: "POST" });
  return response.data;
}

/**
 * POST /procurement-orders/:id/approve {stage} — two-stage chain (doc §13).
 * The Finance stage also advances the PO's own `status` to 'Approved'
 * server-side.
 */
export async function approveProcurementOrderStage(
  poId: string,
  stage: VndPoApprovalStage,
): Promise<VndPurchaseOrderDetail> {
  const response = await apiFetch<VndPoResponse>(`/procurement-orders/${poId}/approve`, {
    method: "POST",
    body: JSON.stringify({ stage }),
  });
  return response.data;
}

/**
 * POST /procurement-orders/:id/receive {items} — goods receipt. Updates
 * received_quantity per line and rolls the header status up to 'Partially
 * Received' or 'Received'.
 */
export async function receiveProcurementOrderItems(
  poId: string,
  items: VndPoReceiveLine[],
): Promise<VndPurchaseOrderDetail> {
  const response = await apiFetch<VndPoResponse>(`/procurement-orders/${poId}/receive`, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
  return response.data;
}

/** POST /procurement-orders/:id/cancel — allowed from any pre-Received status. */
export async function cancelProcurementOrder(poId: string): Promise<VndPurchaseOrderDetail> {
  const response = await apiFetch<VndPoResponse>(`/procurement-orders/${poId}/cancel`, { method: "POST" });
  return response.data;
}
