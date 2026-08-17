-- ============================================================
-- 003: Lookup tables
-- ============================================================

CREATE TABLE IF NOT EXISTS com_item_category (
  category_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(100) NOT NULL UNIQUE,
  sequence_no   INTEGER NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID NOT NULL REFERENCES users(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by    UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS com_price_source_type (
  source_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name    VARCHAR(100) NOT NULL UNIQUE,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS com_document_category (
  document_category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name        VARCHAR(100) NOT NULL UNIQUE,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            UUID NOT NULL REFERENCES users(id)
);
