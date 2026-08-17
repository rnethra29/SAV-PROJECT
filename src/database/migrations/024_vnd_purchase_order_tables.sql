-- ============================================================
-- 024: Vendor Management submodule - Purchase Order (direct procurement) + Items
-- (architecture doc §6.11/§6.12)
--
-- Distinct from com_po (Commercial Lifecycle module's subcontract/work-package
-- PO, issued off a negotiated BOQ) - see doc's reconciliation table (§0).
-- ============================================================

CREATE TABLE IF NOT EXISTS vnd_purchase_order (
  po_id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number                 VARCHAR(50) NOT NULL UNIQUE,
  project_id                  UUID NOT NULL REFERENCES clm_project(project_id) ON DELETE RESTRICT,
  vendor_id                     UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  po_date                          DATE NOT NULL,
  expected_delivery_date             DATE,
  delivery_location                    VARCHAR(255),
  payment_terms                          TEXT,
  subtotal_amount                          NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0),
  discount_amount                            NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount                                   NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount                                   NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status                                           vnd_po_status NOT NULL DEFAULT 'Draft',
  approval_status                                    vnd_approval_status NOT NULL DEFAULT 'Not Required',
  remarks                                              TEXT,
  company_id                                             UUID NOT NULL REFERENCES companies(id),
  branch_id                                                UUID REFERENCES branches(id),
  created_at                                                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                                   UUID NOT NULL REFERENCES users(id),
  updated_at                                                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                       UUID REFERENCES users(id),
  deleted_at                                                         TIMESTAMPTZ,
  deleted_by                                                           UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_vnd_po_project ON vnd_purchase_order(project_id);
CREATE INDEX IF NOT EXISTS idx_vnd_po_vendor ON vnd_purchase_order(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vnd_po_status ON vnd_purchase_order(status);

-- ---------- PURCHASE ORDER ITEMS ----------
CREATE TABLE IF NOT EXISTS vnd_purchase_order_item (
  po_item_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id                    UUID NOT NULL REFERENCES vnd_purchase_order(po_id) ON DELETE RESTRICT,
  material_service_id        UUID REFERENCES vnd_material_service(material_service_id),
  item_name                     VARCHAR(200) NOT NULL,
  description                     TEXT,
  quantity                          NUMERIC(18,3) NOT NULL CHECK (quantity > 0),
  unit                                VARCHAR(20) NOT NULL,
  unit_price                           NUMERIC(18,4) NOT NULL CHECK (unit_price >= 0),
  discount_amount                        NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_percentage                           NUMERIC(5,2) NOT NULL DEFAULT 0,
  line_amount                                NUMERIC(18,2) GENERATED ALWAYS AS
    (quantity * unit_price - discount_amount) STORED,
  received_quantity                            NUMERIC(18,3) NOT NULL DEFAULT 0,
  sequence_no                                    INTEGER NOT NULL,
  remarks                                          TEXT,
  company_id                                         UUID NOT NULL REFERENCES companies(id),
  branch_id                                            UUID REFERENCES branches(id),
  created_at                                             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                               UUID NOT NULL REFERENCES users(id),
  updated_at                                                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                   UUID REFERENCES users(id),
  CHECK (received_quantity >= 0 AND received_quantity <= quantity)
);
CREATE INDEX IF NOT EXISTS idx_vnd_poitem_po ON vnd_purchase_order_item(po_id);
CREATE INDEX IF NOT EXISTS idx_vnd_poitem_matsvc ON vnd_purchase_order_item(material_service_id);

-- Keep PO header totals in sync with item rows (documented exception, doc §6.11 -
-- procurement POs are sent to vendors as a printable header total, unlike
-- com_quotation's equivalents which stay unmaintained ahead of item rollup).
CREATE OR REPLACE FUNCTION vnd_fn_recalc_po_totals() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE v_po_id UUID := COALESCE(NEW.po_id, OLD.po_id);
BEGIN
  UPDATE vnd_purchase_order SET
    subtotal_amount = COALESCE((SELECT SUM(quantity * unit_price) FROM vnd_purchase_order_item WHERE po_id = v_po_id), 0),
    discount_amount = COALESCE((SELECT SUM(discount_amount) FROM vnd_purchase_order_item WHERE po_id = v_po_id), 0),
    tax_amount      = COALESCE((SELECT SUM(line_amount * tax_percentage / 100) FROM vnd_purchase_order_item WHERE po_id = v_po_id), 0),
    updated_at = now()
  WHERE po_id = v_po_id;
  UPDATE vnd_purchase_order SET total_amount = subtotal_amount - discount_amount + tax_amount WHERE po_id = v_po_id;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_vnd_po_totals ON vnd_purchase_order_item;
CREATE TRIGGER trg_vnd_po_totals
AFTER INSERT OR UPDATE OR DELETE ON vnd_purchase_order_item
FOR EACH ROW EXECUTE FUNCTION vnd_fn_recalc_po_totals();
