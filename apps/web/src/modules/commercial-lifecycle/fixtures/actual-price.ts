import type { ActualPrice, ActualPriceHistoryEntry } from "@/modules/commercial-lifecycle/types/actual-price";

/**
 * TEMPORARY FRONTEND FIXTURE — no Actual Price backend endpoint exists yet.
 * Replace with real apiFetch("/actual-price?rfqItemId=...") calls once the
 * Express com_actual_price / com_actual_price_history endpoints exist.
 * com_actual_price is a current-pointer table (one row per item); every
 * change is expected to also append a com_actual_price_history row — the
 * fixture below seeds exactly one history row per item (the initial set),
 * matching a "not yet revised" actual price.
 */

const actualPriceFixtures: ActualPrice[] = [
  { id: "ap-0042-21a", rfqItemId: "ri-0042-2-1a", actualRate: 180, unit: "m3", currency: "INR", priceBasis: "approved_estimation_rate", priceSourceReference: "esti-0042-21a", priceDate: "2026-01-20", remarks: null, updatedAt: "2026-01-20T09:00:00.000Z" },
  { id: "ap-0042-21b", rfqItemId: "ri-0042-2-1b", actualRate: 130, unit: "m3", currency: "INR", priceBasis: "approved_estimation_rate", priceSourceReference: "esti-0042-21b", priceDate: "2026-01-20", remarks: null, updatedAt: "2026-01-20T09:00:00.000Z" },
  { id: "ap-0042-22", rfqItemId: "ri-0042-2-2", actualRate: 82, unit: "m3", currency: "INR", priceBasis: "approved_estimation_rate", priceSourceReference: "esti-0042-22", priceDate: "2026-01-20", remarks: null, updatedAt: "2026-01-20T09:00:00.000Z" },
  { id: "ap-0042-31", rfqItemId: "ri-0042-3-1", actualRate: 7600, unit: "m3", currency: "INR", priceBasis: "approved_estimation_rate", priceSourceReference: "esti-0042-31", priceDate: "2026-01-20", remarks: null, updatedAt: "2026-01-20T09:00:00.000Z" },

  { id: "ap-0031-11", rfqItemId: "ri-0031-1-1", actualRate: 165, unit: "m3", currency: "INR", priceBasis: "approved_estimation_rate", priceSourceReference: "esti-0031-11", priceDate: "2025-11-08", remarks: null, updatedAt: "2025-11-08T09:00:00.000Z" },
  { id: "ap-0031-12", rfqItemId: "ri-0031-1-2", actualRate: 3200, unit: "m3", currency: "INR", priceBasis: "approved_estimation_rate", priceSourceReference: "esti-0031-12", priceDate: "2025-11-08", remarks: null, updatedAt: "2025-11-08T09:00:00.000Z" },
  { id: "ap-0031-21", rfqItemId: "ri-0031-2-1", actualRate: 7200, unit: "m3", currency: "INR", priceBasis: "approved_estimation_rate", priceSourceReference: "esti-0031-21", priceDate: "2025-11-08", remarks: null, updatedAt: "2025-11-08T09:00:00.000Z" },

  { id: "ap-0028-11", rfqItemId: "ri-0028-1-1", actualRate: 160, unit: "m3", currency: "INR", priceBasis: "approved_estimation_rate", priceSourceReference: "esti-0028-11", priceDate: "2025-09-25", remarks: null, updatedAt: "2025-09-25T09:00:00.000Z" },
  { id: "ap-0028-12", rfqItemId: "ri-0028-1-2", actualRate: 3100, unit: "m3", currency: "INR", priceBasis: "approved_estimation_rate", priceSourceReference: "esti-0028-12", priceDate: "2025-09-25", remarks: null, updatedAt: "2025-09-25T09:00:00.000Z" },

  { id: "ap-0038-11", rfqItemId: "ri-0038-1-1", actualRate: 158, unit: "m3", currency: "INR", priceBasis: "approved_estimation_rate", priceSourceReference: "esti-0038-11", priceDate: "2025-12-16", remarks: null, updatedAt: "2025-12-16T09:00:00.000Z" },
  { id: "ap-0038-12", rfqItemId: "ri-0038-1-2", actualRate: 3050, unit: "m3", currency: "INR", priceBasis: "approved_estimation_rate", priceSourceReference: "esti-0038-12", priceDate: "2025-12-16", remarks: null, updatedAt: "2025-12-16T09:00:00.000Z" },
  { id: "ap-0038-21", rfqItemId: "ri-0038-2-1", actualRate: 7100, unit: "m3", currency: "INR", priceBasis: "approved_estimation_rate", priceSourceReference: "esti-0038-21", priceDate: "2025-12-16", remarks: null, updatedAt: "2025-12-16T09:00:00.000Z" },
  { id: "ap-0038-22", rfqItemId: "ri-0038-2-2", actualRate: 125, unit: "m3", currency: "INR", priceBasis: "approved_estimation_rate", priceSourceReference: "esti-0038-22", priceDate: "2025-12-16", remarks: null, updatedAt: "2025-12-16T09:00:00.000Z" },
];

const actualPriceHistoryFixtures: ActualPriceHistoryEntry[] = actualPriceFixtures.map((row) => ({
  id: `aph-${row.id}`,
  rfqItemId: row.rfqItemId,
  actualRate: row.actualRate,
  priceBasis: row.priceBasis,
  priceSourceReference: row.priceSourceReference,
  priceDate: row.priceDate,
  changedBy: "usr-priya",
  changedByName: "Priya Nair",
  changedAt: row.updatedAt,
  remarks: "Initial actual price set from approved estimation.",
}));

export async function getActualPrice(rfqItemId: string): Promise<ActualPrice | null> {
  return actualPriceFixtures.find((row) => row.rfqItemId === rfqItemId) ?? null;
}

export async function getActualPricesForRfq(rfqItemIds: string[]): Promise<ActualPrice[]> {
  const idSet = new Set(rfqItemIds);
  return actualPriceFixtures.filter((row) => idSet.has(row.rfqItemId));
}

export async function getActualPriceHistory(rfqItemId: string): Promise<ActualPriceHistoryEntry[]> {
  return actualPriceHistoryFixtures
    .filter((row) => row.rfqItemId === rfqItemId)
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt));
}
