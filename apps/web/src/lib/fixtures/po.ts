import type { PoItem, PurchaseOrder } from "@/types/commercial/po";

/**
 * TEMPORARY FRONTEND FIXTURE — no Purchase Order backend endpoint exists
 * yet. Replace with real apiFetch("/po?boqId=...") calls once the Express
 * com_po / com_po_items endpoints exist. A single Final BOQ can spawn more
 * than one PO (per-vendor split) — RFQ-2026-0042's Final BOQ is split across
 * two vendors below to demonstrate that pattern.
 */

const poFixtures: PurchaseOrder[] = [
  {
    id: "po-0042-01",
    poNumber: "PO-2026-0042-01",
    poDate: "2026-02-20",
    vendorId: "vnd-shree-earthmovers",
    vendorName: "Shree Earthmovers & Co.",
    projectId: "proj-suzlon-315",
    siteId: "site-suzlon-a",
    boqId: "boq-0042-v2",
    quotationId: "quo-0042-v2",
    rfqId: "rfq-2026-0042",
    paymentTerms: "30% advance, 60% on delivery, 10% on completion",
    deliveryTimeline: "45 days from PO",
    termsAndConditions: "As per SAV standard vendor terms, rev. 2025.",
    status: "issued",
    subtotalAmount: 126280,
    taxAmount: 0,
    totalAmount: 126280,
    remarks: "Covers earthwork items 2.1(a), 2.1(b), 2.2.",
    createdAt: "2026-02-20T10:00:00.000Z",
    updatedAt: "2026-02-20T10:00:00.000Z",
  },
  {
    id: "po-0042-02",
    poNumber: "PO-2026-0042-02",
    poDate: "2026-02-20",
    vendorId: "vnd-omsai-concrete",
    vendorName: "Om Sai Concrete Suppliers",
    projectId: "proj-suzlon-315",
    siteId: "site-suzlon-a",
    boqId: "boq-0042-v2",
    quotationId: "quo-0042-v2",
    rfqId: "rfq-2026-0042",
    paymentTerms: "30% advance, 60% on delivery, 10% on completion",
    deliveryTimeline: "60 days from PO",
    termsAndConditions: "As per SAV standard vendor terms, rev. 2025.",
    status: "issued",
    subtotalAmount: 1701000,
    taxAmount: 0,
    totalAmount: 1701000,
    remarks: "Covers RMC supply/lay item 3.1.",
    createdAt: "2026-02-20T10:15:00.000Z",
    updatedAt: "2026-02-20T10:15:00.000Z",
  },
  {
    id: "po-0031-01",
    poNumber: "PO-2025-0031-01",
    poDate: "2025-11-25",
    vendorId: "vnd-ganesh-structural",
    vendorName: "Ganesh Structural Contractors",
    projectId: "proj-ogp-substation",
    siteId: null,
    boqId: "boq-0031-v1",
    quotationId: "quo-0031-v1",
    rfqId: "rfq-2026-0031",
    paymentTerms: "As per PO terms",
    deliveryTimeline: "100 days from PO",
    termsAndConditions: "As per SAV standard vendor terms, rev. 2025.",
    status: "issued",
    subtotalAmount: 890020,
    taxAmount: 0,
    totalAmount: 890020,
    remarks: "Covers all substation civil works items.",
    createdAt: "2025-11-25T10:00:00.000Z",
    updatedAt: "2025-11-25T10:00:00.000Z",
  },
];

const poItemFixtures: PoItem[] = [
  { id: "poi-0042-21a", poId: "po-0042-01", boqItemId: "boqi-0042-21a-v2", description: "Excavation in ordinary soil up to 1.5m depth including dressing of sides and disposal within 50m lead.", unit: "m3", quantity: 500, rate: 202, taxPercentage: 0, amount: 101000, sequenceNo: 1, remarks: null },
  { id: "poi-0042-21b", poId: "po-0042-01", boqItemId: "boqi-0042-21b-v2", description: "Backfilling excavated pits/trenches with approved earth in layers of 150mm, watering and compaction to 95% MDD.", unit: "m3", quantity: 120, rate: 148, taxPercentage: 0, amount: 17760, sequenceNo: 2, remarks: null },
  { id: "poi-0042-22", poId: "po-0042-01", boqItemId: "boqi-0042-22-v2", description: "Disposal of surplus excavated earth beyond 50m lead up to 1km, including loading, transportation and unloading.", unit: "m3", quantity: 80, rate: 94, taxPercentage: 0, amount: 7520, sequenceNo: 3, remarks: null },

  { id: "poi-0042-31", poId: "po-0042-02", boqItemId: "boqi-0042-31-v2", description: "Providing and laying M25 grade RMC for foundation raft including formwork, curing and finishing, excluding reinforcement.", unit: "m3", quantity: 210, rate: 8100, taxPercentage: 0, amount: 1701000, sequenceNo: 1, remarks: null },

  { id: "poi-0031-11", poId: "po-0031-01", boqItemId: "boqi-0031-11-v1", description: "Excavation for switchyard equipment foundations up to 2m depth including backfilling and disposal of surplus earth.", unit: "m3", quantity: 340, rate: 178, taxPercentage: 0, amount: 60520, sequenceNo: 1, remarks: null },
  { id: "poi-0031-12", poId: "po-0031-01", boqItemId: "boqi-0031-12-v1", description: "PCC M15 grade below foundation footings, 75mm thick, including compaction and curing.", unit: "m3", quantity: 28, rate: 3500, taxPercentage: 0, amount: 98000, sequenceNo: 2, remarks: null },
  { id: "poi-0031-21", poId: "po-0031-01", boqItemId: "boqi-0031-21-v1", description: "RCC M25 grade for control room foundation raft and columns including formwork and curing, excluding reinforcement.", unit: "m3", quantity: 95, rate: 7700, taxPercentage: 0, amount: 731500, sequenceNo: 3, remarks: null },
];

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  return poFixtures;
}

export async function getPurchaseOrdersByRfqId(rfqId: string): Promise<PurchaseOrder[]> {
  return poFixtures.filter((po) => po.rfqId === rfqId);
}

export async function getPurchaseOrdersByBoqId(boqId: string): Promise<PurchaseOrder[]> {
  return poFixtures.filter((po) => po.boqId === boqId);
}

export async function getPurchaseOrderById(poId: string): Promise<PurchaseOrder | null> {
  return poFixtures.find((po) => po.id === poId) ?? null;
}

export async function getPoItems(poId: string): Promise<PoItem[]> {
  return poItemFixtures.filter((item) => item.poId === poId).sort((a, b) => a.sequenceNo - b.sequenceNo);
}

export async function getPoItemsByBoqItemId(boqItemId: string): Promise<PoItem[]> {
  return poItemFixtures.filter((item) => item.boqItemId === boqItemId);
}
