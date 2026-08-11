-- ============================================================
-- 008: BOQ (versioned) + BOQ Items (hierarchical, 50-word description rule)
-- ============================================================

CREATE TABLE IF NOT EXISTS com_boq (
  boq_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_number             VARCHAR(50) NOT NULL,
  version_no              INTEGER NOT NULL DEFAULT 1 CHECK (version_no >= 1),
  previous_version_id    UUID REFERENCES com_boq(boq_id),
  boq_title               VARCHAR(200) NOT NULL,
  project_id              UUID NOT NULL REFERENCES projects(id),
  client_id                UUID NOT NULL REFERENCES clients(id),
  site_id                  UUID REFERENCES sites(id),
  rfq_id                   UUID NOT NULL REFERENCES com_rfq(rfq_id) ON DELETE RESTRICT,
  quotation_id             UUID REFERENCES com_quotation(quotation_id),
  boq_type                 com_boq_type NOT NULL DEFAULT 'Tentative',
  status                   com_boq_status NOT NULL DEFAULT 'Draft',
  revision_reason          TEXT,
  remarks                  TEXT,
  company_id               UUID NOT NULL REFERENCES companies(id),
  branch_id                UUID REFERENCES branches(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                UUID NOT NULL REFERENCES users(id),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                UUID REFERENCES users(id),
  deleted_at                TIMESTAMPTZ,
  deleted_by                UUID REFERENCES users(id),
  UNIQUE (boq_number, version_no),
  CHECK (previous_version_id IS NULL OR previous_version_id <> boq_id),
  CHECK (previous_version_id IS NULL OR revision_reason IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_com_boq_rfq ON com_boq(rfq_id);
CREATE INDEX IF NOT EXISTS idx_com_boq_status ON com_boq(status);

CREATE TABLE IF NOT EXISTS com_boq_items (
  boq_item_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_id                       UUID NOT NULL REFERENCES com_boq(boq_id) ON DELETE RESTRICT,
  parent_item_id                UUID REFERENCES com_boq_items(boq_item_id),
  category_id                    UUID REFERENCES com_item_category(category_id),
  item_code                      VARCHAR(30) NOT NULL,
  description                    TEXT NOT NULL,
  description_word_count         SMALLINT NOT NULL,
  unit                            VARCHAR(20) NOT NULL,
  quantity                        NUMERIC(18,3) NOT NULL CHECK (quantity > 0),
  unit_rate                       NUMERIC(18,4) NOT NULL CHECK (unit_rate >= 0),
  amount                          NUMERIC(18,2) GENERATED ALWAYS AS (quantity * unit_rate) STORED,
  sequence_no                     INTEGER NOT NULL,
  source_rfq_item_id              UUID REFERENCES com_rfq_items(rfq_item_id),
  source_quotation_item_id        UUID REFERENCES com_quotation_items(quotation_item_id),
  remarks                         TEXT,
  company_id                      UUID NOT NULL REFERENCES companies(id),
  branch_id                       UUID REFERENCES branches(id),
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                       UUID NOT NULL REFERENCES users(id),
  updated_at                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                       UUID REFERENCES users(id),
  deleted_at                       TIMESTAMPTZ,
  deleted_by                       UUID REFERENCES users(id),
  CHECK (com_fn_word_count(description) BETWEEN 1 AND 50),
  CHECK (parent_item_id IS NULL OR parent_item_id <> boq_item_id)
);
CREATE INDEX IF NOT EXISTS idx_com_boqitems_boq ON com_boq_items(boq_id);
CREATE INDEX IF NOT EXISTS idx_com_boqitems_parent ON com_boq_items(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_com_boqitems_srcrfq ON com_boq_items(source_rfq_item_id);
CREATE INDEX IF NOT EXISTS idx_com_boqitems_srcquote ON com_boq_items(source_quotation_item_id);

CREATE OR REPLACE FUNCTION com_fn_set_boq_word_count() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.description_word_count := com_fn_word_count(NEW.description);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_com_boqitems_wordcount ON com_boq_items;
CREATE TRIGGER trg_com_boqitems_wordcount
BEFORE INSERT OR UPDATE OF description ON com_boq_items
FOR EACH ROW EXECUTE FUNCTION com_fn_set_boq_word_count();
