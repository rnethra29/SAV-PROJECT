-- ============================================================
-- SAV ERP - Commercial Lifecycle Module
-- 001: Extensions + ENUM types
-- External master-table dependencies (NOT created here):
--   companies, branches, users, clients, projects, sites, vendors, currencies, taxes
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE com_rfq_status AS ENUM
    ('Draft','Received','Under Review','Under Estimation','Quotation Prepared',
     'Submitted','Negotiation','Won','Lost','Cancelled','Expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_estimation_status AS ENUM
    ('Draft','In Progress','Submitted for Approval','Approved','Rejected','Revised');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_quotation_status AS ENUM
    ('Draft','Under Approval','Approved','Submitted','Revised','Accepted','Rejected','Expired','Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_boq_type AS ENUM ('Tentative','Final');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_boq_status AS ENUM
    ('Draft','Tentative','Under Review','Approved','Final','Revised','Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_po_status AS ENUM
    ('Draft','Under Approval','Approved','Issued','Acknowledged','Cancelled','Closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_price_basis AS ENUM
    ('Current Market','Vendor Price','Internal Purchase','Historical Project','Approved Estimation Rate','Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_offer_type AS ENUM
    ('SAV_Quote','Client_Offer','SAV_Counter','Client_Counter','Final');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_offer_party AS ENUM ('SAV','Client');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_offer_response_status AS ENUM ('Pending','Accepted','Rejected','Countered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_document_entity_type AS ENUM
    ('RFQ','Estimation','Quotation','Negotiation','ClientOffer','BOQ','PO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_document_status AS ENUM ('Active','Superseded','Archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_approval_entity_type AS ENUM
    ('RFQ','Estimation','Quotation','FinalCommercialDecision','BOQ','PO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_approval_status AS ENUM ('Pending','Approved','Rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE com_audit_action AS ENUM ('Insert','Update','Delete','StatusChange');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
