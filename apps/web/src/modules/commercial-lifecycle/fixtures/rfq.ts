import type { Rfq, RfqItem } from "@/modules/commercial-lifecycle/types/rfq";
import { buildItemTree } from "@/lib/item-tree";

/**
 * TEMPORARY FRONTEND FIXTURE — no RFQ backend endpoint exists yet. Replace
 * with real apiFetch("/rfq") / apiFetch(`/rfq/${id}`) calls once the Express
 * com_rfq / com_rfq_items endpoints exist. Until then, this is the only
 * sanctioned source of RFQ data for the frontend — components must go
 * through getRfqList()/getRfqById() below, never read the arrays directly.
 *
 * RFQ-2026-0042 is seeded verbatim from the Phase 13 worked example in
 * MODULE-1-COMMERCIAL-LIFECYCLE.md (Suzlon 3.15MW Foundation), including its
 * hierarchical item structure — rows "2" and "3" are header rows
 * (`parentItemId: null`, no meaningful quantity), matching the doc's noted
 * convention of leaving header rows rate/quantity-less. The remaining RFQs
 * are lightweight header-only fixtures added so list search/filter/sort are
 * demonstrable across more than one row and status.
 */

const rfqFixtures: Rfq[] = [
  {
    id: "rfq-2026-0042",
    rfqNumber: "RFQ-2026-0042",
    clientId: "cli-suzlon",
    clientName: "Suzlon Energy Ltd.",
    projectId: "proj-suzlon-315",
    projectName: "SUZLON 3.15MW Foundation",
    siteId: "site-suzlon-a",
    rfqDate: "2026-01-15",
    scopeOfWork:
      "Foundation works for 3.15MW WTG including earthwork, concrete and allied works as per attached BOQ format.",
    executionTimeline: "90 days from PO",
    paymentTerms: "30% advance, 60% on delivery, 10% on completion",
    status: "won",
    remarks: "Priority RFQ — full commercial lifecycle closed out, PO issued to vendors.",
    createdAt: "2026-01-15T09:30:00.000Z",
    updatedAt: "2026-02-20T10:15:00.000Z",
  },
  {
    id: "rfq-2026-0031",
    rfqNumber: "RFQ-2026-0031",
    clientId: "cli-orient-green",
    clientName: "Orient Green Power Company Ltd.",
    projectId: "proj-ogp-substation",
    projectName: "OGP 33kV Substation Works",
    siteId: null,
    rfqDate: "2025-11-02",
    scopeOfWork: "Civil works for 33kV substation control room and switchyard foundation.",
    executionTimeline: "120 days",
    paymentTerms: "As per PO terms",
    status: "won",
    remarks: null,
    createdAt: "2025-11-02T10:00:00.000Z",
    updatedAt: "2026-01-05T16:40:00.000Z",
  },
  {
    id: "rfq-2026-0028",
    rfqNumber: "RFQ-2026-0028",
    clientId: "cli-inox-wind",
    clientName: "Inox Wind Ltd.",
    projectId: "proj-inox-2mw",
    projectName: "INOX 2MW Foundation Package",
    siteId: null,
    rfqDate: "2025-09-20",
    scopeOfWork: "Foundation works for 2MW WTG, earthwork and PCC package.",
    executionTimeline: "75 days from PO",
    paymentTerms: "20% advance, 70% on delivery, 10% on completion",
    status: "lost",
    remarks: "Lost to competitor on pricing.",
    createdAt: "2025-09-20T08:15:00.000Z",
    updatedAt: "2025-10-18T13:20:00.000Z",
  },
  {
    id: "rfq-2026-0051",
    rfqNumber: "RFQ-2026-0051",
    clientId: "cli-suzlon",
    clientName: "Suzlon Energy Ltd.",
    projectId: "proj-suzlon-315",
    projectName: "SUZLON 3.15MW Foundation",
    siteId: "site-suzlon-a",
    rfqDate: "2026-02-01",
    scopeOfWork: null,
    executionTimeline: null,
    paymentTerms: null,
    status: "draft",
    remarks: "Awaiting item entry from site engineer.",
    createdAt: "2026-02-01T07:50:00.000Z",
    updatedAt: "2026-02-01T07:50:00.000Z",
  },
  {
    id: "rfq-2026-0045",
    rfqNumber: "RFQ-2026-0045",
    clientId: "cli-orient-green",
    clientName: "Orient Green Power Company Ltd.",
    projectId: "proj-ogp-substation",
    projectName: "OGP 33kV Substation Works",
    siteId: "site-ogp-1",
    rfqDate: "2026-01-25",
    scopeOfWork: "Site grading and leveling works for switchyard area.",
    executionTimeline: "30 days",
    paymentTerms: null,
    status: "received",
    remarks: null,
    createdAt: "2026-01-25T09:00:00.000Z",
    updatedAt: "2026-01-25T09:00:00.000Z",
  },
  {
    id: "rfq-2026-0038",
    rfqNumber: "RFQ-2026-0038",
    clientId: "cli-inox-wind",
    clientName: "Inox Wind Ltd.",
    projectId: "proj-inox-2mw",
    projectName: "INOX 2MW Foundation Package",
    siteId: null,
    rfqDate: "2025-12-10",
    scopeOfWork: "Foundation and switchyard civil works for 2MW WTG package, phase 2.",
    executionTimeline: "100 days from PO",
    paymentTerms: "25% advance, 65% on delivery, 10% on completion",
    status: "negotiation",
    remarks: "Client counter-offer under review.",
    createdAt: "2025-12-10T11:30:00.000Z",
    updatedAt: "2026-01-28T15:10:00.000Z",
  },
];

