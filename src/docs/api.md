# SAV ERP — Commercial Lifecycle Module API

Base URL: `{host}{API_PREFIX}` (default `API_PREFIX=/api/v1`). Interactive Swagger UI: `/api-docs`.

All routes require `Authorization: Bearer <Supabase Auth access token>` unless noted. Every response is `{ success, message, data, meta? }`; errors are `{ success: false, message, code?, details? }`.

Reference: [`SAV_ERP_Commercial_Lifecycle_Module_Architecture.md`](../../SAV_ERP_Commercial_Lifecycle_Module_Architecture.md) — every endpoint below implements a section of that spec.

## RFQ (Phase 5.1/5.2)
| Method | Path | Notes |
|---|---|---|
| GET | `/rfqs` | paginated, filter `status`, `clientId`, `projectId` |
| POST | `/rfqs` | Sales/Commercial Manager, Estimation Engineer |
| GET | `/rfqs/:id` | |
| PATCH | `/rfqs/:id` | status transitions validated (`models/statusTransitions.js`) |
| DELETE | `/rfqs/:id` | soft delete; blocked if RFQ items exist |
| GET | `/rfqs/:rfqId/items` | flat, sequence-ordered |
| GET | `/rfqs/:rfqId/items/tree` | hierarchical (parent_item_id) |
| POST | `/rfqs/:rfqId/items` | |
| GET/PATCH/DELETE | `/rfq-items/:id` | single-item ops |

## Estimation (Phase 5.3/5.4)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/estimations` | filter `rfqId`, `status` |
| GET/PATCH/DELETE | `/estimations/:id` | |
| GET/POST | `/estimations/:estimationId/items` | |
| GET/PATCH/DELETE | `/estimation-items/:id` | 1:1 with `rfq_item_id`, enforced app + DB |
| GET | `/estimation-items/:id/cost-breakup` | reads `v_estimation_item_cost` |

## Market Price + Actual Price (Phase 5.5/5.6/5.7)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/rfq-items/:rfqItemId/market-prices` | append-only, multi-source |
| GET | `/rfq-items/:rfqItemId/actual-price` | current pointer |
| GET | `/rfq-items/:rfqItemId/actual-price/history` | append-only log |
| PUT | `/rfq-items/:rfqItemId/actual-price` | sets pointer **and** appends history row atomically |

## Quotation (Phase 5.8/5.9, versioned)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/quotations` | POST creates v1 |
| GET | `/quotations/by-number/:quotationNumber/versions` | full version list |
| GET/PATCH/DELETE | `/quotations/:id` | |
| POST | `/quotations/:id/new-version` | clones items by default (`cloneItems`) |
| GET/POST | `/quotations/:quotationId/items` | quantity/unit snapshotted server-side from RFQ item |
| GET/PATCH/DELETE | `/quotation-items/:id` | |

## Negotiation (Phase 5.10, append-only)
| Method | Path | Notes |
|---|---|---|
| GET | `/negotiation-offers/by-quotation/:quotationId` | |
| GET | `/negotiation-offers/by-quotation-item/:quotationItemId` | |
| GET | `/negotiation-offers/by-quotation-item/:quotationItemId/final` | latest `is_final=true` row |
| POST | `/negotiation-offers` | insert-only; "marking final" = inserting a new row with `is_final=true`, `offer_type=Final` |

## BOQ (Phase 5.11/5.12, versioned + hierarchical)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/boqs` | manual header creation |
| POST | `/boqs/generate-from-quotation` | bulk header+items from a settled quotation; `unit_rate` auto-resolved from the latest final negotiation offer (fallback: `quoted_rate`); `description` per line is human-authored, ≤50 words |
| GET | `/boqs/by-number/:boqNumber/versions` | |
| GET/PATCH/DELETE | `/boqs/:id` | |
| POST | `/boqs/:id/new-version` | requires `revision_reason` |
| GET | `/boqs/:boqId/items`, `/tree` | |
| POST | `/boqs/:boqId/items` | manual add; `autoResolveRate: true` pulls the settled rate |
| GET/PATCH/DELETE | `/boq-items/:id` | |

