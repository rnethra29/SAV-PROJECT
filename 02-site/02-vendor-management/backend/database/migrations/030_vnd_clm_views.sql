-- ============================================================
-- 030: Derived views for the Vendor Management & Procurement submodule +
-- Project-centric financial traceability (architecture doc §6.17/§6.18,
-- Phase 10 "STORED vs. CALCULATED"). Nothing here is stored redundantly -
-- same rule as 011_views.sql and 019_clm_views.sql.
-- ============================================================

-- Vendor performance (objective stats + average of subjective ratings)
CREATE OR REPLACE VIEW v_vendor_performance AS
SELECT v.vendor_id,
       COUNT(po.po_id) AS total_pos,
       COUNT(po.po_id) FILTER (WHERE po.status = 'Closed') AS completed_pos,
       COUNT(po.po_id) FILTER (WHERE po.status = 'Cancelled') AS cancelled_pos,
       COUNT(po.po_id) FILTER (WHERE po.status NOT IN ('Closed','Cancelled')) AS pending_pos,
       COUNT(po.po_id) FILTER (WHERE po.status = 'Closed'
              AND po.expected_delivery_date IS NOT NULL
              AND po.updated_at::date > po.expected_delivery_date) AS delayed_deliveries,
       CASE WHEN COUNT(po.po_id) FILTER (WHERE po.status = 'Closed') = 0 THEN NULL
            ELSE round(100.0 * COUNT(po.po_id) FILTER (WHERE po.status = 'Closed'
                   AND (po.expected_delivery_date IS NULL OR po.updated_at::date <= po.expected_delivery_date))
                 / COUNT(po.po_id) FILTER (WHERE po.status = 'Closed'), 2) END AS on_time_delivery_percentage,
       round(AVG(r.quality_rating), 2)  AS avg_quality_rating,
       round(AVG(r.delivery_rating), 2) AS avg_delivery_rating,
       round(AVG(r.price_rating), 2)    AS avg_price_rating,
       round(AVG((r.quality_rating + r.delivery_rating + r.price_rating) / 3.0), 2) AS overall_rating
FROM vnd_vendor v
LEFT JOIN vnd_purchase_order po ON po.vendor_id = v.vendor_id AND po.deleted_at IS NULL
LEFT JOIN vnd_vendor_rating r ON r.vendor_id = v.vendor_id
GROUP BY v.vendor_id;

-- Vendor PO summary (replaces storing running totals on the vendor row)
CREATE OR REPLACE VIEW v_vendor_po_summary AS
SELECT vendor_id,
       COUNT(*) AS number_of_pos,
       SUM(total_amount) AS total_po_value,
       COUNT(*) FILTER (WHERE status = 'Closed') AS completed_pos,
       COUNT(*) FILTER (WHERE status NOT IN ('Closed','Cancelled')) AS pending_pos,
       COUNT(*) FILTER (WHERE status = 'Cancelled') AS cancelled_pos
FROM vnd_purchase_order WHERE deleted_at IS NULL GROUP BY vendor_id;

-- Vendor invoice outstanding (never stored on the invoice row)
CREATE OR REPLACE VIEW v_vendor_invoice_summary AS
SELECT inv.vendor_invoice_id, inv.vendor_id, inv.total_amount,
       COALESCE(SUM(a.allocated_amount), 0) AS amount_paid,
       inv.total_amount - COALESCE(SUM(a.allocated_amount), 0) AS balance_amount,
       inv.status
FROM vnd_vendor_invoice inv
LEFT JOIN vnd_vendor_payment_allocation a ON a.vendor_invoice_id = inv.vendor_invoice_id
WHERE inv.deleted_at IS NULL
GROUP BY inv.vendor_invoice_id, inv.vendor_id, inv.total_amount, inv.status;

-- Financial traceability chain per vendor
CREATE OR REPLACE VIEW v_vendor_financial_summary AS
SELECT v.vendor_id,
       COALESCE(pos.total_po_value, 0) AS total_po_value,
       COALESCE(SUM(inv.total_amount), 0) AS total_invoice_value,
       COALESCE(SUM(pa.allocated_amount), 0) AS total_paid,
       COALESCE(SUM(inv.total_amount), 0) - COALESCE(SUM(pa.allocated_amount), 0) AS pending_payable
FROM vnd_vendor v
LEFT JOIN v_vendor_po_summary pos ON pos.vendor_id = v.vendor_id
LEFT JOIN vnd_vendor_invoice inv ON inv.vendor_id = v.vendor_id AND inv.deleted_at IS NULL
LEFT JOIN vnd_vendor_payment_allocation pa ON pa.vendor_invoice_id = inv.vendor_invoice_id
GROUP BY v.vendor_id, pos.total_po_value;

