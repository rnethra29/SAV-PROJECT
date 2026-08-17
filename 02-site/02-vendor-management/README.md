# 02-site / 02 — Vendor Management (& Procurement)

Project (the hub) → Cost Plan → [Vendor → Materials/Services → Procurement PO → Vendor Invoice → Vendor Payment] → Project Expense → Project Financial Summary.

Full specification: [`ARCHITECTURE.md`](ARCHITECTURE.md).

**Scope note:** as originally specified and built, this sub-module bundles three things together — Vendor master/procurement (`vnd_*`), Project/Cost/Expense tracking (`clm_project*`, an extension of Client Management), and RBAC. RBAC has been pulled out into `shared/rbac/` in this reorg since role/permission checks apply to every module, not just this one; Project/Cost/Expense stays bundled here, matching how it was specified and built (see the reorg proposal's Q2/Q3 for the reasoning).

## Status

| Layer | Status |
|---|---|
| Backend | **Complete** (`vnd_*`, `clm_project*` tables) |
| Frontend | **Not yet started** — no `frontend/` code exists. Do not create placeholder/fake UI here; add a `frontend/` folder only when that work actually begins. |
| Database | Complete (`backend/database/migrations/020–028,030`) |

## Backend layout

```
backend/
  repositories/, services/, controllers/, validators/, routes/   one file per entity
  database/    this module's own migrations (020–028, 030) + seed data (vendor types, material categories)
  tests/       vndValidators.test.js
```

`backend/routes/index.js` aggregates every route file here and is mounted (unprefixed — no URL changed by this reorg) by `shared/backend/routes/index.js`.

## Cross-module dependencies

Several services here read Client Management's repositories directly — e.g. `clmProject.service.js` requires `../../01-client-management/backend/repositories/clmClient.repository` to validate a project's `client_id`. This is a real, intentional cross-submodule dependency inherent to the data model (a project belongs to a client), not an accident of the move.

Also reads `com_po` (Commercial Lifecycle's subcontract PO) for `clm_project_expense.subcontract_po_id` — see `ARCHITECTURE.md` §0 for why `vnd_purchase_order` (this module's own direct-procurement PO) is a deliberately separate table from `com_po`.
