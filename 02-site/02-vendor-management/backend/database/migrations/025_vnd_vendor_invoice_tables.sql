-- ============================================================
-- 025: Vendor Management submodule - Vendor Invoice + Invoice Items (architecture doc §6.13/§6.14)
--
-- No stored amount_paid/balance_amount (doc §6.13 design note, identical
-- reasoning to clm_client_invoice): computed in v_vendor_invoice_summary
-- from vnd_vendor_payment_allocation, never stored.
-- ============================================================

CREATE TABLE IF NOT EXISTS vnd_vendor_invoice (
  vendor_invoice_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number          VARCHAR(50) NOT NULL,
  vendor_id                 UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  purchase_order_id           UUID REFERENCES vnd_purchase_order(po_id),
  project_id                    UUID NOT NULL REFERENCES clm_project(project_id),
  invoice_date                    DATE NOT NULL,
  due_date                          DATE,
  subtotal_amount                     NUMERIC(18,2) NOT NULL CHECK (subtotal_amount >= 0),
  tax_amount                            NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount                            NUMERIC(18,2) GENERATED ALWAYS AS (subtotal_amount + tax_amount) STORED,
  status                                    vnd_invoice_status NOT NULL DEFAULT 'Draft',
  verified_by                                 UUID REFERENCES users(id),
  verified_at                                    TIMESTAMPTZ,
  remarks                                          TEXT,
  company_id                                         UUID NOT NULL REFERENCES companies(id),
  branch_id                                            UUID REFERENCES branches(id),
  created_at                                             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                               UUID NOT NULL REFERENCES users(id),
  updated_at                                                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                   UUID REFERENCES users(id),
  deleted_at                                                     TIMESTAMPTZ,
  deleted_by                                                       UUID REFERENCES users(id),
  -- Vendor's own invoice number is NOT globally unique - two different
  -- vendors legitimately reuse the same numbering, so scope per-vendor.
  UNIQUE (vendor_id, invoice_number)
);
CREATE INDEX IF NOT EXISTS idx_vnd_vinv_vendor ON vnd_vendor_invoice(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vnd_vinv_po ON vnd_vendor_invoice(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_vnd_vinv_project ON vnd_vendor_invoice(project_id);
CREATE INDEX IF NOT EXISTS idx_vnd_vinv_status ON vnd_vendor_invoice(status);

-- ---------- VENDOR INVOICE ITEMS ----------
CREATE TABLE IF NOT EXISTS vnd_vendor_invoice_item (
  vendor_invoice_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_invoice_id         UUID NOT NULL REFERENCES vnd_vendor_invoice(vendor_invoice_id) ON DELETE RESTRICT,
  po_item_id                   UUID REFERENCES vnd_purchase_order_item(po_item_id),
  description                     TEXT NOT NULL,
  quantity                          NUMERIC(18,3) NOT NULL CHECK (quantity > 0),
  unit                                VARCHAR(20),
  rate                                  NUMERIC(18,4) NOT NULL CHECK (rate >= 0),
  line_amount                            NUMERIC(18,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  sequence_no                              INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vnd_vinvitem_invoice ON vnd_vendor_invoice_item(vendor_invoice_id);
CREATE INDEX IF NOT EXISTS idx_vnd_vinvitem_poitem ON vnd_vendor_invoice_item(po_item_id);