const rfqItemFixtures: RfqItem[] = [
  // RFQ-2026-0042 — verbatim from Phase 13
  {
    id: "ri-0042-2",
    rfqId: "rfq-2026-0042",
    parentItemId: null,
    itemCode: "2",
    categoryId: null,
    description: "Earth Work & Allied Works",
    unit: "—",
    quantity: 0,
    sequenceNo: 1,
    remarks: null,
  },
  {
    id: "ri-0042-2-1a",
    rfqId: "rfq-2026-0042",
    parentItemId: "ri-0042-2",
    itemCode: "2.1(a)",
    categoryId: null,
    description:
      "Excavation in ordinary soil up to 1.5m depth including dressing of sides, removal of excavated earth to dumping yard within 50m lead, and disposal as directed by Engineer-in-charge. Rate inclusive of all labour, tools and dewatering if required.",
    unit: "m3",
    quantity: 500,
    sequenceNo: 1,
    remarks: null,
  },
  {
    id: "ri-0042-2-1b",
    rfqId: "rfq-2026-0042",
    parentItemId: "ri-0042-2",
    itemCode: "2.1(b)",
    categoryId: null,
    description:
      "Backfilling excavated pits/trenches with approved earth in layers of 150mm, watering and compaction to 95% MDD as per specification, including all leads and lifts.",
    unit: "m3",
    quantity: 120,
    sequenceNo: 2,
    remarks: null,
  },
  {
    id: "ri-0042-2-2",
    rfqId: "rfq-2026-0042",
    parentItemId: "ri-0042-2",
    itemCode: "2.2",
    categoryId: null,
    description:
      "Disposal of surplus excavated earth beyond 50m lead up to 1km, including loading, transportation and unloading at approved dumping site.",
    unit: "m3",
    quantity: 80,
    sequenceNo: 3,
    remarks: null,
  },
  {
    id: "ri-0042-3",
    rfqId: "rfq-2026-0042",
    parentItemId: null,
    itemCode: "3",
    categoryId: null,
    description: "Concrete And Allied Works",
    unit: "—",
    quantity: 0,
    sequenceNo: 2,
    remarks: null,
  },
  {
    id: "ri-0042-3-1",
    rfqId: "rfq-2026-0042",
    parentItemId: "ri-0042-3",
    itemCode: "3.1",
    categoryId: null,
    description:
      "Providing and laying M25 grade RMC for foundation raft including formwork, curing and finishing, excluding reinforcement, as per approved drawing and specification.",
    unit: "m3",
    quantity: 210,
    sequenceNo: 1,
    remarks: null,
  },

  // RFQ-2026-0031 — flat, lightweight
  {
    id: "ri-0031-1-1",
    rfqId: "rfq-2026-0031",
    parentItemId: null,
    itemCode: "1.1",
    categoryId: null,
    description:
      "Excavation for switchyard equipment foundations up to 2m depth including backfilling and disposal of surplus earth.",
    unit: "m3",
    quantity: 340,
    sequenceNo: 1,
    remarks: null,
  },
  {
    id: "ri-0031-1-2",
    rfqId: "rfq-2026-0031",
    parentItemId: null,
    itemCode: "1.2",
    categoryId: null,
    description: "PCC M15 grade below foundation footings, 75mm thick, including compaction and curing.",
    unit: "m3",
    quantity: 28,
    sequenceNo: 2,
    remarks: null,
  },
  {
    id: "ri-0031-2-1",
    rfqId: "rfq-2026-0031",
    parentItemId: null,
    itemCode: "2.1",
    categoryId: null,
    description:
      "RCC M25 grade for control room foundation raft and columns including formwork and curing, excluding reinforcement.",
    unit: "m3",
    quantity: 95,
    sequenceNo: 3,
    remarks: null,
  },

  // RFQ-2026-0028 — flat, lightweight
  {
    id: "ri-0028-1-1",
    rfqId: "rfq-2026-0028",
    parentItemId: null,
    itemCode: "1.1",
    categoryId: null,
    description:
      "Excavation in ordinary soil for WTG foundation up to 2.5m depth including dressing and disposal within 100m lead.",
    unit: "m3",
    quantity: 610,
    sequenceNo: 1,
    remarks: null,
  },
  {
    id: "ri-0028-1-2",
    rfqId: "rfq-2026-0028",
    parentItemId: null,
    itemCode: "1.2",
    categoryId: null,
    description: "PCC M10 grade blinding layer below foundation raft, 100mm thick.",
    unit: "m3",
    quantity: 32,
    sequenceNo: 2,
    remarks: null,
  },

  // RFQ-2026-0051 — draft, no items entered yet (intentionally empty)

  // RFQ-2026-0045 — flat, single item
  {
    id: "ri-0045-1-1",
    rfqId: "rfq-2026-0045",
    parentItemId: null,
    itemCode: "1.1",
    categoryId: null,
    description: "Site grading and leveling works for switchyard area including compaction as per specification.",
    unit: "m2",
    quantity: 1200,
    sequenceNo: 1,
    remarks: null,
  },

  // RFQ-2026-0038 — flat, lightweight
  {
    id: "ri-0038-1-1",
    rfqId: "rfq-2026-0038",
    parentItemId: null,
    itemCode: "1.1",
    categoryId: null,
    description: "Excavation in ordinary soil for WTG foundation up to 2m depth including dressing and disposal.",
    unit: "m3",
    quantity: 480,
    sequenceNo: 1,
    remarks: null,
  },
  {
    id: "ri-0038-1-2",
    rfqId: "rfq-2026-0038",
    parentItemId: null,
    itemCode: "1.2",
    categoryId: null,
    description: "PCC M10 grade blinding layer below foundation raft, 100mm thick.",
    unit: "m3",
    quantity: 26,
    sequenceNo: 2,
    remarks: null,
  },
  {
    id: "ri-0038-2-1",
    rfqId: "rfq-2026-0038",
    parentItemId: null,
    itemCode: "2.1",
    categoryId: null,
    description:
      "RCC M25 grade for WTG foundation raft including formwork, curing and finishing, excluding reinforcement.",
    unit: "m3",
    quantity: 205,
    sequenceNo: 3,
    remarks: null,
  },
  {
    id: "ri-0038-2-2",
    rfqId: "rfq-2026-0038",
    parentItemId: null,
    itemCode: "2.2",
    categoryId: null,
    description: "Backfilling excavated pits with approved earth in layers of 150mm, watering and compaction.",
    unit: "m3",
    quantity: 110,
    sequenceNo: 4,
    remarks: null,
  },
];

