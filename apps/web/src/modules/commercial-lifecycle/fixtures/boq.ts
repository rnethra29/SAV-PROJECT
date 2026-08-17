import type { Boq, BoqItem } from "@/modules/commercial-lifecycle/types/boq";
import { buildItemTree } from "@/lib/item-tree";

/**
 * TEMPORARY FRONTEND FIXTURE — no BOQ backend endpoint exists yet. Replace
 * with real apiFetch("/boq?rfqId=...") calls once the Express com_boq /
 * com_boq_items endpoints exist. BOQs are versioned (Tentative → Final,
 * Phase 8 rule 6) — RFQ-2026-0042 seeds both a Tentative and a Final version
 * to demonstrate the pattern; RFQ-2026-0031 seeds a single Final version.
 * `description` is capped at 50 words per the architecture doc's BOQ rule —
 * every row below stays well under that.
 */

const boqFixtures: Boq[] = [
  {
    id: "boq-0042-v1",
    boqNumber: "BOQ-2026-0042",
    versionNo: 1,
    previousVersionId: null,
    boqTitle: "SUZLON 3.15MW Foundation — Tentative BOQ",
    projectId: "proj-suzlon-315",
    clientId: "cli-suzlon",
    siteId: "site-suzlon-a",
    rfqId: "rfq-2026-0042",
    quotationId: "quo-0042-v2",
    boqType: "tentative",
    status: "tentative",
    revisionReason: null,
    remarks: "Drafted from the negotiation position ahead of final sign-off.",
    createdAt: "2026-02-11T09:00:00.000Z",
    updatedAt: "2026-02-11T09:00:00.000Z",
  },
  {
    id: "boq-0042-v2",
    boqNumber: "BOQ-2026-0042",
    versionNo: 2,
    previousVersionId: "boq-0042-v1",
    boqTitle: "SUZLON 3.15MW Foundation — Final BOQ",
    projectId: "proj-suzlon-315",
    clientId: "cli-suzlon",
    siteId: "site-suzlon-a",
    rfqId: "rfq-2026-0042",
    quotationId: "quo-0042-v2",
    boqType: "final",
    status: "final",
    revisionReason: "Rates finalized after client sign-off on negotiation.",
    remarks: null,
    createdAt: "2026-02-15T09:00:00.000Z",
    updatedAt: "2026-02-15T09:00:00.000Z",
  },
  {
    id: "boq-0031-v1",
    boqNumber: "BOQ-2025-0031",
    versionNo: 1,
    previousVersionId: null,
    boqTitle: "OGP 33kV Substation Works — Final BOQ",
    projectId: "proj-ogp-substation",
    clientId: "cli-orient-green",
    siteId: null,
    rfqId: "rfq-2026-0031",
    quotationId: "quo-0031-v1",
    boqType: "final",
    status: "final",
    revisionReason: null,
    remarks: null,
    createdAt: "2025-11-22T09:00:00.000Z",
    updatedAt: "2025-11-22T09:00:00.000Z",
  },
];

