import { getRfqItems, isHeaderRfqItem } from "@/lib/fixtures/rfq";
import { getCurrentQuotation, getQuotationItems } from "@/lib/fixtures/quotation";
import { getFinalOffer } from "@/lib/fixtures/negotiation";
import { getBoqItems } from "@/lib/fixtures/boq";
import type { BoqItemNode } from "@/lib/fixtures/boq";
import type { BoqPreviewLine } from "@/components/commercial/boq/BoqDocumentPreview";

export type BoqRateSource = "negotiated_final" | "quoted" | "previous_boq" | "manual";

export type BoqDraftLine = {
  key: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  isHeader: boolean;
  sourceRfqItemId: string | null;
  sourceQuotationItemId: string | null;
  rateSource: BoqRateSource;
  remarks: string;
};

/**
 * Draft-generation logic for "Create BOQ" — reads the RFQ's line items and,
 * per item, the final negotiated rate (com_negotiation_offers.is_final) if
 * one was reached, falling back to the current quotation's quoted rate, and
 * finally to a blank manual-entry rate. Matches the BOQ-generation rule in
 * MODULE-1-COMMERCIAL-LIFECYCLE.md Phase 2 step 10 / Phase 14: the BOQ rate
 * is a point-in-time snapshot of the settled commercial position, not a
 * live reference.
 */
export async function buildBoqDraftFromRfq(rfqId: string): Promise<BoqDraftLine[]> {
  const [rfqItems, quotation] = await Promise.all([getRfqItems(rfqId), getCurrentQuotation(rfqId)]);
  const quotationItems = quotation ? await getQuotationItems(quotation.id) : [];

  const lines: BoqDraftLine[] = [];
  for (const item of rfqItems) {
    if (isHeaderRfqItem(item)) {
      lines.push({
        key: item.id,
        itemCode: item.itemCode,
        description: item.description,
        unit: "",
        quantity: 0,
        unitRate: 0,
        isHeader: true,
        sourceRfqItemId: item.id,
        sourceQuotationItemId: null,
        rateSource: "manual",
        remarks: "",
      });
      continue;
    }

    const quotationItem = quotationItems.find((q) => q.rfqItemId === item.id) ?? null;
    let unitRate = 0;
    let rateSource: BoqRateSource = "manual";

    if (quotationItem) {
      const finalOffer = await getFinalOffer(quotationItem.id);
      if (finalOffer?.offeredRate != null) {
        unitRate = finalOffer.offeredRate;
        rateSource = "negotiated_final";
      } else {
        unitRate = quotationItem.quotedRate;
        rateSource = "quoted";
      }
    }

    lines.push({
      key: item.id,
      itemCode: item.itemCode,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      unitRate,
      isHeader: false,
      sourceRfqItemId: item.id,
      sourceQuotationItemId: quotationItem?.id ?? null,
      rateSource,
      remarks: item.remarks ?? "",
    });
  }
  return lines;
}

// Flattens the BOQ item tree (as produced by getBoqItemTree) into the
// BoqDocumentPreview's line format, preserving hierarchy as a `depth` per
// row rather than flattening it away — mirrors the isHeaderRfqItem
// convention (quantity 0 marks a group/section row with no rate of its own).
export function flattenBoqTree(nodes: BoqItemNode[], depth = 0): BoqPreviewLine[] {
  const lines: BoqPreviewLine[] = [];
  for (const node of nodes) {
    lines.push({
      itemCode: node.itemCode,
      description: node.description,
      unit: node.unit,
      quantity: node.quantity,
      unitRate: node.unitRate,
      isHeader: node.quantity === 0,
      depth,
      remarks: node.remarks,
    });
    lines.push(...flattenBoqTree(node.children, depth + 1));
  }
  return lines;
}

/** Used when revising an existing BOQ — seeds the draft from the current version's items instead of re-deriving from the RFQ. */
export async function buildBoqDraftFromPreviousBoq(boqId: string): Promise<BoqDraftLine[]> {
  const items = await getBoqItems(boqId);
  return items.map((item) => ({
    key: item.id,
    itemCode: item.itemCode,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    unitRate: item.unitRate,
    isHeader: false,
    sourceRfqItemId: item.sourceRfqItemId,
    sourceQuotationItemId: item.sourceQuotationItemId,
    rateSource: "previous_boq",
    remarks: item.remarks ?? "",
  }));
}
