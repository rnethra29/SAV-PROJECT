-- ============================================================
-- 007: Quotation (versioned) + Quotation Items + Negotiation Offers (append-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS com_quotation (
  quotation_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id                UUID NOT NULL REFERENCES com_rfq(rfq_id) ON DELETE RESTRICT,
  project_id            UUID NOT NULL REFERENCES projects(id),
  client_id             UUID NOT NULL REFERENCES clients(id),
  quotation_number     VARCHAR(50) NOT NULL,
  version_no            INTEGER NOT NULL DEFAULT 1 CHECK (version_no >= 1),
  previous_version_id  UUID REFERENCES com_quotation(quotation_id),
  quotation_date       DATE NOT NULL,
  validity_date         DATE,
  status                com_quotation_status NOT NULL DEFAULT 'Draft',
  payment_terms         TEXT,
  execution_period      TEXT,
  inclusions            TEXT,
  exclusions            TEXT,
  commercial_terms      TEXT,
  subtotal_amount       NUMERIC(18,2),
  tax_amount            NUMERIC(18,2) DEFAULT 0,
  total_amount          NUMERIC(18,2),
  remarks               TEXT,
  company_id            UUID NOT NULL REFERENCES companies(id),
  branch_id             UUID REFERENCES branches(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            UUID NOT NULL REFERENCES users(id),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by            UUID REFERENCES users(id),
  deleted_at            TIMESTAMPTZ,
  deleted_by            UUID REFERENCES users(id),
  UNIQUE (quotation_number, version_no),
  CHECK (previous_version_id IS NULL OR previous_version_id <> quotation_id)
);
CREATE INDEX IF NOT EXISTS idx_com_quotation_rfq ON com_quotation(rfq_id);
CREATE INDEX IF NOT EXISTS idx_com_quotation_status ON com_quotation(status);

CREATE TABLE IF NOT EXISTS com_quotation_items (
  quotation_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id        UUID NOT NULL REFERENCES com_quotation(quotation_id) ON DELETE RESTRICT,
  rfq_item_id          UUID NOT NULL REFERENCES com_rfq_items(rfq_item_id) ON DELETE RESTRICT,
  estimation_item_id  UUID REFERENCES com_estimation_items(estimation_item_id),
  item_code            VARCHAR(30) NOT NULL,
  quantity              NUMERIC(18,3) NOT NULL CHECK (quantity > 0),
  unit                  VARCHAR(20) NOT NULL,
  quoted_rate           NUMERIC(18,4) NOT NULL CHECK (quoted_rate >= 0),
  quoted_amount         NUMERIC(18,2) GENERATED ALWAYS AS (quantity * quoted_rate) STORED,
  tax_percentage        NUMERIC(5,2) DEFAULT 0,
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
CREATE INDEX IF NOT EXISTS idx_com_quoteitems_quotation ON com_quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_com_quoteitems_rfqitem ON com_quotation_items(rfq_item_id);

CREATE TABLE IF NOT EXISTS com_negotiation_offers (
  offer_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id             UUID NOT NULL REFERENCES com_quotation(quotation_id) ON DELETE RESTRICT,
  quotation_item_id        UUID REFERENCES com_quotation_items(quotation_item_id),
  offer_type               com_offer_type NOT NULL,
  offered_amount           NUMERIC(18,2),
  offered_rate              NUMERIC(18,4),
  offered_by                com_offer_party NOT NULL,
  offer_date                TIMESTAMPTZ NOT NULL DEFAULT now(),
  response_status           com_offer_response_status NOT NULL DEFAULT 'Pending',
  payment_terms             TEXT,
  validity_date              DATE,
  commercial_conditions      TEXT,
  is_final                   BOOLEAN NOT NULL DEFAULT false,
  remarks                    TEXT,
  company_id                 UUID NOT NULL REFERENCES companies(id),
  branch_id                  UUID REFERENCES branches(id),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                 UUID NOT NULL REFERENCES users(id),
  CHECK ( (quotation_item_id IS NULL AND offered_amount IS NOT NULL AND offered_rate IS NULL)
       OR (quotation_item_id IS NOT NULL AND offered_rate IS NOT NULL AND offered_amount IS NULL) )
);
CREATE INDEX IF NOT EXISTS idx_com_negoffers_quoteitem_date ON com_negotiation_offers(quotation_item_id, offer_date);
CREATE INDEX IF NOT EXISTS idx_com_negoffers_quote_date ON com_negotiation_offers(quotation_id, offer_date);
