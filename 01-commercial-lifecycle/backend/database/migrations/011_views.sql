-- ============================================================
-- 011: Derived views (architecture Phase 5.4 note, Phase 6, Phase 15, Phase 18 #7)
-- Nothing here is stored redundantly; every cross-table derived value lives
-- in a view, never a stored column (same-row generated columns, e.g.
-- amount = qty * rate, are declared inline on the tables themselves).
-- ============================================================

-- Item-level cost roll-up: estimated_unit_cost (stored, same-row generated
-- on com_estimation_items) x quantity (lives on com_rfq_items) -> total cost.
CREATE OR REPLACE VIEW v_estimation_item_cost AS
SELECT
  ei.estimation_item_id,
  ei.estimation_id,
  ri.rfq_item_id,
  ri.company_id,
  ri.branch_id,
  ri.item_code,
  ri.quantity,
  ei.material_cost,
  ei.labour_cost,
  ei.equipment_cost,
  ei.subcontract_cost,
  ei.transportation_cost,
  ei.other_direct_cost,
  ei.overhead_cost,
  ei.contingency_cost,
  ei.estimated_unit_cost,
  (ei.estimated_unit_cost * ri.quantity) AS estimated_total_cost
FROM com_estimation_items ei
JOIN com_rfq_items ri ON ri.rfq_item_id = ei.rfq_item_id
WHERE ei.deleted_at IS NULL AND ri.deleted_at IS NULL;

-- Full per-S.No traceability & calculation, keyed off the *current* quoted
-- rate on com_quotation_items (i.e. the latest quotation version's item row
-- the caller is querying - callers should join/filter to a specific
-- quotation_id/version when precision across versions matters).
CREATE OR REPLACE VIEW v_item_commercial_analysis AS
SELECT
  ri.rfq_item_id,
  ri.rfq_id,
  ri.company_id,
  ri.branch_id,
  ri.item_code,
  ri.description,
  ri.quantity,
  ri.unit,
  ap.actual_rate,
  ap.price_basis AS actual_price_basis,
  qi.quotation_item_id,
  qi.quotation_id,
  qi.quoted_rate,
  (qi.quoted_rate - ap.actual_rate) AS rate_difference,
  CASE WHEN ap.actual_rate IS NULL OR ap.actual_rate = 0 THEN NULL
       ELSE round(((qi.quoted_rate - ap.actual_rate) / ap.actual_rate) * 100, 2) END AS rate_difference_pct,
  (ri.quantity * ap.actual_rate) AS actual_value,
  (ri.quantity * qi.quoted_rate) AS quoted_value,
  ((ri.quantity * qi.quoted_rate) - (ri.quantity * ap.actual_rate)) AS value_difference,
  eic.estimated_unit_cost,
  eic.estimated_total_cost,
  ((ri.quantity * qi.quoted_rate) - eic.estimated_total_cost) AS profit,
  CASE WHEN qi.quoted_rate IS NULL OR (ri.quantity * qi.quoted_rate) = 0 THEN NULL
       ELSE round((((ri.quantity * qi.quoted_rate) - eic.estimated_total_cost)
             / (ri.quantity * qi.quoted_rate)) * 100, 2) END AS profit_margin_pct
FROM com_rfq_items ri
LEFT JOIN v_estimation_item_cost eic ON eic.rfq_item_id = ri.rfq_item_id
LEFT JOIN com_actual_price ap ON ap.rfq_item_id = ri.rfq_item_id
LEFT JOIN com_quotation_items qi ON qi.rfq_item_id = ri.rfq_item_id AND qi.deleted_at IS NULL
WHERE ri.deleted_at IS NULL;

-- Variant using the settled (is_final=true) negotiation offer rate instead
-- of the raw quoted_rate - the "Final Agreed Price" / "Final Profit" figures
-- described in architecture Phase 2 steps 8-9 and Phase 15. Item-level final
-- offers only (quotation_item_id IS NOT NULL); quotation-level final offers
-- are out of scope for a per-S.No view by definition.
CREATE OR REPLACE VIEW v_item_commercial_analysis_final AS
SELECT
  ri.rfq_item_id,
  ri.rfq_id,
  ri.company_id,
  ri.branch_id,
  ri.item_code,
  ri.description,
  ri.quantity,
  ri.unit,
  qi.quotation_item_id,
  qi.quotation_id,
  fo.offered_rate AS final_agreed_rate,
  fo.offer_date AS final_agreed_date,
  eic.estimated_total_cost,
  (ri.quantity * fo.offered_rate) AS final_value,
  ((ri.quantity * fo.offered_rate) - eic.estimated_total_cost) AS final_profit,
  CASE WHEN fo.offered_rate IS NULL OR (ri.quantity * fo.offered_rate) = 0 THEN NULL
       ELSE round((((ri.quantity * fo.offered_rate) - eic.estimated_total_cost)
             / (ri.quantity * fo.offered_rate)) * 100, 2) END AS final_profit_margin_pct
FROM com_rfq_items ri
JOIN com_quotation_items qi ON qi.rfq_item_id = ri.rfq_item_id AND qi.deleted_at IS NULL
LEFT JOIN v_estimation_item_cost eic ON eic.rfq_item_id = ri.rfq_item_id
LEFT JOIN LATERAL (
  SELECT no.offered_rate, no.offer_date
  FROM com_negotiation_offers no
  WHERE no.quotation_item_id = qi.quotation_item_id AND no.is_final = true
  ORDER BY no.offer_date DESC
  LIMIT 1
) fo ON true
WHERE ri.deleted_at IS NULL;
