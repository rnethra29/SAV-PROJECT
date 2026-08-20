/**
 * DEVELOPMENT-ONLY in-memory data layer for Procurement Orders. Same
 * reasoning and isolation as client-fixtures.ts/vendor-fixtures.ts: lives
 * outside apps/web/src/lib/sites/** (the real data-access layer), nothing
 * here is imported unless DEV_FIXTURE_MODE is active, and every function
 * mirrors the async signature of its real counterpart in
 * apps/web/src/lib/sites/{procurement-orders,projects}-api.ts. No
 * apiFetch/network call is ever made from here, and nothing here is ever
 * sent to the real backend. State resets on a full page reload.
 */

import { ApiError } from "@/lib/api-client";
import type { ClmProjectLookup } from "@/types/sites/project";
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
import type { CommercialDocument } from "@/types/commercial/shared";
import { PREVIEW_VENDOR_ID } from "./vendor-fixtures";

function resolved<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

// ---------------------------------------------------------------------------
// Lightweight Project lookup — same illustrative story as the architecture
// doc's own seed data (§17: project PRJ-2026-0031 "JSW Foundation" for
// Jindal Industries). Only id/code/name, matching ClmProjectLookup — not a
// full Project Management fixture (that module has no frontend yet).
// ---------------------------------------------------------------------------

export const previewProjects: ClmProjectLookup[] = [
  { project_id: "dev-project-jsw", project_code: "PRJ-2026-0031", project_name: "JSW Foundation" },
  { project_id: "dev-project-suzlon", project_code: "PRJ-2026-0045", project_name: "Suzlon 3.15MW Foundation Works" },
];

export async function devGetProjectOptions(): Promise<ClmProjectLookup[]> {
  return resolved(previewProjects);
}

// ---------------------------------------------------------------------------
// Mutable in-memory PO store, seeded against the existing vendor fixtures
// (vendor-fixtures.ts) so Vendor 360 <-> Procurement stays a coherent demo.
// ---------------------------------------------------------------------------

const APEX_VENDOR_ID = "dev-vendor-apex";

export const PREVIEW_PO_ID = "dev-po-1";

let poStore: VndPurchaseOrderDetail[] = [
  {
    po_id: PREVIEW_PO_ID,
    po_number: "PO-2026-0001",
    project_id: "dev-project-jsw",
    vendor_id: PREVIEW_VENDOR_ID,
    po_date: "2026-02-10",
    expected_delivery_date: "2026-02-20",
    delivery_location: "JSW Foundation Site, Pune",
    payment_terms: "50% advance, 50% on delivery",
    subtotal_amount: "0.00",
    discount_amount: "0.00",
    tax_amount: "0.00",
    total_amount: "0.00",
    status: "Partially Received",
    approval_status: "Finance Approved",
    remarks: "Development fixture — not a real purchase order.",
    created_at: "2026-02-10T09:00:00.000Z",
    updated_at: "2026-02-18T14:00:00.000Z",
  },
  {
    po_id: "dev-po-2",
    po_number: "PO-2026-0002",
    project_id: "dev-project-suzlon",
    vendor_id: APEX_VENDOR_ID,
    po_date: "2026-02-15",
    expected_delivery_date: "2026-02-25",
    delivery_location: "Suzlon Site A, Kutch",
    payment_terms: "Monthly billing on rental usage",
    subtotal_amount: "0.00",
    discount_amount: "0.00",
    tax_amount: "0.00",
    total_amount: "0.00",
    status: "Draft",
    approval_status: "Not Required",
    remarks: null,
    created_at: "2026-02-15T09:00:00.000Z",
    updated_at: "2026-02-15T09:00:00.000Z",
  },
];

