-- ============================================================
-- 028: Client Management extension - Project Expense (architecture doc §6.3)
--
-- Must run after clm_project, vnd_vendor, vnd_purchase_order, com_po, and
-- vnd_vendor_invoice all exist (doc's Phase 16 migration-order rule #4) -
-- references almost everything above.
-- ============================================================

CREATE TABLE IF NOT EXISTS clm_project_expense (
  expense_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             UUID NOT NULL REFERENCES clm_project(project_id) ON DELETE RESTRICT,
  expense_category         clm_cost_category NOT NULL,
  vendor_id                   UUID REFERENCES vnd_vendor(vendor_id),
  purchase_order_id             UUID REFERENCES vnd_purchase_order(po_id),
  subcontract_po_id                UUID REFERENCES com_po(po_id),
  vendor_invoice_id                   UUID REFERENCES vnd_vendor_invoice(vendor_invoice_id),
  description                           TEXT NOT NULL,
  amount                                  NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  expense_date                              DATE NOT NULL,
  payment_status                              clm_expense_payment_status NOT NULL DEFAULT 'Unpaid',
  approval_status                               clm_approval_status_simple NOT NULL DEFAULT 'Pending',
  remarks                                         TEXT,
  company_id                                        UUID NOT NULL REFERENCES companies(id),
  branch_id                                           UUID REFERENCES branches(id),
  created_at                                            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                              UUID NOT NULL REFERENCES users(id),
  updated_at                                                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                  UUID REFERENCES users(id),
  deleted_at                                                    TIMESTAMPTZ,
  deleted_by                                                      UUID REFERENCES users(id),
  CHECK (vendor_id IS NOT NULL OR purchase_order_id IS NOT NULL
         OR subcontract_po_id IS NOT NULL OR expense_category = 'Other')
);
CREATE INDEX IF NOT EXISTS idx_clmexpense_project ON clm_project_expense(project_id);
CREATE INDEX IF NOT EXISTS idx_clmexpense_vendor ON clm_project_expense(vendor_id);
CREATE INDEX IF NOT EXISTS idx_clmexpense_po ON clm_project_expense(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_clmexpense_category ON clm_project_expense(expense_category);
CREATE INDEX IF NOT EXISTS idx_clmexpense_date ON clm_project_expense(expense_date);
