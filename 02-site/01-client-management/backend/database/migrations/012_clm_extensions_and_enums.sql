-- ============================================================
-- SAV ERP - Sites Module - Client Management Submodule (clm_*)
-- 012: ENUM types + extension of existing Commercial Lifecycle
--      polymorphic ENUMs (architecture doc §2/§9: Documents/Approvals
--      are reused, not duplicated - com_documents/com_approvals grow new
--      entity_type values instead of a new table).
-- External dependencies (NOT created here): companies, branches, users,
--   employees, projects, sites, taxes, com_po, com_boq, com_boq_items,
--   com_documents, com_approvals, com_audit_log (Commercial Lifecycle module)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE clm_client_status AS ENUM ('Prospect','Active','Inactive','Blacklisted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE clm_requirement_priority AS ENUM ('Low','Medium','High','Urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE clm_requirement_status AS ENUM
    ('New','Under Review','Converted to RFQ','Under Estimation','Quoted','Won','Lost','Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE clm_invoice_status AS ENUM
    ('Draft','Submitted','Approved','Partially Paid','Paid','Overdue','Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE clm_payment_method AS ENUM ('Bank Transfer','Cheque','DD','UPI','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE clm_verification_status AS ENUM ('Pending','Verified','Rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- Only entities this module owns get a tracked status-history row (architecture
  -- doc §6.11 design note) - RFQ/BOQ/PO status history stays owned by Commercial
  -- Lifecycle. Client itself is intentionally excluded here too (doc §17) - client
  -- status changes are captured via com_audit_log's StatusChange action only.
  CREATE TYPE clm_status_entity_type AS ENUM ('ClientRequirement','ClientInvoice');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Extend existing Commercial Lifecycle polymorphic ENUMs ----------
-- (architecture doc §5/§9 escalation: Documents and Approvals are reused, not
-- duplicated, for Client/ClientContact/ClientRequirement/ClientInvoice/ClientPayment.)
ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'Client';
ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'ClientContact';
ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'ClientRequirement';
ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'ClientInvoice';
ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'ClientPayment';

ALTER TYPE com_approval_entity_type ADD VALUE IF NOT EXISTS 'ClientInvoice';
