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

## Auth model
`auth.middleware.js` verifies the Supabase Auth JWT and expects `company_id`/`branch_id`/`role` custom claims (`app_metadata`), provisioned by a Supabase custom-access-token hook against the external `users`/`employees` tables. `role.middleware.js` gates by the Actors in architecture Phase 1.2 (`models/enums.js: ROLES`); `Admin` always passes.