-- Actual cost per project per category (budget vs actual)
CREATE OR REPLACE VIEW v_project_cost_summary AS
SELECT pc.project_id, pc.cost_category, pc.estimated_cost, pc.budgeted_cost,
       COALESCE(pe.actual_cost, 0) AS actual_cost,
       pc.budgeted_cost - COALESCE(pe.actual_cost, 0) AS budget_variance,
       pc.estimated_cost - COALESCE(pe.actual_cost, 0) AS cost_variance
FROM clm_project_cost pc
LEFT JOIN (SELECT project_id, expense_category, SUM(amount) AS actual_cost
           FROM clm_project_expense GROUP BY project_id, expense_category) pe
  ON pe.project_id = pc.project_id AND pe.expense_category = pc.cost_category;

-- Full per-project financial summary - CONTRACT VALUE -> BILLING -> PAYMENTS -> REVENUE
--                                       PROJECT BUDGET -> PO -> VENDOR INVOICE -> VENDOR PAYMENT -> EXPENSE -> ACTUAL COST
CREATE OR REPLACE VIEW v_project_financial_summary AS
SELECT p.project_id, p.project_code, p.project_name, p.contract_value,
       COALESCE(billed.total_billed, 0)          AS total_client_billed,
       COALESCE(received.total_received, 0)      AS total_client_received,
       COALESCE(billed.total_billed, 0) - COALESCE(received.total_received, 0) AS pending_client_receivable,
       COALESCE(cost.total_estimated, 0)          AS total_estimated_cost,
       COALESCE(cost.total_budgeted, 0)           AS total_budgeted_cost,
       COALESCE(po.total_po_value, 0)              AS total_po_value,
       COALESCE(vinv.total_vendor_invoice, 0)       AS total_vendor_invoice_value,
       COALESCE(vpay.total_vendor_paid, 0)           AS total_vendor_payment,
       COALESCE(vinv.total_vendor_invoice, 0) - COALESCE(vpay.total_vendor_paid, 0) AS pending_vendor_payable,
       COALESCE(exp.total_expense, 0)                 AS total_project_expense,
       (p.contract_value - COALESCE(cost.total_estimated, 0))        AS expected_profit,
       (COALESCE(billed.total_billed, 0) - COALESCE(exp.total_expense, 0)) AS actual_profit,
       CASE WHEN COALESCE(billed.total_billed, 0) = 0 THEN NULL
            ELSE round(((COALESCE(billed.total_billed, 0) - COALESCE(exp.total_expense, 0))
                  / billed.total_billed) * 100, 2) END           AS profit_margin_pct,
       (COALESCE(cost.total_budgeted, 0) - COALESCE(exp.total_expense, 0))  AS budget_variance,
       (COALESCE(cost.total_estimated, 0) - COALESCE(exp.total_expense, 0)) AS cost_variance
FROM clm_project p
LEFT JOIN (SELECT project_id, SUM(net_amount) total_billed FROM clm_client_invoice WHERE deleted_at IS NULL GROUP BY project_id) billed
  ON billed.project_id = p.project_id
LEFT JOIN (SELECT ci.project_id, SUM(pa.allocated_amount) total_received
           FROM clm_client_invoice ci JOIN clm_payment_allocation pa ON pa.invoice_id = ci.invoice_id
           GROUP BY ci.project_id) received ON received.project_id = p.project_id
LEFT JOIN (SELECT project_id, SUM(estimated_cost) total_estimated, SUM(budgeted_cost) total_budgeted
           FROM clm_project_cost GROUP BY project_id) cost ON cost.project_id = p.project_id
LEFT JOIN (SELECT project_id, SUM(total_amount) total_po_value FROM vnd_purchase_order
           WHERE deleted_at IS NULL GROUP BY project_id) po ON po.project_id = p.project_id
LEFT JOIN (SELECT project_id, SUM(total_amount) total_vendor_invoice FROM vnd_vendor_invoice
           WHERE deleted_at IS NULL GROUP BY project_id) vinv ON vinv.project_id = p.project_id
LEFT JOIN (SELECT vi.project_id, SUM(pa.allocated_amount) total_vendor_paid
           FROM vnd_vendor_invoice vi JOIN vnd_vendor_payment_allocation pa ON pa.vendor_invoice_id = vi.vendor_invoice_id
           GROUP BY vi.project_id) vpay ON vpay.project_id = p.project_id
LEFT JOIN (SELECT project_id, SUM(amount) total_expense FROM clm_project_expense GROUP BY project_id) exp
  ON exp.project_id = p.project_id
WHERE p.deleted_at IS NULL;