## Purchase Order (Phase 5.13/5.14)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/purchase-orders` | manual header creation |
| POST | `/purchase-orders/generate-from-boq` | requires the BOQ to be `boq_type=Final, status=Final`; rate defaults from BOQ item, independently editable |
| GET/PATCH/DELETE | `/purchase-orders/:id` | |
| GET/POST | `/purchase-orders/:poId/items` | |
| GET/PATCH/DELETE | `/po-items/:id` | |

## Documents (Phase 5.15, Phase 12)
| Method | Path | Notes |
|---|---|---|
| GET | `/documents?entityType=&entityId=` | |
| POST | `/documents` | `multipart/form-data`, field `file`; private Supabase Storage bucket |
| GET | `/documents/:id` | |
| GET | `/documents/:id/signed-url` | time-limited (`SIGNED_URL_EXPIRY_SECONDS`) |
| POST | `/documents/:id/archive` | metadata only — Storage object retained |

## Approvals (Phase 5.16, rule #13)
| Method | Path | Notes |
|---|---|---|
| GET | `/approvals/:entityType/:entityId` | |
| POST | `/approvals` | one Pending row per (entity, stage) |
| POST | `/approvals/:id/approve` \| `/reject` | Approver/Admin or the assigned `approver_id` |

Gated transitions (`src/models/approvalStages.js`) — each requires a matching **Approved** `com_approvals` row first, or the request 409s with `code: APPROVAL_REQUIRED`:
| Entity | Gated transition | Stage |
|---|---|---|
| RFQ | `status -> 'Under Estimation'` | `RFQ Approval` |
| Estimation | `status -> 'Approved'` | `Estimation Approval` |
| Quotation | `status -> 'Approved'` | `Quotation Approval` |
| Negotiation Offer | `is_final -> true` | `Final Commercial Decision Approval` (checked against the `quotation_item_id`, or `quotation_id` for a quotation-level offer) |
| BOQ | `status -> 'Final'` | `BOQ Final Approval` |
| PO | `status -> 'Approved'` | `PO Approval` |
| Client Invoice (Client Management submodule) | `status -> 'Approved'` | `Client Invoice Approval` |

## Audit Log (Phase 5.17, read-only)
| Method | Path |
|---|---|
| GET | `/audit-log/:entityType/:entityId` |

## Analysis (derived views, Phase 15/18)
| Method | Path | Notes |
|---|---|---|
| GET | `/analysis/item-commercial-analysis` | `v_item_commercial_analysis` — actual vs quoted, profit |
| GET | `/analysis/item-commercial-analysis/final` | `v_item_commercial_analysis_final` — final agreed rate/profit |
| GET | `/analysis/item-commercial-analysis/by-rfq-item/:rfqItemId` | single-item traceability |
| GET | `/analysis/estimation-item-cost` | `v_estimation_item_cost` |

## Lookups
`GET/POST/PATCH /lookups/item-categories`, `/price-source-types`, `/document-categories`, plus `POST .../:id/deactivate`.

---

# Sites module — Client Management submodule

Reference: [`SAV_ERP_Client_Management_Module_Architecture.md`](../../SAV_ERP_Client_Management_Module_Architecture.md). Owns `clm_*` tables only; the RFQ->PO chain, Documents, Approvals and Audit Log above are **reused by FK / `entity_type` value**, not redefined (doc §2).

## Clients (§6.3)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/clients` | filter `status`, `clientTypeId`, `industryId`; POST: Sales/Commercial Manager |
| GET/PATCH/DELETE | `/clients/:id` | status transitions validated (`CLM_CLIENT_TRANSITIONS`); DELETE blocked if contacts/requirements/invoices/payments exist |
| GET | `/clients/:clientId/360` | assembled from `019_clm_views.sql` — overview, financial summary, projects, RFQ/BOQ/PO summaries, billing/payment summary, outstanding, cost utilization, profit analysis |
| GET | `/clients/:clientId/rfqs` | proxies `/rfqs` filtered by `client_id` |
| GET | `/clients/:clientId/projects` | proxies the external `projects` table |
| GET | `/clients/:clientId/documents` | `com_documents` filtered to every entity this client owns |
| GET | `/clients/:clientId/activity` | `v_client_activity_history` (audit log + status history, unioned) |

## Client Contacts (§6.4)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/clients/:clientId/contacts` | one primary contact per `(client_id, contact_type_id)`, not client-wide |
| GET/PATCH/DELETE | `/client-contacts/:id` | |