const boqItemFixtures: BoqItem[] = [
  // BOQ-2026-0042 v1 (Tentative) — pre-settlement rates
  { id: "boqi-0042-21a-v1", boqId: "boq-0042-v1", parentItemId: null, categoryId: null, itemCode: "2.1(a)", description: "Excavation in ordinary soil up to 1.5m depth including dressing of sides and disposal within 50m lead.", descriptionWordCount: 16, unit: "m3", quantity: 500, unitRate: 205, amount: 102500, sequenceNo: 1, sourceRfqItemId: "ri-0042-2-1a", sourceQuotationItemId: "qi-0042-21a-v1", remarks: null },
  { id: "boqi-0042-21b-v1", boqId: "boq-0042-v1", parentItemId: null, categoryId: null, itemCode: "2.1(b)", description: "Backfilling excavated pits/trenches with approved earth in layers of 150mm, watering and compaction to 95% MDD.", descriptionWordCount: 16, unit: "m3", quantity: 120, unitRate: 148, amount: 17760, sequenceNo: 2, sourceRfqItemId: "ri-0042-2-1b", sourceQuotationItemId: "qi-0042-21b-v1", remarks: null },
  { id: "boqi-0042-22-v1", boqId: "boq-0042-v1", parentItemId: null, categoryId: null, itemCode: "2.2", description: "Disposal of surplus excavated earth beyond 50m lead up to 1km, including loading, transportation and unloading.", descriptionWordCount: 15, unit: "m3", quantity: 80, unitRate: 94, amount: 7520, sequenceNo: 3, sourceRfqItemId: "ri-0042-2-2", sourceQuotationItemId: "qi-0042-22-v1", remarks: null },
  { id: "boqi-0042-31-v1", boqId: "boq-0042-v1", parentItemId: null, categoryId: null, itemCode: "3.1", description: "Providing and laying M25 grade RMC for foundation raft including formwork, curing and finishing, excluding reinforcement.", descriptionWordCount: 15, unit: "m3", quantity: 210, unitRate: 8150, amount: 1711500, sequenceNo: 4, sourceRfqItemId: "ri-0042-3-1", sourceQuotationItemId: "qi-0042-31-v1", remarks: null },

  // BOQ-2026-0042 v2 (Final) — settled rates
  { id: "boqi-0042-21a-v2", boqId: "boq-0042-v2", parentItemId: null, categoryId: null, itemCode: "2.1(a)", description: "Excavation in ordinary soil up to 1.5m depth including dressing of sides and disposal within 50m lead.", descriptionWordCount: 16, unit: "m3", quantity: 500, unitRate: 202, amount: 101000, sequenceNo: 1, sourceRfqItemId: "ri-0042-2-1a", sourceQuotationItemId: "qi-0042-21a-v2", remarks: null },
  { id: "boqi-0042-21b-v2", boqId: "boq-0042-v2", parentItemId: null, categoryId: null, itemCode: "2.1(b)", description: "Backfilling excavated pits/trenches with approved earth in layers of 150mm, watering and compaction to 95% MDD.", descriptionWordCount: 16, unit: "m3", quantity: 120, unitRate: 148, amount: 17760, sequenceNo: 2, sourceRfqItemId: "ri-0042-2-1b", sourceQuotationItemId: "qi-0042-21b-v2", remarks: null },
  { id: "boqi-0042-22-v2", boqId: "boq-0042-v2", parentItemId: null, categoryId: null, itemCode: "2.2", description: "Disposal of surplus excavated earth beyond 50m lead up to 1km, including loading, transportation and unloading.", descriptionWordCount: 15, unit: "m3", quantity: 80, unitRate: 94, amount: 7520, sequenceNo: 3, sourceRfqItemId: "ri-0042-2-2", sourceQuotationItemId: "qi-0042-22-v2", remarks: null },
  { id: "boqi-0042-31-v2", boqId: "boq-0042-v2", parentItemId: null, categoryId: null, itemCode: "3.1", description: "Providing and laying M25 grade RMC for foundation raft including formwork, curing and finishing, excluding reinforcement.", descriptionWordCount: 15, unit: "m3", quantity: 210, unitRate: 8100, amount: 1701000, sequenceNo: 4, sourceRfqItemId: "ri-0042-3-1", sourceQuotationItemId: "qi-0042-31-v2", remarks: null },

  // BOQ-2025-0031 v1 (Final)
  { id: "boqi-0031-11-v1", boqId: "boq-0031-v1", parentItemId: null, categoryId: null, itemCode: "1.1", description: "Excavation for switchyard equipment foundations up to 2m depth including backfilling and disposal of surplus earth.", descriptionWordCount: 15, unit: "m3", quantity: 340, unitRate: 178, amount: 60520, sequenceNo: 1, sourceRfqItemId: "ri-0031-1-1", sourceQuotationItemId: "qi-0031-11-v1", remarks: null },
  { id: "boqi-0031-12-v1", boqId: "boq-0031-v1", parentItemId: null, categoryId: null, itemCode: "1.2", description: "PCC M15 grade below foundation footings, 75mm thick, including compaction and curing.", descriptionWordCount: 12, unit: "m3", quantity: 28, unitRate: 3500, amount: 98000, sequenceNo: 2, sourceRfqItemId: "ri-0031-1-2", sourceQuotationItemId: "qi-0031-12-v1", remarks: null },
  { id: "boqi-0031-21-v1", boqId: "boq-0031-v1", parentItemId: null, categoryId: null, itemCode: "2.1", description: "RCC M25 grade for control room foundation raft and columns including formwork and curing, excluding reinforcement.", descriptionWordCount: 15, unit: "m3", quantity: 95, unitRate: 7700, amount: 731500, sequenceNo: 3, sourceRfqItemId: "ri-0031-2-1", sourceQuotationItemId: "qi-0031-21-v1", remarks: null },
];

export async function getBoqVersions(rfqId: string): Promise<Boq[]> {
  return boqFixtures.filter((b) => b.rfqId === rfqId).sort((a, b) => a.versionNo - b.versionNo);
}

export async function getCurrentBoq(rfqId: string): Promise<Boq | null> {
  const versions = await getBoqVersions(rfqId);
  if (versions.length === 0) return null;
  return versions[versions.length - 1];
}

export async function getBoqById(boqId: string): Promise<Boq | null> {
  return boqFixtures.find((b) => b.id === boqId) ?? null;
}

export async function getAllBoqs(): Promise<Boq[]> {
  return boqFixtures;
}

export async function getBoqItems(boqId: string): Promise<BoqItem[]> {
  return boqItemFixtures.filter((item) => item.boqId === boqId).sort((a, b) => a.sequenceNo - b.sequenceNo);
}

export type BoqItemNode = BoqItem & { children: BoqItemNode[] };

export async function getBoqItemTree(boqId: string): Promise<BoqItemNode[]> {
  const items = await getBoqItems(boqId);
  return buildItemTree(items);
}