export type RfqListEntry = Rfq & { itemCount: number };

export async function getRfqList(): Promise<RfqListEntry[]> {
  return rfqFixtures.map((rfq) => ({
    ...rfq,
    itemCount: rfqItemFixtures.filter((item) => item.rfqId === rfq.id).length,
  }));
}

export async function getRfqById(id: string): Promise<Rfq | null> {
  return rfqFixtures.find((rfq) => rfq.id === id) ?? null;
}

export async function getRfqItems(rfqId: string): Promise<RfqItem[]> {
  return rfqItemFixtures.filter((item) => item.rfqId === rfqId).sort((a, b) => a.sequenceNo - b.sequenceNo);
}

export async function getRfqItemById(id: string): Promise<RfqItem | null> {
  return rfqItemFixtures.find((item) => item.id === id) ?? null;
}

export type RfqItemNode = RfqItem & { children: RfqItemNode[] };

export async function getRfqItemTree(rfqId: string): Promise<RfqItemNode[]> {
  const items = await getRfqItems(rfqId);
  return buildItemTree(items);
}

// Header/grouping rows (e.g. S.No "2", "3") carry no rate/quantity by the
// architecture doc's Phase 13 convention — quantity 0 is the marker.
export function isHeaderRfqItem(item: RfqItem): boolean {
  return item.quantity === 0;
}
