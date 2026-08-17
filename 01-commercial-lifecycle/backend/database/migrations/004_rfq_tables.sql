-- ============================================================
-- 004: RFQ + RFQ Items
-- ============================================================

CREATE TABLE IF NOT EXISTS com_rfq (
  rfq_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number         VARCHAR(50) NOT NULL UNIQUE,
  client_id          UUID NOT NULL REFERENCES clients(id),
  project_id         UUID NOT NULL REFERENCES projects(id),
  site_id            UUID REFERENCES sites(id),
  rfq_date           DATE NOT NULL,
  scope_of_work      TEXT,
  execution_timeline TEXT,
  payment_terms      TEXT,
  status             com_rfq_status NOT NULL DEFAULT 'Draft',
  remarks            TEXT,
  company_id         UUID NOT NULL REFERENCES companies(id),
  branch_id          UUID REFERENCES branches(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by         UUID NOT NULL REFERENCES users(id),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by         UUID REFERENCES users(id),
  deleted_at         TIMESTAMPTZ,
  deleted_by         UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_com_rfq_client ON com_rfq(client_id);
CREATE INDEX IF NOT EXISTS idx_com_rfq_project ON com_rfq(project_id);
CREATE INDEX IF NOT EXISTS idx_com_rfq_status ON com_rfq(status);

CREATE TABLE IF NOT EXISTS com_rfq_items (
  rfq_item_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id         UUID NOT NULL REFERENCES com_rfq(rfq_id) ON DELETE RESTRICT,
  parent_item_id UUID REFERENCES com_rfq_items(rfq_item_id),
  item_code      VARCHAR(30) NOT NULL,
  category_id    UUID REFERENCES com_item_category(category_id),
  description    TEXT NOT NULL,
  unit           VARCHAR(20) NOT NULL,
  quantity       NUMERIC(18,3) NOT NULL CHECK (quantity > 0),
  sequence_no    INTEGER NOT NULL,
  remarks        TEXT,
  company_id     UUID NOT NULL REFERENCES companies(id),
  branch_id      UUID REFERENCES branches(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     UUID NOT NULL REFERENCES users(id),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by     UUID REFERENCES users(id),
  deleted_at     TIMESTAMPTZ,
  deleted_by     UUID REFERENCES users(id),
  CHECK (parent_item_id IS NULL OR parent_item_id <> rfq_item_id)
);
CREATE INDEX IF NOT EXISTS idx_com_rfqitems_rfq ON com_rfq_items(rfq_id);
CREATE INDEX IF NOT EXISTS idx_com_rfqitems_parent ON com_rfq_items(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_com_rfqitems_code ON com_rfq_items(item_code);
