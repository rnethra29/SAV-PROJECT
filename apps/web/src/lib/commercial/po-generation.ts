import { getBoqItems } from "@/lib/fixtures/boq";

export type PoDraftLine = {
  key: string;
  boqItemId: string | null;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  taxPercentage: number;
  remarks: string;
};

/**
 * Draft-generation logic for "Create PO" — reads the Final BOQ's line items
 * and seeds one PO line per BOQ item, quantity/rate carried as-is from the
 * settled BOQ position (source of truth for what was agreed, per
 * MODULE-1-COMMERCIAL-LIFECYCLE.md Phase 9). A single Final BOQ can be split
 * across more than one vendor PO (see lib/fixtures/po.ts, RFQ-2026-0042) —
 * lines not relevant to a given vendor are removed in the wizard before
 * saving rather than modeled as a separate allocation step here.
 */
export async function buildPoDraftFromBoq(boqId: string): Promise<PoDraftLine[]> {
  const items = await getBoqItems(boqId);
  return items.map((item) => ({
    key: item.id,
    boqItemId: item.id,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    rate: item.unitRate,
    taxPercentage: 0,
    remarks: item.remarks ?? "",
  }));
}