const itemsStore: Record<string, VndPurchaseOrderItem[]> = {
  [PREVIEW_PO_ID]: [
    {
      po_item_id: "dev-poitem-1",
      po_id: PREVIEW_PO_ID,
      material_service_id: "dev-vmat-1",
      item_name: "OPC 53 Grade Cement",
      description: "Ordinary Portland Cement, 53 grade, 50kg bags.",
      quantity: "1000.000",
      unit: "Bag",
      unit_price: "410.0000",
      discount_amount: "0.00",
      tax_percentage: "28.00",
      line_amount: "410000.00",
      received_quantity: "600.000",
      sequence_no: 1,
      remarks: null,
    },
    {
      po_item_id: "dev-poitem-2",
      po_id: PREVIEW_PO_ID,
      material_service_id: "dev-vmat-2",
      item_name: "TMT Bar Fe 500D — 12mm",
      description: "Thermo-mechanically treated reinforcement bar.",
      quantity: "5.000",
      unit: "MT",
      unit_price: "62500.0000",
      discount_amount: "0.00",
      tax_percentage: "18.00",
      line_amount: "312500.00",
      received_quantity: "0.000",
      sequence_no: 2,
      remarks: null,
    },
  ],
  "dev-po-2": [
    {
      po_item_id: "dev-poitem-3",
      po_id: "dev-po-2",
      material_service_id: null,
      item_name: "Tower Crane Rental — 20T",
      description: "Monthly rental, operator not included.",
      quantity: "1.000",
      unit: "Month",
      unit_price: "185000.0000",
      discount_amount: "0.00",
      tax_percentage: "18.00",
      line_amount: "185000.00",
      received_quantity: "0.000",
      sequence_no: 1,
      remarks: null,
    },
  ],
};

let nextPoSeq = poStore.length + 1;
let nextItemSeq = 4;

/**
 * Mirrors the backend's AFTER INSERT/UPDATE/DELETE trigger on
 * vnd_purchase_order_item (doc §6.11 design note): subtotal_amount = sum of
 * pre-discount line values, discount_amount = sum of item discounts,
 * tax_amount = sum of tax on each item's post-discount value,
 * total_amount = subtotal − discount + tax (== sum of line_amount + tax).
 */
function recalcPoTotals(poId: string) {
  const po = poStore.find((p) => p.po_id === poId);
  if (!po) return;
  const items = itemsStore[poId] ?? [];

  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  for (const item of items) {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unit_price);
    const itemDiscount = Number(item.discount_amount);
    const lineAmount = Number(item.line_amount);
    subtotal += quantity * unitPrice;
    discount += itemDiscount;
    tax += lineAmount * (Number(item.tax_percentage) / 100);
  }

  poStore = poStore.map((p) =>
    p.po_id === poId
      ? {
          ...p,
          subtotal_amount: subtotal.toFixed(2),
          discount_amount: discount.toFixed(2),
          tax_amount: tax.toFixed(2),
          total_amount: (subtotal - discount + tax).toFixed(2),
        }
      : p,
  );
}

// Seed-time totals, computed once from the seed items above so the fixture
// starts in the same consistent state the trigger would leave it in.
recalcPoTotals(PREVIEW_PO_ID);
recalcPoTotals("dev-po-2");

// ---------------------------------------------------------------------------
// Functions mirroring apps/web/src/lib/sites/procurement-orders-api.ts
// ---------------------------------------------------------------------------

export async function devGetProcurementOrderList(): Promise<{ orders: VndPurchaseOrder[]; meta: VndPurchaseOrderListMeta }> {
  return resolved({
    orders: poStore,
    meta: { page: 1, limit: poStore.length, total: poStore.length, totalPages: 1 },
  });
}

export async function devGetProcurementOrderById(poId: string): Promise<VndPurchaseOrderDetail> {
  const found = poStore.find((po) => po.po_id === poId);
  if (!found) throw new ApiError(404, "Purchase order not found in the development fixture store.");
  return resolved(found);
}

