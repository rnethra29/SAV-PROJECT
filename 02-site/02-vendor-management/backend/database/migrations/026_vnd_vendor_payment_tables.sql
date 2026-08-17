-- ============================================================
-- 026: Vendor Management submodule - Vendor Payment + Payment Allocation
-- (architecture doc §6.15/§6.16)
-- ============================================================

CREATE TABLE IF NOT EXISTS vnd_vendor_payment (
  vendor_payment_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference_number  VARCHAR(100) NOT NULL UNIQUE,
  vendor_id                    UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  project_id                     UUID REFERENCES clm_project(project_id),
  bank_account_id                  UUID REFERENCES vnd_vendor_bank_account(bank_account_id),
  payment_date                       DATE NOT NULL,
  amount                                NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  payment_method                          vnd_payment_method NOT NULL,
  transaction_reference                     VARCHAR(100),
  payment_status                              vnd_payment_status NOT NULL DEFAULT 'Pending',
  remarks                                       TEXT,
  approved_by                                     UUID REFERENCES users(id),
  company_id                                        UUID NOT NULL REFERENCES companies(id),
  branch_id                                           UUID REFERENCES branches(id),
  created_at                                            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                              UUID NOT NULL REFERENCES users(id),
  updated_at                                                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                  UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_vnd_vpay_vendor ON vnd_vendor_payment(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vnd_vpay_date ON vnd_vendor_payment(payment_date);
CREATE INDEX IF NOT EXISTS idx_vnd_vpay_status ON vnd_vendor_payment(payment_status);

-- ---------- VENDOR PAYMENT ALLOCATION (append-only junction) ----------
CREATE TABLE IF NOT EXISTS vnd_vendor_payment_allocation (
  allocation_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_payment_id     UUID NOT NULL REFERENCES vnd_vendor_payment(vendor_payment_id) ON DELETE RESTRICT,
  vendor_invoice_id        UUID NOT NULL REFERENCES vnd_vendor_invoice(vendor_invoice_id) ON DELETE RESTRICT,
  allocated_amount           NUMERIC(18,2) NOT NULL CHECK (allocated_amount > 0),
  allocated_date                DATE NOT NULL,
  company_id                      UUID NOT NULL REFERENCES companies(id),
  branch_id                         UUID REFERENCES branches(id),
  created_at                          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                            UUID NOT NULL REFERENCES users(id),
  UNIQUE (vendor_payment_id, vendor_invoice_id)
);
CREATE INDEX IF NOT EXISTS idx_vnd_alloc_payment ON vnd_vendor_payment_allocation(vendor_payment_id);
CREATE INDEX IF NOT EXISTS idx_vnd_alloc_invoice ON vnd_vendor_payment_allocation(vendor_invoice_id);

-- Guard: allocations cannot exceed the payment amount or the invoice total (same pattern as clm_fn_check_allocation)
CREATE OR REPLACE FUNCTION vnd_fn_check_allocation() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE v_payment_total NUMERIC(18,2); v_payment_amount NUMERIC(18,2);
        v_invoice_total NUMERIC(18,2); v_invoice_amount NUMERIC(18,2);
BEGIN
  SELECT COALESCE(SUM(allocated_amount),0) INTO v_payment_total FROM vnd_vendor_payment_allocation WHERE vendor_payment_id = NEW.vendor_payment_id;
  SELECT amount INTO v_payment_amount FROM vnd_vendor_payment WHERE vendor_payment_id = NEW.vendor_payment_id;
  IF v_payment_total > v_payment_amount THEN
    RAISE EXCEPTION 'Allocated amount exceeds vendor payment amount for %', NEW.vendor_payment_id;
  END IF;
  SELECT COALESCE(SUM(allocated_amount),0) INTO v_invoice_total FROM vnd_vendor_payment_allocation WHERE vendor_invoice_id = NEW.vendor_invoice_id;
  SELECT total_amount INTO v_invoice_amount FROM vnd_vendor_invoice WHERE vendor_invoice_id = NEW.vendor_invoice_id;
  IF v_invoice_total > v_invoice_amount THEN
    RAISE EXCEPTION 'Allocated amount exceeds vendor invoice amount for %', NEW.vendor_invoice_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_vnd_check_allocation ON vnd_vendor_payment_allocation;
CREATE TRIGGER trg_vnd_check_allocation
AFTER INSERT ON vnd_vendor_payment_allocation
FOR EACH ROW EXECUTE FUNCTION vnd_fn_check_allocation();
