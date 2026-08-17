-- ============================================================
-- 021: Vendor Management submodule - Lookup tables (architecture doc §6.4/§6.5)
-- ============================================================

CREATE TABLE IF NOT EXISTS vnd_vendor_type (
  vendor_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name      VARCHAR(100) NOT NULL UNIQUE,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS vnd_material_category (
  material_category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name         VARCHAR(100) NOT NULL UNIQUE,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            UUID NOT NULL REFERENCES users(id)
);
