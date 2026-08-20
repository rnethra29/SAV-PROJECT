/**
 * Vendor rating + performance (vnd_vendor_rating / v_vendor_performance),
 * per architecture doc §6.10 and §6.17, and
 * src/validators/vndVendorRating.validator.js.
 */

/** vnd_vendor_rating row — append-only (doc §6.10): a rating is a point-in-time opinion, corrected by a new rating, never edited in place. */
export type VndVendorRating = {
  rating_id: string;
  vendor_id: string;
  purchase_order_id: string | null;
  quality_rating: number;
  delivery_rating: number;
  price_rating: number;
  rated_by: string;
  rated_at: string;
  remarks: string | null;
};

/** POST /vendors/:vendorId/ratings body, per `createRatingForVendor` schema. */
export type VndVendorRatingCreateInput = {
  purchase_order_id?: string;
  quality_rating: number;
  delivery_rating: number;
  price_rating: number;
  remarks?: string;
};

/**
 * GET /vendors/:vendorId/performance — v_vendor_performance (doc §6.17),
 * a plain `SELECT * FROM v_vendor_performance WHERE vendor_id = $1`. Every
 * figure here is calculated, never stored (doc §10) — total/completed/
 * cancelled/pending PO counts and delayed deliveries come from
 * vnd_purchase_order, the averages and overall_rating come from vnd_vendor_rating.
 * Numeric/count columns come back as strings from Postgres, same
 * convention as every other money/aggregate field in this app.
 */
export type VndVendorPerformance = {
  vendor_id: string;
  total_pos: string;
  completed_pos: string;
  cancelled_pos: string;
  pending_pos: string;
  delayed_deliveries: string;
  on_time_delivery_percentage: string | null;
  avg_quality_rating: string | null;
  avg_delivery_rating: string | null;
  avg_price_rating: string | null;
  overall_rating: string | null;
};