export async function devCreateProcurementOrder(input: VndPurchaseOrderCreateInput): Promise<VndPurchaseOrderDetail> {
  const po_id = `dev-po-${nextPoSeq++}`;
  const created: VndPurchaseOrderDetail = {
    po_id,
    po_number: input.po_number,
    project_id: input.project_id,
    vendor_id: input.vendor_id,
    po_date: input.po_date,
    expected_delivery_date: input.expected_delivery_date ?? null,
    delivery_location: input.delivery_location ?? null,
    payment_terms: input.payment_terms ?? null,
    subtotal_amount: "0.00",
    discount_amount: "0.00",
    tax_amount: "0.00",
    total_amount: "0.00",
    status: "Draft",
    approval_status: "Not Required",
    remarks: input.remarks ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  poStore = [created, ...poStore];
  itemsStore[po_id] = [];
  return resolved(created);
}

// ---------------------------------------------------------------------------
// Functions mirroring the nested items endpoints
// ---------------------------------------------------------------------------

export async function devGetProcurementOrderItems(poId: string): Promise<VndPurchaseOrderItem[]> {
  return resolved(itemsStore[poId] ?? []);
}

export async function devCreateProcurementOrderItem(
  poId: string,
  input: VndPurchaseOrderItemCreateInput,
): Promise<VndPurchaseOrderItem> {
  const lineAmount = input.quantity * input.unit_price - input.discount_amount;
  const created: VndPurchaseOrderItem = {
    po_item_id: `dev-poitem-${nextItemSeq++}`,
    po_id: poId,
    material_service_id: input.material_service_id ?? null,
    item_name: input.item_name,
    description: input.description ?? null,
    quantity: input.quantity.toFixed(3),
    unit: input.unit,
    unit_price: input.unit_price.toFixed(4),
    discount_amount: input.discount_amount.toFixed(2),
    tax_percentage: input.tax_percentage.toFixed(2),
    line_amount: lineAmount.toFixed(2),
    received_quantity: "0.000",
    sequence_no: input.sequence_no,
    remarks: input.remarks ?? null,
  };
  itemsStore[poId] = [...(itemsStore[poId] ?? []), created];
  recalcPoTotals(poId);
  return resolved(created);
}

// ---------------------------------------------------------------------------
// Status workflow — mirrors src/models/statusTransitions.js
// (VND_PO_TRANSITIONS / VND_PO_APPROVAL_STATUS_TRANSITIONS) and
// src/services/vndPurchaseOrder.service.js exactly, so the fixture behaves
// like the real backend for every action Checkpoint 2 exposes. The one
// simplification: the real `decideApprovalStage` also requires a matching
// Approved `com_approvals` record to already exist (doc §13) — that engine
// has no frontend yet and is out of this checkpoint's scope, so the fixture
// applies the same approval_status/status transition the real endpoint
// would apply *after* that gate passes, without modeling the gate itself.
// ---------------------------------------------------------------------------

const PO_STATUS_TRANSITIONS: Record<VndPoStatus, VndPoStatus[]> = {
  Draft: ["Pending Approval", "Cancelled"],
  "Pending Approval": ["Approved", "Cancelled"],
  Approved: ["Sent to Vendor", "Cancelled"],
  "Sent to Vendor": ["Partially Received", "Received", "Cancelled"],
  "Partially Received": ["Received", "Cancelled"],
  Received: ["Closed"],
  Closed: [],
  Cancelled: [],
};

function getPoOrThrow(poId: string): VndPurchaseOrderDetail {
  const po = poStore.find((p) => p.po_id === poId);
  if (!po) throw new ApiError(404, "Purchase order not found in the development fixture store.");
  return po;
}

function updatePoInStore(poId: string, patch: Partial<VndPurchaseOrderDetail>): VndPurchaseOrderDetail {
  let next: VndPurchaseOrderDetail | undefined;
  poStore = poStore.map((p) => {
    if (p.po_id !== poId) return p;
    next = { ...p, ...patch, updated_at: new Date().toISOString() };
    return next;
  });
  if (!next) throw new ApiError(404, "Purchase order not found in the development fixture store.");
  return next;
}

/** Draft -> Pending Approval, approval_status -> Pending. Requires at least one line item (mirrors the real service's guard). */
export async function devSubmitProcurementOrder(poId: string): Promise<VndPurchaseOrderDetail> {
  const po = getPoOrThrow(poId);
  if ((itemsStore[poId] ?? []).length === 0) {
    throw new ApiError(400, JSON.stringify({ message: "Cannot submit a PO with no line items" }));
  }
  if (!PO_STATUS_TRANSITIONS[po.status].includes("Pending Approval")) {
    throw new ApiError(400, JSON.stringify({ message: `Invalid PO status transition: '${po.status}' -> 'Pending Approval'` }));
  }
  return resolved(updatePoInStore(poId, { status: "Pending Approval", approval_status: "Pending" }));
}

/** Manager stage -> approval_status 'Manager Approved'. Finance stage -> approval_status 'Finance Approved' AND status 'Approved'. */
export async function devApproveProcurementOrderStage(
  poId: string,
  stage: VndPoApprovalStage,
): Promise<VndPurchaseOrderDetail> {
  const po = getPoOrThrow(poId);
  const requiredCurrent = stage === "Manager" ? "Pending" : "Manager Approved";
  if (po.approval_status !== requiredCurrent) {
    throw new ApiError(
      409,
      JSON.stringify({ message: `PO approval_status must be '${requiredCurrent}' before the ${stage} stage can be recorded (currently '${po.approval_status}')` }),
    );
  }
  const patch: Partial<VndPurchaseOrderDetail> =
    stage === "Manager" ? { approval_status: "Manager Approved" } : { approval_status: "Finance Approved", status: "Approved" };
  return resolved(updatePoInStore(poId, patch));
}

/** Approved -> Sent to Vendor, or Received -> Closed — the two plain status moves with no dedicated action endpoint. */
export async function devUpdateProcurementOrderStatus(poId: string, status: VndPoStatus): Promise<VndPurchaseOrderDetail> {
  const po = getPoOrThrow(poId);
  if (!PO_STATUS_TRANSITIONS[po.status].includes(status)) {
    throw new ApiError(400, JSON.stringify({ message: `Invalid PO status transition: '${po.status}' -> '${status}'` }));
  }
  return resolved(updatePoInStore(poId, { status }));
}

/** Goods receipt — updates received_quantity per item and rolls the header status up to 'Partially Received' or 'Received'. */
export async function devReceiveProcurementOrderItems(
  poId: string,
  lines: VndPoReceiveLine[],
): Promise<VndPurchaseOrderDetail> {
  const po = getPoOrThrow(poId);
  if (!["Sent to Vendor", "Partially Received"].includes(po.status)) {
    throw new ApiError(
      409,
      JSON.stringify({ message: `Goods can only be received against a PO in 'Sent to Vendor' or 'Partially Received' status (currently '${po.status}')` }),
    );
  }

  const items = itemsStore[poId] ?? [];
  for (const line of lines) {
    const item = items.find((i) => i.po_item_id === line.poItemId);
    if (!item) throw new ApiError(400, JSON.stringify({ message: `po_item_id ${line.poItemId} does not belong to this PO` }));
    if (line.receivedQuantity < 0 || line.receivedQuantity > Number(item.quantity)) {
      throw new ApiError(400, JSON.stringify({ message: `receivedQuantity for ${line.poItemId} must be between 0 and ${item.quantity}` }));
    }
  }

  itemsStore[poId] = items.map((item) => {
    const line = lines.find((l) => l.poItemId === item.po_item_id);
    return line ? { ...item, received_quantity: line.receivedQuantity.toFixed(3) } : item;
  });

  const allItems = itemsStore[poId];
  const fullyReceived = allItems.every((i) => Number(i.received_quantity) >= Number(i.quantity));
  const partiallyReceived = allItems.some((i) => Number(i.received_quantity) > 0);
  const newStatus: VndPoStatus = fullyReceived ? "Received" : partiallyReceived ? "Partially Received" : po.status;

  return resolved(updatePoInStore(poId, { status: newStatus }));
}

/** Cancel — allowed from any status whose transition list includes 'Cancelled'. */
export async function devCancelProcurementOrder(poId: string): Promise<VndPurchaseOrderDetail> {
  const po = getPoOrThrow(poId);
  if (!PO_STATUS_TRANSITIONS[po.status].includes("Cancelled")) {
    throw new ApiError(409, JSON.stringify({ message: `PO in status '${po.status}' cannot be cancelled` }));
  }
  return resolved(updatePoInStore(poId, { status: "Cancelled" }));
}

// ---------------------------------------------------------------------------
// Documents — com_documents rows with entity_type='ProcurementPO' (doc §12's
// entity_type list for this module). Reuses the same shared
// document-category lookup as client-fixtures.ts (com_document_category is
// one shared table across every entity type, not per-module) — see
// devGetDocumentCategoryOptions in ./client-fixtures.
// ---------------------------------------------------------------------------

const poDocumentsStore: Record<string, CommercialDocument[]> = {
  [PREVIEW_PO_ID]: [
    {
      id: "dev-podoc-1",
      entityType: "ProcurementPO" as CommercialDocument["entityType"],
      entityId: PREVIEW_PO_ID,
      documentCategoryId: "cat-agreement",
      fileName: "PO-2026-0001-Ultratech.pdf",
      fileType: "pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 214_004,
      storageBucket: "dev-fixture",
      storagePath: "dev-fixture/not-a-real-file",
      versionNo: 1,
      previousVersionId: null,
      status: "active",
      description: "Signed purchase order issued to the vendor (development fixture).",
      createdAt: "2026-02-10T09:30:00.000Z",
      updatedAt: "2026-02-10T09:30:00.000Z",
    },
    {
      id: "dev-podoc-2",
      entityType: "ProcurementPO" as CommercialDocument["entityType"],
      entityId: PREVIEW_PO_ID,
      documentCategoryId: "cat-other",
      fileName: "Delivery-Challan-Feb2026.pdf",
      fileType: "pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 98_112,
      storageBucket: "dev-fixture",
      storagePath: "dev-fixture/not-a-real-file",
      versionNo: 1,
      previousVersionId: null,
      status: "active",
      description: "Delivery challan for the first cement consignment (development fixture).",
      createdAt: "2026-02-18T11:00:00.000Z",
      updatedAt: "2026-02-18T11:00:00.000Z",
    },
  ],
};

let nextPoDocumentSeq = 3;

export async function devGetProcurementOrderDocuments(poId: string): Promise<CommercialDocument[]> {
  return resolved(poDocumentsStore[poId] ?? []);
}

export async function devUploadProcurementOrderDocument(
  poId: string,
  input: { file: File; documentCategoryId: string; description?: string },
): Promise<CommercialDocument> {
  const created: CommercialDocument = {
    id: `dev-podoc-${nextPoDocumentSeq++}`,
    entityType: "ProcurementPO" as CommercialDocument["entityType"],
    entityId: poId,
    documentCategoryId: input.documentCategoryId,
    fileName: input.file.name,
    fileType: input.file.name.split(".").pop() || "file",
    mimeType: input.file.type || "application/octet-stream",
    fileSizeBytes: input.file.size,
    storageBucket: "dev-fixture",
    storagePath: "dev-fixture/not-a-real-file",
    versionNo: 1,
    previousVersionId: null,
    status: "active",
    description: input.description ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  poDocumentsStore[poId] = [created, ...(poDocumentsStore[poId] ?? [])];
  return resolved(created);
}

/**
 * No real file storage is connected in development fixture mode — same
 * honest-failure reasoning as client-fixtures.ts#devGetClientDocumentDownloadUrl.
 */
export async function devGetProcurementOrderDocumentDownloadUrl(): Promise<string> {
  throw new Error("Document download isn't available in development fixture mode — no file storage is connected.");
}
