-- ============================================================
-- 006: Market Price Reference (append-only) + Actual Price (+ history)
-- ============================================================

CREATE TABLE IF NOT EXISTS com_market_price_reference (
  market_price_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_item_id       UUID NOT NULL REFERENCES com_rfq_items(rfq_item_id) ON DELETE RESTRICT,
  source_type_id    UUID NOT NULL REFERENCES com_price_source_type(source_type_id),
  source_reference  VARCHAR(200),
  rate              NUMERIC(18,4) NOT NULL CHECK (rate >= 0),
  unit              VARCHAR(20) NOT NULL,
  currency_id       UUID NOT NULL REFERENCES currencies(id),
  price_date        DATE NOT NULL,
  remarks           TEXT,
  company_id        UUID NOT NULL REFERENCES companies(id),
  branch_id         UUID REFERENCES branches(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID NOT NULL REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_com_mktprice_item_date ON com_market_price_reference(rfq_item_id, price_date);

CREATE TABLE IF NOT EXISTS com_actual_price (
  actual_price_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_item_id            UUID NOT NULL UNIQUE REFERENCES com_rfq_items(rfq_item_id) ON DELETE RESTRICT,
  actual_rate            NUMERIC(18,4) NOT NULL CHECK (actual_rate >= 0),
  unit                   VARCHAR(20) NOT NULL,
  currency_id            UUID NOT NULL REFERENCES currencies(id),
  price_basis            com_price_basis NOT NULL,
  price_source_reference VARCHAR(200),
  price_date             DATE NOT NULL,
  remarks                TEXT,
  company_id             UUID NOT NULL REFERENCES companies(id),
  branch_id              UUID REFERENCES branches(id),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by             UUID NOT NULL REFERENCES users(id),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by             UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS com_actual_price_history (
  actual_price_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_item_id               UUID NOT NULL REFERENCES com_rfq_items(rfq_item_id) ON DELETE RESTRICT,
  actual_rate                NUMERIC(18,4) NOT NULL,
  price_basis                com_price_basis NOT NULL,
  price_source_reference     VARCHAR(200),
  price_date                 DATE NOT NULL,
  changed_by                 UUID NOT NULL REFERENCES users(id),
  changed_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  remarks                    TEXT
);
CREATE INDEX IF NOT EXISTS idx_com_actpricehist_item ON com_actual_price_history(rfq_item_id, changed_at);
