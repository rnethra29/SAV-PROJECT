-- ============================================================
-- 009: Purchase Order + PO Items
-- ============================================================

CREATE TABLE IF NOT EXISTS com_po (
  po_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number                VARCHAR(50) NOT NULL UNIQUE,
  po_date                   DATE NOT NULL,
  vendor_id                 UUID NOT NULL REFERENCES vendors(id),
  project_id                UUID NOT NULL REFERENCES projects(id),
  site_id                    UUID REFERENCES sites(id),
  boq_id                     UUID REFERENCES com_boq(boq_id),
  quotation_id                UUID REFERENCES com_quotation(quotation_id),
  rfq_id                       UUID REFERENCES com_rfq(rfq_id),
  payment_terms                 TEXT,
  delivery_timeline              TEXT,
  terms_and_conditions           TEXT,
  status                          com_po_status NOT NULL DEFAULT 'Draft',
  subtotal_amount                 NUMERIC(18,2),
  tax_amount                       NUMERIC(18,2) DEFAULT 0,
  total_amount                      NUMERIC(18,2),
  remarks                            TEXT,
  company_id                          UUID NOT NULL REFERENCES companies(id),
  branch_id                            UUID REFERENCES branches(id),
  created_at                            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                             UUID NOT NULL REFERENCES users(id),
  updated_at                              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                               UUID REFERENCES users(id),
  deleted_at                                TIMESTAMPTZ,
  deleted_by                                 UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_com_po_vendor ON com_po(vendor_id);
CREATE INDEX IF NOT EXISTS idx_com_po_boq ON com_po(boq_id);
CREATE INDEX IF NOT EXISTS idx_com_po_status ON com_po(status);

CREATE TABLE IF NOT EXISTS com_po_items (
  po_item_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id            UUID NOT NULL REFERENCES com_po(po_id) ON DELETE RESTRICT,
  boq_item_id       UUID REFERENCES com_boq_items(boq_item_id),
  description        TEXT NOT NULL,
  unit                 VARCHAR(20) NOT NULL,
  quantity              NUMERIC(18,3) NOT NULL CHECK (quantity > 0),
  rate                    NUMERIC(18,4) NOT NULL CHECK (rate >= 0),
  tax_percentage            NUMERIC(5,2) DEFAULT 0,
  amount                     NUMERIC(18,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  sequence_no                 INTEGER NOT NULL,
  remarks                       TEXT,
  company_id                     UUID NOT NULL REFERENCES companies(id),
  branch_id                        UUID REFERENCES branches(id),
  created_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                         UUID NOT NULL REFERENCES users(id),
  updated_at                          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                            UUID REFERENCES users(id),
  deleted_at                             TIMESTAMPTZ,
  deleted_by                              UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_com_poitems_po ON com_po_items(po_id);
CREATE INDEX IF NOT EXISTS idx_com_poitems_boqitem ON com_po_items(boq_item_id);