## Client Requirements (§6.6, pre-RFQ)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/client-requirements`, `/clients/:clientId/requirements` | filter `clientId`, `status`, `priority`; POST: Sales/Commercial Manager, Estimation Engineer |
| GET/PATCH/DELETE | `/client-requirements/:id` | status transitions validated (`CLM_REQUIREMENT_TRANSITIONS`); status changes append to `clm_client_status_history` |

## Client Invoices / Billing (§6.7/§6.8)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/client-invoices`, `/clients/:clientId/invoices` | POST: Finance/Accounts Team; `net_amount` is DB-generated, never accepted |
| GET/PATCH/DELETE | `/client-invoices/:id` | `status -> 'Approved'` requires an Approved `Client Invoice Approval` record (`code: APPROVAL_REQUIRED`) |
| GET/POST | `/client-invoices/:invoiceId/lines` | only while the invoice is `Draft` |
| GET/PATCH/DELETE | `/invoice-lines/:id` | |

## Payments + Allocations (§6.9/§6.10)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/client-payments`, `/clients/:clientId/payments` | POST: Finance/Accounts Team |
| GET/PATCH/DELETE | `/client-payments/:id` | amount immutable once allocated |
| POST | `/client-payments/:id/verify` | `{ status: 'Verified'\|'Rejected', remarks? }` |
| GET/POST | `/client-payments/:paymentId/allocations` | append-only; DB trigger + app-level pre-check guard against over-allocating past the payment amount or the invoice net amount |

## Lookups (§6.1/§6.2/§6.4 note)
`GET/POST/PATCH /client-lookups/client-types`, `/industries`, `/contact-types`, plus `POST .../:id/deactivate`.

---

# Sites module — Vendor Management & Procurement submodule

Reference: [`SAV_ERP_Sites_Vendor_Procurement_Module_Architecture.md`](../../SAV_ERP_Sites_Vendor_Procurement_Module_Architecture.md). Owns `clm_project*`/`vnd_*`/`sec_*` only; RFQ→PO, Client Management, Documents, Approvals and Audit Log above are **reused by FK / `entity_type` value**, not redefined (doc §0/§2).

## Projects (§6.1/§6.2, the hub every financial fact hangs off)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/projects` | POST: Project Manager |
| GET/PATCH/DELETE | `/projects/:id` | status transitions validated (`CLM_PROJECT_TRANSITIONS`) |
| GET | `/projects/financial-summaries` | `v_project_financial_summary`, every project in the caller's company |
| GET | `/projects/:projectId/financial-summary` | `v_project_financial_summary` — contract value → billing → payments → PO → vendor invoice/payment → expense → profit |
| GET | `/projects/:projectId/cost-summary` | `v_project_cost_summary` — budget vs. actual per category |
| GET/POST | `/projects/:projectId/cost-plan` | one row per `(project_id, cost_category)`; POST: Project Manager |
| GET/PATCH | `/project-costs/:id` | no `actual_cost` column - always calculated |
| GET/POST | `/projects/:projectId/expenses`, `/project-expenses` | POST: Site Engineer, Project Manager; requires `vendor_id`/`purchase_order_id`/`subcontract_po_id` unless `expense_category='Other'` |
| GET/PATCH/DELETE | `/project-expenses/:id` | |
| POST | `/project-expenses/:id/approve` | `{ status: 'Approved'\|'Rejected', remarks? }` - Project Manager |

## Vendors (§6.6-§6.10)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/vendors` | POST: Procurement Manager |
| GET/PATCH/DELETE | `/vendors/:id` | status transitions validated (`VND_VENDOR_TRANSITIONS`) |
| GET | `/vendors/:vendorId/performance` | `v_vendor_performance` - objective PO stats + average of subjective ratings |
| GET | `/vendors/:vendorId/financial-summary` | `v_vendor_financial_summary` |
| GET/POST | `/vendors/:vendorId/contacts`, `/vendor-contacts/:id` | exactly one primary contact per vendor |
| GET/POST | `/vendors/:vendorId/bank-accounts`, `/vendor-bank-accounts/:id` | **sensitive** - `account_number`/`upi_id` masked everywhere except `GET .../:id/reveal` (Finance/Procurement Manager only, logged as `action='Download'`) |
| POST | `/vendor-bank-accounts/:id/verify` | penny-drop/manual verification checkpoint - Finance Manager |
| GET/POST | `/vendors/:vendorId/materials`, `/vendor-materials/:id` | catalog rate is a reference only - actual PO rate can differ |
| GET/POST | `/vendors/:vendorId/ratings` | append-only; `overall_rating` is never stored, only averaged in `v_vendor_performance` |

