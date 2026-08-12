-- ============================================================
-- 017: Client Management - Payment + Payment Allocation (architecture doc §6.9/§6.10)
--
-- No invoice_id on clm_payment (doc §6.9 design note): a single payment
-- routinely covers multiple invoices, or an invoice is settled by multiple
-- payments (many-to-many) - allocation is handled entirely through
-- clm_payment_allocation.
-- ============================================================

CREATE TABLE IF NOT EXISTS clm_payment (
  payment_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference_number    VARCHAR(100) NOT NULL UNIQUE,
  client_id                      UUID NOT NULL REFERENCES clm_client(client_id) ON DELETE RESTRICT,
  project_id                        UUID REFERENCES projects(id),
  payment_date                         DATE NOT NULL,
  amount                                   NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  payment_method                              clm_payment_method NOT NULL,
  bank_reference_details                         VARCHAR(200),
  verification_status                               clm_verification_status NOT NULL DEFAULT 'Pending',
  verified_by                                          UUID REFERENCES users(id),
  remarks                                                 TEXT,
  company_id                                                 UUID NOT NULL REFERENCES companies(id),
  branch_id                                                     UUID REFERENCES branches(id),
  created_at                                                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                                          UUID NOT NULL REFERENCES users(id),
  updated_at                                                             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                                UUID REFERENCES users(id),
  deleted_at                                                                   TIMESTAMPTZ,
  deleted_by                                                                      UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_clm_payment_client ON clm_payment(client_id);
CREATE INDEX IF NOT EXISTS idx_clm_payment_date ON clm_payment(payment_date);
CREATE INDEX IF NOT EXISTS idx_clm_payment_verification ON clm_payment(verification_status);

-- ---------- PAYMENT ALLOCATION (append-only junction) ----------
CREATE TABLE IF NOT EXISTS clm_payment_allocation (
  allocation_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id            UUID NOT NULL REFERENCES clm_payment(payment_id) ON DELETE RESTRICT,
  invoice_id               UUID NOT NULL REFERENCES clm_client_invoice(invoice_id) ON DELETE RESTRICT,
  allocated_amount            NUMERIC(18,2) NOT NULL CHECK (allocated_amount > 0),
  allocated_date                  DATE NOT NULL,
  remarks                            TEXT,
  company_id                            UUID NOT NULL REFERENCES companies(id),
  branch_id                                UUID REFERENCES branches(id),
  created_at                                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                     UUID NOT NULL REFERENCES users(id),
  UNIQUE (payment_id, invoice_id)
);
CREATE INDEX IF NOT EXISTS idx_clm_alloc_payment ON clm_payment_allocation(payment_id);
CREATE INDEX IF NOT EXISTS idx_clm_alloc_invoice ON clm_payment_allocation(invoice_id);

-- Guard: allocations cannot exceed the payment amount or the invoice net amount
-- (CHECK constraints cannot aggregate across rows - doc §6.10 - so this is an
-- AFTER INSERT trigger raising an exception instead).
CREATE OR REPLACE FUNCTION clm_fn_check_allocation() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  v_payment_total NUMERIC(18,2);
  v_payment_amount NUMERIC(18,2);
  v_invoice_total NUMERIC(18,2);
  v_invoice_net NUMERIC(18,2);
BEGIN
  SELECT COALESCE(SUM(allocated_amount),0) INTO v_payment_total
    FROM clm_payment_allocation WHERE payment_id = NEW.payment_id;
  SELECT amount INTO v_payment_amount FROM clm_payment WHERE payment_id = NEW.payment_id;
  IF v_payment_total > v_payment_amount THEN
    RAISE EXCEPTION 'Allocated amount exceeds payment amount for payment_id %', NEW.payment_id;
  END IF;

  SELECT COALESCE(SUM(allocated_amount),0) INTO v_invoice_total
    FROM clm_payment_allocation WHERE invoice_id = NEW.invoice_id;
  SELECT net_amount INTO v_invoice_net FROM clm_client_invoice WHERE invoice_id = NEW.invoice_id;
  IF v_invoice_total > v_invoice_net THEN
    RAISE EXCEPTION 'Allocated amount exceeds invoice net amount for invoice_id %', NEW.invoice_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_clm_check_allocation ON clm_payment_allocation;
CREATE TRIGGER trg_clm_check_allocation
AFTER INSERT ON clm_payment_allocation
FOR EACH ROW EXECUTE FUNCTION clm_fn_check_allocation();
