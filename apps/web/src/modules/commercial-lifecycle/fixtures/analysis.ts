import { getRfqById, getRfqItems, isHeaderRfqItem } from "@/modules/commercial-lifecycle/fixtures/rfq";
import { getEstimationItemByRfqItemId } from "@/modules/commercial-lifecycle/fixtures/estimation";
import { getLatestMarketPrice } from "@/modules/commercial-lifecycle/fixtures/market-price";
import { getActualPrice } from "@/modules/commercial-lifecycle/fixtures/actual-price";
import { getCurrentQuotation, getQuotationItemsByRfqItemId } from "@/modules/commercial-lifecycle/fixtures/quotation";
import { getFinalOffer } from "@/modules/commercial-lifecycle/fixtures/negotiation";
import { getCurrentBoq, getBoqItems } from "@/modules/commercial-lifecycle/fixtures/boq";
import { getPoItemsByBoqItemId } from "@/modules/commercial-lifecycle/fixtures/po";

/**
 * Frontend equivalent of the architecture doc's `v_item_commercial_analysis`
 * / `v_estimation_item_cost` derived views (Phase 15) — computed here from
 * the fixture layer rather than a SQL view. Every zero-denominator case is
 * guarded (mirrors the doc's `NULLIF` guards). Once the real API ships a
 * `/commercial/item-analysis` endpoint backed by the actual view, this
 * module is the seam to replace — page components should keep calling
 * `computeItemAnalysis`/`computeRfqAnalysis`, not read fixtures directly.
 */

export type ItemCommercialAnalysis = {
  rfqItemId: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  isHeader: boolean;
  estimatedUnitCost: number | null;
  estimatedTotalCost: number | null;
  marketRate: number | null;
  actualRate: number | null;
  actualValue: number | null;
  quotedRate: number | null;
  quotedValue: number | null;
  rateDifference: number | null;
  rateDifferencePct: number | null;
  valueDifference: number | null;
  profit: number | null;
  profitMarginPct: number | null;
  finalAgreedRate: number | null;
  finalValue: number | null;
  finalProfit: number | null;
  finalProfitMarginPct: number | null;
  boqRate: number | null;
  poRate: number | null;
};

function pct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 10000) / 100;
}

export async function computeItemAnalysis(rfqItemId: string, knownRfqId?: string): Promise<ItemCommercialAnalysis | null> {
  const rfqId = knownRfqId ?? (await resolveRfqIdForItem(rfqItemId));
  if (!rfqId) return null;
  const items = await getRfqItems(rfqId);
  const item = items.find((i) => i.id === rfqItemId);
  if (!item) return null;

  const base = {
    rfqItemId: item.id,
    itemCode: item.itemCode,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
  };

  if (isHeaderRfqItem(item)) {
    return {
      ...base,
      isHeader: true,
      estimatedUnitCost: null,
      estimatedTotalCost: null,
      marketRate: null,
      actualRate: null,
      actualValue: null,
      quotedRate: null,
      quotedValue: null,
      rateDifference: null,
      rateDifferencePct: null,
      valueDifference: null,
      profit: null,
      profitMarginPct: null,
      finalAgreedRate: null,
      finalValue: null,
      finalProfit: null,
      finalProfitMarginPct: null,
      boqRate: null,
      poRate: null,
    };
  }

  const [estimationItem, marketPrice, actualPrice, currentQuotation] = await Promise.all([
    getEstimationItemByRfqItemId(rfqItemId),
    getLatestMarketPrice(rfqItemId),
    getActualPrice(rfqItemId),
    getCurrentQuotation(item.rfqId),
  ]);

  const estimatedUnitCost = estimationItem?.estimatedUnitCost ?? null;
  const estimatedTotalCost = estimatedUnitCost !== null ? estimatedUnitCost * item.quantity : null;
  const actualRate = actualPrice?.actualRate ?? null;
  const actualValue = actualRate !== null ? actualRate * item.quantity : null;

  const quotationItemsForItem = currentQuotation
    ? (await getQuotationItemsByRfqItemId(rfqItemId)).filter((qi) => qi.quotationId === currentQuotation.id)
    : [];
  const quotationItem = quotationItemsForItem[0] ?? null;
  const quotedRate = quotationItem?.quotedRate ?? null;
  const quotedValue = quotedRate !== null ? quotedRate * item.quantity : null;

  const rateDifference = quotedRate !== null && actualRate !== null ? quotedRate - actualRate : null;
  const rateDifferencePct =
    rateDifference !== null && actualRate !== null && actualRate !== 0 ? pct(rateDifference, actualRate) : null;
  const valueDifference = quotedValue !== null && actualValue !== null ? quotedValue - actualValue : null;
  const profit = quotedValue !== null && estimatedTotalCost !== null ? quotedValue - estimatedTotalCost : null;
  const profitMarginPct = profit !== null && quotedValue !== null && quotedValue !== 0 ? pct(profit, quotedValue) : null;

  const finalOffer = quotationItem ? await getFinalOffer(quotationItem.id) : null;
  const finalAgreedRate = finalOffer?.offeredRate ?? null;
  const finalValue = finalAgreedRate !== null ? finalAgreedRate * item.quantity : null;
  const finalProfit = finalValue !== null && estimatedTotalCost !== null ? finalValue - estimatedTotalCost : null;
  const finalProfitMarginPct =
    finalProfit !== null && finalValue !== null && finalValue !== 0 ? pct(finalProfit, finalValue) : null;

  const currentBoq = await getCurrentBoq(item.rfqId);
  const boqItems = currentBoq ? await getBoqItems(currentBoq.id) : [];
  const boqItem = boqItems.find((bi) => bi.sourceRfqItemId === rfqItemId) ?? null;
  const boqRate = boqItem?.unitRate ?? null;

  const poItems = boqItem ? await getPoItemsByBoqItemId(boqItem.id) : [];
  const poRate = poItems[0]?.rate ?? null;

  return {
    ...base,
    isHeader: false,
    estimatedUnitCost,
    estimatedTotalCost,
    marketRate: marketPrice?.rate ?? null,
    actualRate,
    actualValue,
    quotedRate,
    quotedValue,
    rateDifference,
    rateDifferencePct,
    valueDifference,
    profit,
    profitMarginPct,
    finalAgreedRate,
    finalValue,
    finalProfit,
    finalProfitMarginPct,
    boqRate,
    poRate,
  };
}