## Procurement Orders (§6.11/§6.12/§13 - `vnd_purchase_order`, distinct from `/purchase-orders` = `com_po`)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/procurement-orders` | POST: Procurement Officer; header only, `Draft` |
| GET/PATCH/DELETE | `/procurement-orders/:id` | status transitions validated (`VND_PO_TRANSITIONS`) |
| POST | `/procurement-orders/:id/submit` | `Draft -> Pending Approval`, requires ≥1 line item |
| POST | `/procurement-orders/:id/approve` | `{ stage: 'Manager'\|'Finance' }` - each requires a matching Approved `com_approvals` row first (`code: APPROVAL_REQUIRED` otherwise); Finance stage also advances `status -> 'Approved'` |
| POST | `/procurement-orders/:id/receive` | `{ items: [{poItemId, receivedQuantity}] }` - Site Engineer/Procurement Officer; rolls header up to `Partially Received`/`Received` |
| POST | `/procurement-orders/:id/cancel` | |
| GET/POST | `/procurement-orders/:poId/items`, `/procurement-order-items/:id` | only while PO is `Draft`; header `subtotal`/`discount`/`tax`/`total_amount` are trigger-maintained (`trg_vnd_po_totals`), never accepted from the request |

## Vendor Invoices (§6.13/§6.14/§13)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/vendor-invoices` | POST: Accountant; `invoice_number` is unique per-vendor, not globally |
| GET/PATCH/DELETE | `/vendor-invoices/:id` | `status -> 'Approved'` requires an Approved `Vendor Invoice Approval` record |
| GET | `/vendor-invoices/:id/summary` | `v_vendor_invoice_summary` - amount_paid/balance_amount, never stored |
| POST | `/vendor-invoices/:id/verify` | required checkpoint before any approval stage - Accountant |
| GET/POST | `/vendor-invoices/:invoiceId/items`, `/vendor-invoice-items/:id` | only while invoice is `Draft`; no `company_id`/audit columns on this table at all (doc §6.14) - authorized via the parent invoice |

## Vendor Payments + Allocations (§6.15/§6.16)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/vendor-payments` | POST: Accountant |
| GET/PATCH | `/vendor-payments/:id` | amount immutable once allocated |
| POST | `/vendor-payments/:id/approve` | Finance Manager stamps `approved_by` - required before `status` can reach `Processed` |
| POST | `/vendor-payments/:id/status` | `{ status: 'Processed'\|'Failed'\|'Reversed' }` |
| GET/POST | `/vendor-payments/:paymentId/allocations` | append-only; DB trigger + app-level pre-check guard against over-allocating; on insert, also refreshes `payment_status` on every `clm_project_expense` row tied to that invoice |

## Lookups (§6.4/§6.5)
`GET/POST/PATCH /vendor-lookups/vendor-types`, `/material-categories`, plus `POST .../:id/deactivate`.

## RBAC (§14, Admin-only)
| Method | Path | Notes |
|---|---|---|
| GET/POST | `/rbac/roles` | |
| GET/PATCH | `/rbac/roles/:id`, `POST .../deactivate` | |
| GET/POST | `/rbac/permissions` | |
| GET/POST/DELETE | `/rbac/roles/:roleId/permissions[/:permissionId]` | |
| GET/POST/DELETE | `/rbac/users/:userId/roles[/:roleId]` | |

Gated transitions added by this submodule (`src/models/approvalStages.js`):
| Entity | Gated transition | Stage(s) |
|---|---|---|
| Procurement PO | `approval_status: Pending -> Manager Approved -> Finance Approved` (then `status -> 'Approved'`) | `Manager Approval`, `Finance Approval` |
| Vendor Invoice | `status -> 'Approved'` | `Vendor Invoice Approval` |

## Auth model
`auth.middleware.js` verifies the Supabase Auth JWT and expects `company_id`/`branch_id`/`role` custom claims (`app_metadata`), provisioned by a Supabase custom-access-token hook against the external `users`/`employees` tables. `role.middleware.js` gates by the Actors in architecture Phase 1.2 (`models/enums.js: ROLES`); `Admin` always passes.
