-- ============================================================
-- 027: Vendor Management submodule - Vendor Rating (append-style - architecture doc §6.10)
--
-- Subjective, periodic inputs (someone rates the vendor after a delivery) -
-- a rating is a point-in-time opinion, corrected by a new rating, never
-- edited in place. The objective stats (on_time_delivery_percentage,
-- total_pos, ...) are 100% derivable from PO/invoice data and are NOT
-- stored - see v_vendor_performance (030_vnd_clm_views.sql).
-- ============================================================

CREATE TABLE IF NOT EXISTS vnd_vendor_rating (
  rating_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  purchase_order_id      UUID REFERENCES vnd_purchase_order(po_id),
  quality_rating            SMALLINT NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
  delivery_rating             SMALLINT NOT NULL CHECK (delivery_rating BETWEEN 1 AND 5),
  price_rating                  SMALLINT NOT NULL CHECK (price_rating BETWEEN 1 AND 5),
  rated_by                        UUID NOT NULL REFERENCES users(id),
  rated_at                          TIMESTAMPTZ NOT NULL DEFAULT now(),
  remarks                             TEXT,
  created_at                            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                              UUID NOT NULL REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_vnd_rating_vendor ON vnd_vendor_rating(vendor_id);
