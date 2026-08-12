import type { MarketPriceReference } from "@/types/commercial/market-price";

/**
 * TEMPORARY FRONTEND FIXTURE — no Market Price backend endpoint exists yet.
 * Replace with real apiFetch("/market-price?rfqItemId=...") calls once the
 * Express com_market_price_reference endpoint exists. This table is
 * naturally append-only (Phase 5.5 of the architecture doc) — every new
 * observation is a new row, never an update.
 */

const marketPriceFixtures: MarketPriceReference[] = [
  // 2.1(a) Excavation
  { id: "mp-0042-21a-1", rfqItemId: "ri-0042-2-1a", sourceTypeId: "pst-current-market", sourceTypeName: "Current Market", sourceReference: "Local market survey", rate: 195, unit: "m3", currency: "INR", priceDate: "2026-01-18", remarks: null, createdAt: "2026-01-18T10:00:00.000Z" },
  { id: "mp-0042-21a-2", rfqItemId: "ri-0042-2-1a", sourceTypeId: "pst-internal-purchase", sourceTypeName: "Internal Purchase", sourceReference: "Internal rate card Q1-2026", rate: 185, unit: "m3", currency: "INR", priceDate: "2026-01-16", remarks: null, createdAt: "2026-01-16T10:00:00.000Z" },
  { id: "mp-0042-21a-3", rfqItemId: "ri-0042-2-1a", sourceTypeId: "pst-historical-project", sourceTypeName: "Historical Project", sourceReference: "INOX 2MW Foundation Package", rate: 175, unit: "m3", currency: "INR", priceDate: "2025-11-02", remarks: null, createdAt: "2025-11-02T10:00:00.000Z" },

  // 2.1(b) Backfilling
  { id: "mp-0042-21b-1", rfqItemId: "ri-0042-2-1b", sourceTypeId: "pst-current-market", sourceTypeName: "Current Market", sourceReference: "Local market survey", rate: 145, unit: "m3", currency: "INR", priceDate: "2026-01-18", remarks: null, createdAt: "2026-01-18T10:00:00.000Z" },
  { id: "mp-0042-21b-2", rfqItemId: "ri-0042-2-1b", sourceTypeId: "pst-internal-purchase", sourceTypeName: "Internal Purchase", sourceReference: "Internal rate card Q1-2026", rate: 138, unit: "m3", currency: "INR", priceDate: "2026-01-16", remarks: null, createdAt: "2026-01-16T10:00:00.000Z" },
  { id: "mp-0042-21b-3", rfqItemId: "ri-0042-2-1b", sourceTypeId: "pst-historical-project", sourceTypeName: "Historical Project", sourceReference: "INOX 2MW Foundation Package", rate: 135, unit: "m3", currency: "INR", priceDate: "2025-11-02", remarks: null, createdAt: "2025-11-02T10:00:00.000Z" },

  // 2.2 Disposal
  { id: "mp-0042-22-1", rfqItemId: "ri-0042-2-2", sourceTypeId: "pst-current-market", sourceTypeName: "Current Market", sourceReference: "Local market survey", rate: 90, unit: "m3", currency: "INR", priceDate: "2026-01-18", remarks: null, createdAt: "2026-01-18T10:00:00.000Z" },
  { id: "mp-0042-22-2", rfqItemId: "ri-0042-2-2", sourceTypeId: "pst-internal-purchase", sourceTypeName: "Internal Purchase", sourceReference: "Internal rate card Q1-2026", rate: 85, unit: "m3", currency: "INR", priceDate: "2026-01-16", remarks: null, createdAt: "2026-01-16T10:00:00.000Z" },
  { id: "mp-0042-22-3", rfqItemId: "ri-0042-2-2", sourceTypeId: "pst-historical-project", sourceTypeName: "Historical Project", sourceReference: "INOX 2MW Foundation Package", rate: 80, unit: "m3", currency: "INR", priceDate: "2025-11-02", remarks: null, createdAt: "2025-11-02T10:00:00.000Z" },

  // 3.1 RMC M25
  { id: "mp-0042-31-1", rfqItemId: "ri-0042-3-1", sourceTypeId: "pst-current-market", sourceTypeName: "Current Market", sourceReference: "RMC supplier quote — local market", rate: 7850, unit: "m3", currency: "INR", priceDate: "2026-01-18", remarks: null, createdAt: "2026-01-18T10:00:00.000Z" },
  { id: "mp-0042-31-2", rfqItemId: "ri-0042-3-1", sourceTypeId: "pst-internal-purchase", sourceTypeName: "Internal Purchase", sourceReference: "Internal rate card Q1-2026", rate: 7700, unit: "m3", currency: "INR", priceDate: "2026-01-16", remarks: null, createdAt: "2026-01-16T10:00:00.000Z" },
  { id: "mp-0042-31-3", rfqItemId: "ri-0042-3-1", sourceTypeId: "pst-historical-project", sourceTypeName: "Historical Project", sourceReference: "INOX 2MW Foundation Package", rate: 7500, unit: "m3", currency: "INR", priceDate: "2025-11-02", remarks: null, createdAt: "2025-11-02T10:00:00.000Z" },

  // RFQ-2026-0031
  { id: "mp-0031-11-1", rfqItemId: "ri-0031-1-1", sourceTypeId: "pst-current-market", sourceTypeName: "Current Market", sourceReference: "Local market survey", rate: 175, unit: "m3", currency: "INR", priceDate: "2025-11-05", remarks: null, createdAt: "2025-11-05T10:00:00.000Z" },
  { id: "mp-0031-11-2", rfqItemId: "ri-0031-1-1", sourceTypeId: "pst-internal-purchase", sourceTypeName: "Internal Purchase", sourceReference: "Internal rate card Q4-2025", rate: 168, unit: "m3", currency: "INR", priceDate: "2025-11-04", remarks: null, createdAt: "2025-11-04T10:00:00.000Z" },
  { id: "mp-0031-12-1", rfqItemId: "ri-0031-1-2", sourceTypeId: "pst-current-market", sourceTypeName: "Current Market", sourceReference: "Local market survey", rate: 3400, unit: "m3", currency: "INR", priceDate: "2025-11-05", remarks: null, createdAt: "2025-11-05T10:00:00.000Z" },
  { id: "mp-0031-21-1", rfqItemId: "ri-0031-2-1", sourceTypeId: "pst-current-market", sourceTypeName: "Current Market", sourceReference: "RMC supplier quote", rate: 7500, unit: "m3", currency: "INR", priceDate: "2025-11-05", remarks: null, createdAt: "2025-11-05T10:00:00.000Z" },

  // RFQ-2026-0028
  { id: "mp-0028-11-1", rfqItemId: "ri-0028-1-1", sourceTypeId: "pst-current-market", sourceTypeName: "Current Market", sourceReference: "Local market survey", rate: 170, unit: "m3", currency: "INR", priceDate: "2025-09-23", remarks: null, createdAt: "2025-09-23T10:00:00.000Z" },
  { id: "mp-0028-12-1", rfqItemId: "ri-0028-1-2", sourceTypeId: "pst-current-market", sourceTypeName: "Current Market", sourceReference: "Local market survey", rate: 3300, unit: "m3", currency: "INR", priceDate: "2025-09-23", remarks: null, createdAt: "2025-09-23T10:00:00.000Z" },

  // RFQ-2026-0038
  { id: "mp-0038-11-1", rfqItemId: "ri-0038-1-1", sourceTypeId: "pst-current-market", sourceTypeName: "Current Market", sourceReference: "Local market survey", rate: 168, unit: "m3", currency: "INR", priceDate: "2025-12-13", remarks: null, createdAt: "2025-12-13T10:00:00.000Z" },
  { id: "mp-0038-12-1", rfqItemId: "ri-0038-1-2", sourceTypeId: "pst-current-market", sourceTypeName: "Current Market", sourceReference: "Local market survey", rate: 3250, unit: "m3", currency: "INR", priceDate: "2025-12-13", remarks: null, createdAt: "2025-12-13T10:00:00.000Z" },
  { id: "mp-0038-21-1", rfqItemId: "ri-0038-2-1", sourceTypeId: "pst-current-market", sourceTypeName: "Current Market", sourceReference: "RMC supplier quote", rate: 7400, unit: "m3", currency: "INR", priceDate: "2025-12-13", remarks: null, createdAt: "2025-12-13T10:00:00.000Z" },
  { id: "mp-0038-22-1", rfqItemId: "ri-0038-2-2", sourceTypeId: "pst-current-market", sourceTypeName: "Current Market", sourceReference: "Local market survey", rate: 140, unit: "m3", currency: "INR", priceDate: "2025-12-13", remarks: null, createdAt: "2025-12-13T10:00:00.000Z" },
];

export async function getMarketPriceReferences(rfqItemId: string): Promise<MarketPriceReference[]> {
  return marketPriceFixtures
    .filter((row) => row.rfqItemId === rfqItemId)
    .sort((a, b) => b.priceDate.localeCompare(a.priceDate));
}

export async function getMarketPriceReferencesForRfq(rfqItemIds: string[]): Promise<MarketPriceReference[]> {
  const idSet = new Set(rfqItemIds);
  return marketPriceFixtures.filter((row) => idSet.has(row.rfqItemId));
}

export async function getLatestMarketPrice(rfqItemId: string): Promise<MarketPriceReference | null> {
  const rows = await getMarketPriceReferences(rfqItemId);
  return rows[0] ?? null;
}
