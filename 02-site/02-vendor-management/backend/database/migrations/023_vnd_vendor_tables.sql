-- ============================================================
-- 023: Vendor Management submodule - Vendor Master + Contacts + Bank Accounts + Materials/Services
-- (architecture doc §6.6-§6.9)
-- ============================================================

CREATE TABLE IF NOT EXISTS vnd_vendor (
  vendor_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_code                    VARCHAR(30) NOT NULL UNIQUE,
  vendor_name                      VARCHAR(200) NOT NULL,
  vendor_type_id                     UUID NOT NULL REFERENCES vnd_vendor_type(vendor_type_id),
  company_type                         VARCHAR(50),
  registration_date                      DATE,
  address_line1                            VARCHAR(255) NOT NULL,
  address_line2                              VARCHAR(255),
  city                                         VARCHAR(100) NOT NULL,
  state                                          VARCHAR(100) NOT NULL,
  country                                          VARCHAR(100) NOT NULL DEFAULT 'India',
  pincode                                            VARCHAR(12) NOT NULL,
  website                                              VARCHAR(200),
  gst_number                                             VARCHAR(15),
  pan_number                                               VARCHAR(10),
  gst_registration_type                                      VARCHAR(50),
  msme_status                                                  BOOLEAN NOT NULL DEFAULT false,
  msme_number                                                    VARCHAR(30),
  company_registration_number                                      VARCHAR(50),
  tds_applicable                                                     BOOLEAN NOT NULL DEFAULT true,
  tds_category                                                         VARCHAR(50),
  vendor_status                                                          vnd_vendor_status NOT NULL DEFAULT 'Active',
  notes                                                                     TEXT,
  company_id                                                                 UUID NOT NULL REFERENCES companies(id),
  branch_id                                                                    UUID REFERENCES branches(id),
  created_at                                                                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                                                       UUID NOT NULL REFERENCES users(id),
  updated_at                                                                         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                                           UUID REFERENCES users(id),
  deleted_at                                                                             TIMESTAMPTZ,
  deleted_by                                                                               UUID REFERENCES users(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_vnd_vendor_gst ON vnd_vendor(gst_number) WHERE gst_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vnd_vendor_status ON vnd_vendor(vendor_status);
CREATE INDEX IF NOT EXISTS idx_vnd_vendor_name ON vnd_vendor(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vnd_vendor_type ON vnd_vendor(vendor_type_id);

-- ---------- VENDOR CONTACTS ----------
CREATE TABLE IF NOT EXISTS vnd_vendor_contact (
  vendor_contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  contact_name          VARCHAR(150) NOT NULL,
  designation             VARCHAR(100),
  contact_role             VARCHAR(50) NOT NULL DEFAULT 'General',
  mobile_number              VARCHAR(20) NOT NULL,
  alternate_number             VARCHAR(20),
  email                          VARCHAR(150),
  is_primary_contact               BOOLEAN NOT NULL DEFAULT false,
  is_active                          BOOLEAN NOT NULL DEFAULT true,
  company_id                          UUID NOT NULL REFERENCES companies(id),
  branch_id                             UUID REFERENCES branches(id),
  created_at                              TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                UUID NOT NULL REFERENCES users(id),
  updated_at                                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                    UUID REFERENCES users(id),
  deleted_at                                      TIMESTAMPTZ,
  deleted_by                                        UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_vnd_contact_vendor ON vnd_vendor_contact(vendor_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_vnd_contact_primary ON vnd_vendor_contact(vendor_id)
  WHERE is_primary_contact = true AND deleted_at IS NULL;

-- ---------- VENDOR BANK ACCOUNTS (sensitive - doc §20 masking/reveal-permission recommendation) ----------
CREATE TABLE IF NOT EXISTS vnd_vendor_bank_account (
  bank_account_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  account_holder_name     VARCHAR(150) NOT NULL,
  bank_name                 VARCHAR(150) NOT NULL,
  account_number              VARCHAR(30) NOT NULL,
  ifsc_code                     VARCHAR(11) NOT NULL,
  branch                          VARCHAR(150),
  account_type                     VARCHAR(20),
  upi_id                              VARCHAR(100),
  is_primary                           BOOLEAN NOT NULL DEFAULT true,
  is_verified                            BOOLEAN NOT NULL DEFAULT false,
  verified_at                              TIMESTAMPTZ,
  verified_by                                UUID REFERENCES users(id),
  company_id                                   UUID NOT NULL REFERENCES companies(id),
  branch_id                                      UUID REFERENCES branches(id),
  created_at                                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                         UUID NOT NULL REFERENCES users(id),
  updated_at                                           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                             UUID REFERENCES users(id),
  deleted_at                                               TIMESTAMPTZ,
  deleted_by                                                 UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_vnd_bank_vendor ON vnd_vendor_bank_account(vendor_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_vnd_bank_primary ON vnd_vendor_bank_account(vendor_id)
  WHERE is_primary = true AND deleted_at IS NULL;

-- ---------- MATERIALS / SERVICES CATALOG ----------
CREATE TABLE IF NOT EXISTS vnd_material_service (
  material_service_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id               UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  material_category_id      UUID REFERENCES vnd_material_category(material_category_id),
  item_name                   VARCHAR(200) NOT NULL,
  description                   TEXT,
  unit                            VARCHAR(20) NOT NULL,
  standard_rate                     NUMERIC(18,4) CHECK (standard_rate IS NULL OR standard_rate >= 0),
  tax_rate                             NUMERIC(5,2) NOT NULL DEFAULT 0,
  minimum_order_quantity                 NUMERIC(18,3) CHECK (minimum_order_quantity IS NULL OR minimum_order_quantity >= 0),
  delivery_time_days                       INTEGER,
  is_active                                  BOOLEAN NOT NULL DEFAULT true,
  company_id                                   UUID NOT NULL REFERENCES companies(id),
  branch_id                                      UUID REFERENCES branches(id),
  created_at                                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                         UUID NOT NULL REFERENCES users(id),
  updated_at                                           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                             UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_vnd_matsvc_vendor ON vnd_material_service(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vnd_matsvc_name ON vnd_material_service(item_name);
