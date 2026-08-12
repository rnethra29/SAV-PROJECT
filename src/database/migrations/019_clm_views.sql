-- ============================================================
-- 019: Client Management - Derived views (architecture doc §11/§13/§12)
-- Nothing here is stored redundantly - every cross-table derived value lives
-- in a view, mirroring 011_views.sql's rule for the Commercial Lifecycle
-- module. The only generated (same-row) column in this module is
-- clm_client_invoice.net_amount, declared inline on the table itself.
--
-- IMPORTANT (doc escalation #3, top of architecture file): every join below
-- from a com_* table back to "the client" goes through client_id columns
-- that currently target the external `clients(id)` table (com_rfq.client_id,
-- com_boq.client_id - see 004_rfq_tables.sql / 008_boq_tables.sql), NOT
-- clm_client.client_id. These views join them as if reconciled (per the
-- doc's own stated assumption) - until the FK-target reconciliation lands,
-- v_client_rfq_history / v_client_boq_summary / v_client_financial_summary /
-- v_client_profit_analysis will return no rows for a given clm_client row.
-- ============================================================

-- Client overview
CREATE OR REPLACE VIEW v_client_360_overview AS
SELECT c.client_id, c.client_code, c.legal_name, c.display_name, c.client_status,
       ct.type_name AS client_type, i.industry_name
FROM clm_client c
LEFT JOIN clm_client_type ct ON ct.client_type_id = c.client_type_id
LEFT JOIN clm_industry i ON i.industry_id = c.industry_id
WHERE c.deleted_at IS NULL;

-- Project summary per client (external `projects` table - columns assumed
-- per the Project Management module's own spec, doc §7)
CREATE OR REPLACE VIEW v_client_project_summary AS
SELECT p.client_id, p.id AS project_id, p.project_name, p.status AS project_status,
       p.contract_value
FROM projects p;

-- RFQ history per client, with estimated/quoted/final-agreed rate for context
CREATE OR REPLACE VIEW v_client_rfq_history AS
SELECT r.client_id, r.rfq_id, r.rfq_number, r.rfq_date, r.status,
       vca.estimated_total_cost, qi.quoted_rate, no_final.offered_rate AS final_agreed_rate
FROM com_rfq r
LEFT JOIN v_item_commercial_analysis vca ON vca.rfq_item_id IN (
  SELECT rfq_item_id FROM com_rfq_items WHERE rfq_id = r.rfq_id)
LEFT JOIN com_quotation_items qi ON qi.rfq_item_id = vca.rfq_item_id
LEFT JOIN com_negotiation_offers no_final
  ON no_final.quotation_item_id = qi.quotation_item_id AND no_final.is_final = true
WHERE r.deleted_at IS NULL;

-- BOQ summary per client
CREATE OR REPLACE VIEW v_client_boq_summary AS
SELECT b.client_id, b.boq_id, b.boq_number, b.version_no, b.boq_type, b.status
FROM com_boq b
WHERE b.deleted_at IS NULL;

-- PO summary per client (via BOQ - com_po has no client_id column of its own),
-- with remaining value against invoiced amount
CREATE OR REPLACE VIEW v_client_po_summary AS
SELECT bq.client_id, po.po_id, po.po_number, po.total_amount AS po_value,
       COALESCE(SUM(inv.net_amount), 0) AS amount_billed,
       po.total_amount - COALESCE(SUM(inv.net_amount), 0) AS remaining_po_value
FROM com_po po
JOIN com_boq bq ON bq.boq_id = po.boq_id
LEFT JOIN clm_client_invoice inv ON inv.po_id = po.po_id AND inv.deleted_at IS NULL
WHERE po.deleted_at IS NULL
GROUP BY bq.client_id, po.po_id, po.po_number, po.total_amount;

-- Billing summary (outstanding computed, never stored)
CREATE OR REPLACE VIEW v_client_billing_summary AS
SELECT inv.invoice_id, inv.invoice_number, inv.client_id, inv.net_amount,
       COALESCE(SUM(pa.allocated_amount), 0) AS paid_amount,
       inv.net_amount - COALESCE(SUM(pa.allocated_amount), 0) AS balance_amount,
       inv.status
FROM clm_client_invoice inv
LEFT JOIN clm_payment_allocation pa ON pa.invoice_id = inv.invoice_id
WHERE inv.deleted_at IS NULL
GROUP BY inv.invoice_id, inv.invoice_number, inv.client_id, inv.net_amount, inv.status;

-- Payment summary per client
CREATE OR REPLACE VIEW v_client_payment_summary AS
SELECT p.client_id, p.payment_id, p.payment_reference_number, p.amount, p.payment_date,
       p.verification_status,
       COALESCE(SUM(pa.allocated_amount), 0) AS allocated_total,
       p.amount - COALESCE(SUM(pa.allocated_amount), 0) AS unallocated_amount
FROM clm_payment p
LEFT JOIN clm_payment_allocation pa ON pa.payment_id = p.payment_id
WHERE p.deleted_at IS NULL
GROUP BY p.client_id, p.payment_id, p.payment_reference_number, p.amount, p.payment_date, p.verification_status;

-- Outstanding amount per client (single number for the 360 header)
CREATE OR REPLACE VIEW v_client_outstanding AS
SELECT client_id, SUM(balance_amount) AS total_outstanding
FROM v_client_billing_summary
GROUP BY client_id;

-- Financial summary (top of Client 360) - PO value reached via BOQ, see header note
CREATE OR REPLACE VIEW v_client_financial_summary AS
SELECT c.client_id,
       COALESCE(SUM(DISTINCT po.total_amount), 0) AS total_po_value,
       COALESCE(SUM(DISTINCT inv.net_amount), 0) AS total_billed,
       COALESCE(SUM(pa.allocated_amount), 0) AS total_received,
       COALESCE(SUM(DISTINCT inv.net_amount), 0) - COALESCE(SUM(pa.allocated_amount), 0) AS outstanding
FROM clm_client c
LEFT JOIN com_boq bq ON bq.client_id = c.client_id AND bq.deleted_at IS NULL
LEFT JOIN com_po po ON po.boq_id = bq.boq_id AND po.deleted_at IS NULL
LEFT JOIN clm_client_invoice inv ON inv.client_id = c.client_id AND inv.deleted_at IS NULL
LEFT JOIN clm_payment_allocation pa ON pa.invoice_id = inv.invoice_id
WHERE c.deleted_at IS NULL
GROUP BY c.client_id;

-- Documents per client (and per any client-owned entity) - reuses com_documents (extended), doc §16
CREATE OR REPLACE VIEW v_client_documents AS
SELECT d.* FROM com_documents d
WHERE d.entity_type IN ('Client','ClientContact','ClientRequirement','ClientInvoice','ClientPayment');

-- Activity/audit history (unioned, chronological) - reuses com_audit_log (extended) + clm_client_status_history
CREATE OR REPLACE VIEW v_client_activity_history AS
SELECT 'audit' AS source, entity_type, entity_id, action::text AS event, performed_at AS event_time
FROM com_audit_log
WHERE entity_type IN ('Client','ClientContact','ClientRequirement','ClientInvoice','ClientPayment','RFQ','Estimation','Quotation','Negotiation','BOQ','PO')
UNION ALL
SELECT 'status_change', entity_type::text, entity_id,
       COALESCE(old_status, '(none)') || ' -> ' || new_status, changed_at
FROM clm_client_status_history;

-- ---------- Cross-module aggregations (READ-ONLY, doc §13) ----------
-- Source table names are ASSUMED pending confirmation from the
-- Inventory/Labour/Equipment/Diesel modules' final specs (doc escalation #6/#7).
CREATE OR REPLACE VIEW v_client_cost_utilization AS
SELECT proj.client_id,
       proj.id AS project_id,
       COALESCE(mat.material_cost, 0)     AS material_cost,
       COALESCE(lab.labour_cost, 0)       AS labour_cost,
       COALESCE(equip.equipment_cost, 0)  AS equipment_cost,
       COALESCE(sub.subcontract_cost, 0)  AS subcontract_cost,
       COALESCE(trans.transport_cost, 0)  AS transport_cost,
       COALESCE(diesel.diesel_cost, 0)    AS diesel_cost,
       (COALESCE(mat.material_cost,0) + COALESCE(lab.labour_cost,0) +
        COALESCE(equip.equipment_cost,0) + COALESCE(sub.subcontract_cost,0) +
        COALESCE(trans.transport_cost,0) + COALESCE(diesel.diesel_cost,0)) AS total_cost
FROM projects proj
LEFT JOIN (SELECT project_id, SUM(amount) material_cost FROM stock_ledger
           WHERE movement_type = 'Issue' GROUP BY project_id) mat ON mat.project_id = proj.id
LEFT JOIN (SELECT project_id, SUM(amount) labour_cost FROM labour_cost_ledger
           GROUP BY project_id) lab ON lab.project_id = proj.id
LEFT JOIN (SELECT project_id, SUM(amount) equipment_cost FROM equipment_usage_cost
           GROUP BY project_id) equip ON equip.project_id = proj.id
LEFT JOIN (SELECT project_id, SUM(amount) subcontract_cost FROM subcontract_cost_ledger
           GROUP BY project_id) sub ON sub.project_id = proj.id
LEFT JOIN (SELECT project_id, SUM(amount) transport_cost FROM transport_cost_ledger
           GROUP BY project_id) trans ON trans.project_id = proj.id
LEFT JOIN (SELECT project_id, SUM(amount) diesel_cost FROM fuel_logs
           GROUP BY project_id) diesel ON diesel.project_id = proj.id;

-- Profit analysis (estimated vs actual), per client
CREATE OR REPLACE VIEW v_client_profit_analysis AS
SELECT fs.client_id,
       fs.total_po_value AS contract_value,
       fs.total_billed,
       cu_total.total_cost,
       (fs.total_po_value - cu_total.total_cost) AS estimated_profit,
       (fs.total_billed - cu_total.total_cost) AS actual_profit,
       CASE WHEN fs.total_billed = 0 THEN NULL
         ELSE round(((fs.total_billed - cu_total.total_cost) / fs.total_billed) * 100, 2) END AS actual_profit_pct
FROM v_client_financial_summary fs
LEFT JOIN (SELECT client_id, SUM(total_cost) AS total_cost
           FROM v_client_cost_utilization GROUP BY client_id) cu_total
  ON cu_total.client_id = fs.client_id;
