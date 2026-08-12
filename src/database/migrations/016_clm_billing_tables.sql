-- ============================================================
-- 016: Client Management - Client Invoice (Billing) + Invoice Lines (architecture doc §6.7/§6.8)
--
-- No stored paid_amount/balance_amount (doc §6.7 design note): outstanding is
-- always computed from clm_payment_allocation, never stored - see
-- v_client_billing_summary in 019_clm_views.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS clm_client_invoice (
  invoice_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number            VARCHAR(50) NOT NULL UNIQUE,
  client_id                    UUID NOT NULL REFERENCES clm_client(client_id) ON DELETE RESTRICT,
  project_id                      UUID NOT NULL REFERENCES projects(id),
  po_id                              UUID REFERENCES com_po(po_id),
  boq_id                                UUID REFERENCES com_boq(boq_id),
  invoice_date                            DATE NOT NULL,
  billing_period_start                       DATE,
  billing_period_end                            DATE,
  gross_amount                                     NUMERIC(18,2) NOT NULL CHECK (gross_amount >= 0),
  tax_amount                                          NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  deduction_amount                                       NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (deduction_amount >= 0),
  retention_amount                                          NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (retention_amount >= 0),
  net_amount                                                   NUMERIC(18,2) GENERATED ALWAYS AS
    (gross_amount + tax_amount - deduction_amount - retention_amount) STORED,
  due_date                                                        DATE,
  status                                                             clm_invoice_status NOT NULL DEFAULT 'Draft',
  remarks                                                               TEXT,
  company_id                                                              UUID NOT NULL REFERENCES companies(id),
  branch_id                                                                 UUID REFERENCES branches(id),
  created_at                                                                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                                                    UUID NOT NULL REFERENCES users(id),
  updated_at                                                                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                                        UUID REFERENCES users(id),
  deleted_at                                                                          TIMESTAMPTZ,
  deleted_by                                                                            UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_clm_invoice_client ON clm_client_invoice(client_id);
CREATE INDEX IF NOT EXISTS idx_clm_invoice_project ON clm_client_invoice(project_id);
CREATE INDEX IF NOT EXISTS idx_clm_invoice_po ON clm_client_invoice(po_id);
CREATE INDEX IF NOT EXISTS idx_clm_invoice_status ON clm_client_invoice(status);
CREATE INDEX IF NOT EXISTS idx_clm_invoice_duedate ON clm_client_invoice(due_date);

-- ---------- CLIENT INVOICE LINES ----------
CREATE TABLE IF NOT EXISTS clm_client_invoice_line (
  invoice_line_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id             UUID NOT NULL REFERENCES clm_client_invoice(invoice_id) ON DELETE RESTRICT,
  boq_item_id               UUID REFERENCES com_boq_items(boq_item_id),
  description                  TEXT NOT NULL,
  unit                            VARCHAR(20),
  quantity                          NUMERIC(18,3) CHECK (quantity IS NULL OR quantity > 0),
  rate                                 NUMERIC(18,4) CHECK (rate IS NULL OR rate >= 0),
  line_amount                             NUMERIC(18,2) NOT NULL CHECK (line_amount >= 0),
  sequence_no                                INTEGER NOT NULL,
  remarks                                       TEXT,
  company_id                                       UUID NOT NULL REFERENCES companies(id),
  branch_id                                          UUID REFERENCES branches(id),
  created_at                                            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                              UUID NOT NULL REFERENCES users(id),
  updated_at                                                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                  UUID REFERENCES users(id),
  deleted_at                                                    TIMESTAMPTZ,
  deleted_by                                                      UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_clm_invline_invoice ON clm_client_invoice_line(invoice_id);
CREATE INDEX IF NOT EXISTS idx_clm_invline_boqitem ON clm_client_invoice_line(boq_item_id);
