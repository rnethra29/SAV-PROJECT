/**
 * DEVELOPMENT-ONLY in-memory data layer for Vendor Performance/Ratings. Same
 * reasoning and isolation as the other dev-preview fixture files: lives
 * outside apps/web/src/lib/sites/**, nothing here is imported unless
 * DEV_FIXTURE_MODE is active, and every function mirrors the async
 * signature of its real counterpart in
 * apps/web/src/lib/sites/vendor-performance-api.ts. No apiFetch/network
 * call is ever made from here. State resets on a full page reload.
 *
 * devGetVendorPerformance recomputes v_vendor_performance's exact SQL
 * (architecture doc §6.17) from the live procurement-fixtures.ts PO store
 * and this file's own ratings store — a real, live aggregation over the
 * current fixture state, not a hardcoded snapshot. One-directional import
 * from procurement-fixtures.ts only (no cycle).
 */

import type { VndVendorPerformance, VndVendorRating, VndVendorRatingCreateInput } from "@/types/sites/vendor-performance";
import { PREVIEW_VENDOR_ID } from "./vendor-fixtures";
import { PREVIEW_PO_ID, devGetProcurementOrderList } from "./procurement-fixtures";

function resolved<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

const ratingsStore: Record<string, VndVendorRating[]> = {
  [PREVIEW_VENDOR_ID]: [
    {
      rating_id: "dev-rating-1",
      vendor_id: PREVIEW_VENDOR_ID,
      purchase_order_id: PREVIEW_PO_ID,
      quality_rating: 4,
      delivery_rating: 3,
      price_rating: 5,
      rated_by: "dev-user",
      rated_at: "2026-02-21T10:00:00.000Z",
      remarks: "Development fixture — not a real rating. Cement quality good; first batch delivery ran a little behind schedule.",
    },
    {
      rating_id: "dev-rating-2",
      vendor_id: PREVIEW_VENDOR_ID,
      purchase_order_id: null,
      quality_rating: 5,
      delivery_rating: 4,
      price_rating: 4,
      rated_by: "dev-user",
      rated_at: "2026-03-05T10:00:00.000Z",
      remarks: "Consistent supplier, responsive account team.",
    },
  ],
};

let nextRatingSeq = 3;

export async function devGetVendorRatings(vendorId: string): Promise<VndVendorRating[]> {
  // Newest first, matching rated_at DESC — an append-only opinion log reads
  // most-recent-first (doc §6.10).
  return resolved([...(ratingsStore[vendorId] ?? [])].sort((a, b) => b.rated_at.localeCompare(a.rated_at)));
}

export async function devCreateVendorRating(vendorId: string, input: VndVendorRatingCreateInput): Promise<VndVendorRating> {
  const created: VndVendorRating = {
    rating_id: `dev-rating-${nextRatingSeq++}`,
    vendor_id: vendorId,
    purchase_order_id: input.purchase_order_id ?? null,
    quality_rating: input.quality_rating,
    delivery_rating: input.delivery_rating,
    price_rating: input.price_rating,
    rated_by: "dev-user",
    rated_at: new Date().toISOString(),
    remarks: input.remarks ?? null,
  };
  ratingsStore[vendorId] = [...(ratingsStore[vendorId] ?? []), created];
  return resolved(created);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100;
}

/**
 * Reproduces v_vendor_performance's SQL exactly (doc §6.17): PO counts by
 * status, delayed_deliveries (Closed AND updated_at > expected_delivery_date),
 * on_time_delivery_percentage (null until at least one Closed PO exists),
 * and rating averages (avg_quality/delivery/price + overall_rating as the
 * average of each rating's own (quality+delivery+price)/3, not the average
 * of the three column averages).
 */
export async function devGetVendorPerformance(vendorId: string): Promise<VndVendorPerformance | null> {
  const { orders } = await devGetProcurementOrderList();
  const vendorPos = orders.filter((po) => po.vendor_id === vendorId);
  const ratings = ratingsStore[vendorId] ?? [];

  if (vendorPos.length === 0 && ratings.length === 0) return null;

  const totalPos = vendorPos.length;
  const completedPos = vendorPos.filter((po) => po.status === "Closed");
  const cancelledPos = vendorPos.filter((po) => po.status === "Cancelled");
  const pendingPos = vendorPos.filter((po) => po.status !== "Closed" && po.status !== "Cancelled");

  const delayedDeliveries = completedPos.filter(
    (po) => po.expected_delivery_date != null && po.updated_at.slice(0, 10) > po.expected_delivery_date,
  );
  const onTimePercentage =
    completedPos.length === 0
      ? null
      : Math.round((100 * (completedPos.length - delayedDeliveries.length) / completedPos.length) * 100) / 100;

  const avgQuality = average(ratings.map((r) => r.quality_rating));
  const avgDelivery = average(ratings.map((r) => r.delivery_rating));
  const avgPrice = average(ratings.map((r) => r.price_rating));
  const overall = average(ratings.map((r) => (r.quality_rating + r.delivery_rating + r.price_rating) / 3));

  return resolved({
    vendor_id: vendorId,
    total_pos: String(totalPos),
    completed_pos: String(completedPos.length),
    cancelled_pos: String(cancelledPos.length),
    pending_pos: String(pendingPos.length),
    delayed_deliveries: String(delayedDeliveries.length),
    on_time_delivery_percentage: onTimePercentage === null ? null : onTimePercentage.toFixed(2),
    avg_quality_rating: avgQuality === null ? null : avgQuality.toFixed(2),
    avg_delivery_rating: avgDelivery === null ? null : avgDelivery.toFixed(2),
    avg_price_rating: avgPrice === null ? null : avgPrice.toFixed(2),
    overall_rating: overall === null ? null : overall.toFixed(2),
  });
}
