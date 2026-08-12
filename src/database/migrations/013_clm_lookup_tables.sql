-- ============================================================
-- 013: Client Management - Lookup tables (architecture doc §6.1/§6.2/§6.4 note)
-- ============================================================

CREATE TABLE IF NOT EXISTS clm_client_type (
  client_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name      VARCHAR(100) NOT NULL UNIQUE,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS clm_industry (
  industry_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_name VARCHAR(100) NOT NULL UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID NOT NULL REFERENCES users(id)
);

-- Lookup rather than a hardcoded ENUM (doc §6.4 note): new contact roles are
-- likely to be added operationally without a schema migration, mirroring the
-- com_item_category lookup-vs-ENUM precedent already used in Commercial Lifecycle.
CREATE TABLE IF NOT EXISTS clm_contact_type (
  contact_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name       VARCHAR(100) NOT NULL UNIQUE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID NOT NULL REFERENCES users(id)
);
