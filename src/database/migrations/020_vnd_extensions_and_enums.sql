-- ============================================================
-- SAV ERP - Sites Module - Vendor Management & Procurement submodule (vnd_*)
-- + Client Management extension: Project / Project Cost / Project Expense (clm_project*)
-- + RBAC (sec_*)
-- 020: ENUM types + extension of existing Commercial Lifecycle polymorphic
--      ENUMs/tables (architecture doc SAV_ERP_Sites_Vendor_Procurement_Module_Architecture.md
--      §8/§11/§12 - Documents/Approvals/Audit are reused, not duplicated).
-- External dependencies (NOT created here): companies, branches, users,
--   employees, currencies, taxes, clm_client, clm_client_requirement,
--   clm_client_invoice, clm_client_invoice_line, clm_payment,
--   clm_payment_allocation (Client Management submodule), com_po, com_boq,
--   com_documents, com_approvals, com_audit_log (Commercial Lifecycle module)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE clm_project_status AS ENUM
    ('Planning','Estimation','Approved','In Progress','On Hold','Completed','Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE clm_cost_category AS ENUM
    ('Material','Labour','Equipment','Transportation','Subcontractor','Overhead','Contingency','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE clm_expense_payment_status AS ENUM ('Unpaid','Partially Paid','Paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE clm_approval_status_simple AS ENUM ('Pending','Approved','Rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vnd_vendor_status AS ENUM ('Active','Inactive','Blacklisted','Under Review');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vnd_po_status AS ENUM
    ('Draft','Pending Approval','Approved','Sent to Vendor','Partially Received','Received','Closed','Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vnd_approval_status AS ENUM ('Not Required','Pending','Manager Approved','Finance Approved','Rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vnd_invoice_status AS ENUM
    ('Draft','Submitted','Verified','Approved','Partially Paid','Paid','Disputed','Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vnd_payment_method AS ENUM ('Bank Transfer','Cheque','UPI','Cash','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vnd_payment_status AS ENUM ('Pending','Processed','Failed','Reversed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Extend existing Commercial Lifecycle polymorphic ENUMs (doc §8/§11/§12) ----------
ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'Project';
ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'Vendor';
ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'VendorContact';
ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'ProcurementPO';
ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'VendorInvoice';
ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'VendorPayment';

ALTER TYPE com_approval_entity_type ADD VALUE IF NOT EXISTS 'ProcurementPO';
ALTER TYPE com_approval_entity_type ADD VALUE IF NOT EXISTS 'VendorInvoice';
ALTER TYPE com_approval_entity_type ADD VALUE IF NOT EXISTS 'VendorPayment';

ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Approve';
ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Reject';
ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Submit';
ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Cancel';
ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Payment';
ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Upload';
ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Download';

-- ---------- Additive columns on the existing com_documents table (doc §12) ----------
ALTER TABLE com_documents ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE com_documents ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) NOT NULL DEFAULT 'Pending';
CREATE INDEX IF NOT EXISTS idx_com_documents_expiry ON com_documents(expiry_date) WHERE expiry_date IS NOT NULL;
