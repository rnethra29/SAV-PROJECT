-- ============================================================
-- 005: Estimation + Estimation Items
-- ============================================================

CREATE TABLE IF NOT EXISTS com_estimation (
  estimation_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id             UUID NOT NULL REFERENCES com_rfq(rfq_id) ON DELETE RESTRICT,
  estimation_number VARCHAR(50) NOT NULL UNIQUE,
  status             com_estimation_status NOT NULL DEFAULT 'Draft',
  prepared_by        UUID NOT NULL REFERENCES users(id),
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
CREATE INDEX IF NOT EXISTS idx_com_estimation_rfq ON com_estimation(rfq_id);

CREATE TABLE IF NOT EXISTS com_estimation_items (
  estimation_item_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimation_id        UUID NOT NULL REFERENCES com_estimation(estimation_id) ON DELETE RESTRICT,
  rfq_item_id           UUID NOT NULL UNIQUE REFERENCES com_rfq_items(rfq_item_id) ON DELETE RESTRICT,
  material_cost         NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (material_cost >= 0),
  labour_cost           NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (labour_cost >= 0),
  equipment_cost        NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (equipment_cost >= 0),
  subcontract_cost      NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (subcontract_cost >= 0),
  transportation_cost   NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (transportation_cost >= 0),
  other_direct_cost     NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (other_direct_cost >= 0),
  overhead_cost         NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (overhead_cost >= 0),
  contingency_cost      NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (contingency_cost >= 0),
  estimated_unit_cost   NUMERIC(18,4) GENERATED ALWAYS AS
    (material_cost + labour_cost + equipment_cost + subcontract_cost +
     transportation_cost + other_direct_cost + overhead_cost + contingency_cost) STORED,
  remarks               TEXT,
  company_id            UUID NOT NULL REFERENCES companies(id),
  branch_id             UUID REFERENCES branches(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            UUID NOT NULL REFERENCES users(id),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by            UUID REFERENCES users(id),
  deleted_at            TIMESTAMPTZ,
  deleted_by            UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_com_estitems_estimation ON com_estimation_items(estimation_id);
