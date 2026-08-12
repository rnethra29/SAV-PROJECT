-- ============================================================
-- 014: Client Management - Client Master + Client Contacts (architecture doc §6.3/§6.4)
--
-- Note (doc escalation #1/#3, top of architecture file): clm_client is the
-- *candidate* authoritative client master, flagged for a field-by-field
-- reconciliation pass against the separate Module 04 "Client + Vendor" spec
-- before this is final. com_rfq.client_id / com_boq.client_id / com_po
-- (via boq) still target the external `clients(id)` table as-is (see
-- 004_rfq_tables.sql) - reconciling that FK target is out of scope for this
-- migration and is called out again at the bottom of this file.
-- ============================================================

CREATE TABLE IF NOT EXISTS clm_client (
  client_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_code                VARCHAR(30) NOT NULL UNIQUE,
  legal_name                 VARCHAR(200) NOT NULL,
  display_name                VARCHAR(200) NOT NULL,
  client_type_id                UUID NOT NULL REFERENCES clm_client_type(client_type_id),
  industry_id                    UUID REFERENCES clm_industry(industry_id),
  gstin                            VARCHAR(15),
  pan                                VARCHAR(10),
  registration_number                 VARCHAR(50),
  billing_address_line1                 VARCHAR(255) NOT NULL,
  billing_address_line2                   VARCHAR(255),
  billing_city                              VARCHAR(100) NOT NULL,
  billing_state                               VARCHAR(100) NOT NULL,
  billing_country                               VARCHAR(100) NOT NULL DEFAULT 'India',
  billing_pincode                                 VARCHAR(12) NOT NULL,
  registered_address_line1                          VARCHAR(255),
  registered_address_line2                            VARCHAR(255),
  registered_city                                       VARCHAR(100),
  registered_state                                        VARCHAR(100),
  registered_country                                        VARCHAR(100),
  registered_pincode                                          VARCHAR(12),
  site_office_address_line1                                     VARCHAR(255),
  site_office_city                                                 VARCHAR(100),
  site_office_state                                                  VARCHAR(100),
  primary_email                                                        VARCHAR(150) NOT NULL,
  secondary_email                                                        VARCHAR(150),
  primary_phone                                                            VARCHAR(20) NOT NULL,
  secondary_phone                                                            VARCHAR(20),
  website                                                                      VARCHAR(200),
  default_tax_id                                                                 UUID REFERENCES taxes(id),
  payment_terms                                                                    TEXT,
  credit_terms                                                                       TEXT,
  credit_limit_amount                                                                  NUMERIC(18,2) CHECK (credit_limit_amount IS NULL OR credit_limit_amount >= 0),
  client_status                                                                          clm_client_status NOT NULL DEFAULT 'Prospect',
  onboarding_date                                                                          DATE,
  notes                                                                                      TEXT,
  company_id                                                                                   UUID NOT NULL REFERENCES companies(id),
  branch_id                                                                                      UUID REFERENCES branches(id),
  created_at                                                                                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                                                                         UUID NOT NULL REFERENCES users(id),
  updated_at                                                                                           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                                                             UUID REFERENCES users(id),
  deleted_at                                                                                               TIMESTAMPTZ,
  deleted_by                                                                                                 UUID REFERENCES users(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_clm_client_gstin ON clm_client(gstin) WHERE gstin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clm_client_status ON clm_client(client_status);
CREATE INDEX IF NOT EXISTS idx_clm_client_legalname ON clm_client(legal_name);
CREATE INDEX IF NOT EXISTS idx_clm_client_displayname ON clm_client(display_name);

-- ---------- CLIENT CONTACTS ----------
CREATE TABLE IF NOT EXISTS clm_client_contact (
  contact_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID NOT NULL REFERENCES clm_client(client_id) ON DELETE RESTRICT,
  contact_name            VARCHAR(150) NOT NULL,
  designation                VARCHAR(100),
  department                   VARCHAR(100),
  email                          VARCHAR(150),
  phone                            VARCHAR(20),
  alternate_phone                    VARCHAR(20),
  contact_type_id                      UUID NOT NULL REFERENCES clm_contact_type(contact_type_id),
  is_primary_contact                     BOOLEAN NOT NULL DEFAULT false,
  is_active                                BOOLEAN NOT NULL DEFAULT true,
  notes                                      TEXT,
  company_id                                   UUID NOT NULL REFERENCES companies(id),
  branch_id                                      UUID REFERENCES branches(id),
  created_at                                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                         UUID NOT NULL REFERENCES users(id),
  updated_at                                           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                             UUID REFERENCES users(id),
  deleted_at                                               TIMESTAMPTZ,
  deleted_by                                                 UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_clm_contact_client ON clm_client_contact(client_id);
-- A client can have multiple "primary" contacts, one per department (doc §6.4):
-- scoped to (client_id, contact_type_id), not client-wide.
CREATE UNIQUE INDEX IF NOT EXISTS uq_clm_contact_primary_per_type
  ON clm_client_contact(client_id, contact_type_id)
  WHERE is_primary_contact = true AND deleted_at IS NULL;

-- Cross-reference (doc escalation #3, recommended for the unified-backend phase):
--   ALTER TABLE com_rfq DROP CONSTRAINT com_rfq_client_id_fkey,
--     ADD CONSTRAINT com_rfq_client_id_fkey FOREIGN KEY (client_id) REFERENCES clm_client(client_id);
-- Not applied here - pending Module 04 reconciliation.