// Deep-linked callers (e.g. a single item row) may only have an
// rfqItemId — this resolves the owning RFQ via a full fixture scan. Callers
// that already know the rfqId (the common case, from route params) should
// pass it as computeItemAnalysis's second argument to skip this entirely.
async function resolveRfqIdForItem(rfqItemId: string): Promise<string | null> {
  const { getRfqList } = await import("@/modules/commercial-lifecycle/fixtures/rfq");
  const rfqs = await getRfqList();
  for (const rfq of rfqs) {
    const items = await getRfqItems(rfq.id);
    if (items.some((i) => i.id === rfqItemId)) return rfq.id;
  }
  return null;
}

export async function computeRfqAnalysis(rfqId: string): Promise<ItemCommercialAnalysis[]> {
  const items = await getRfqItems(rfqId);
  const results = await Promise.all(items.map((item) => computeItemAnalysis(item.id, rfqId)));
  return results.filter((r): r is ItemCommercialAnalysis => r !== null);
}

export type RfqProfitSummary = {
  rfqId: string;
  itemCount: number;
  totalEstimatedCost: number;
  totalQuotedValue: number;
  totalActualValue: number;
  totalFinalValue: number;
  profit: number;
  profitMarginPct: number | null;
  finalProfit: number;
  finalProfitMarginPct: number | null;
};

export async function computeRfqProfitSummary(rfqId: string): Promise<RfqProfitSummary> {
  const analysis = (await computeRfqAnalysis(rfqId)).filter((row) => !row.isHeader);

  const totalEstimatedCost = sum(analysis.map((r) => r.estimatedTotalCost ?? 0));
  const totalQuotedValue = sum(analysis.map((r) => r.quotedValue ?? 0));
  const totalActualValue = sum(analysis.map((r) => r.actualValue ?? 0));
  const totalFinalValue = sum(analysis.map((r) => r.finalValue ?? r.quotedValue ?? 0));
  const profit = totalQuotedValue - totalEstimatedCost;
  const finalProfit = totalFinalValue - totalEstimatedCost;

  return {
    rfqId,
    itemCount: analysis.length,
    totalEstimatedCost,
    totalQuotedValue,
    totalActualValue,
    totalFinalValue,
    profit,
    profitMarginPct: totalQuotedValue !== 0 ? pct(profit, totalQuotedValue) : null,
    finalProfit,
    finalProfitMarginPct: totalFinalValue !== 0 ? pct(finalProfit, totalFinalValue) : null,
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export type ModuleOverview = {
  totalRfqs: number;
  openRfqs: number;
  wonRfqs: number;
  lostRfqs: number;
  totalEstimatedCost: number;
  totalQuotedValue: number;
  totalProfit: number;
  winRatePct: number | null;
};

export async function computeModuleOverview(): Promise<ModuleOverview> {
  const { getRfqList } = await import("@/modules/commercial-lifecycle/fixtures/rfq");
  const rfqs = await getRfqList();
  const summaries = await Promise.all(rfqs.map((rfq) => computeRfqProfitSummary(rfq.id)));

  const wonRfqs = rfqs.filter((r) => r.status === "won").length;
  const lostRfqs = rfqs.filter((r) => r.status === "lost").length;
  const decided = wonRfqs + lostRfqs;

  return {
    totalRfqs: rfqs.length,
    openRfqs: rfqs.length - wonRfqs - lostRfqs - rfqs.filter((r) => r.status === "cancelled" || r.status === "expired").length,
    wonRfqs,
    lostRfqs,
    totalEstimatedCost: sum(summaries.map((s) => s.totalEstimatedCost)),
    totalQuotedValue: sum(summaries.map((s) => s.totalQuotedValue)),
    totalProfit: sum(summaries.map((s) => s.profit)),
    winRatePct: decided !== 0 ? pct(wonRfqs, decided) : null,
  };
}

export { getRfqById };
