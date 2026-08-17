# 01 — Commercial Lifecycle

RFQ → Estimation → Market Price Analysis → Actual vs Quoted → Quotation → Client Offer/Negotiation → BOQ → Purchase Order.

Full specification: [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Status

| Layer | Status |
|---|---|
| Backend | Complete (`com_*` tables) |
| Frontend | Complete (UI built, currently fixture-driven — not yet wired to a live API; see `apps/web/src/modules/commercial-lifecycle/fixtures/`) |
| Database | Complete (`shared/backend/database/migrations/001,002,010` + `backend/database/migrations/003–009,011`) |

## Backend layout

```
backend/
  rfq/            rfq, rfqItem
  estimation/     estimation, estimationItem
  market-price/   marketPrice, actualPrice (+ history)
  quotation/      quotation, quotationItem
  negotiation/    negotiationOffer (append-only)
  boq/            boq, boqItem (versioned, hierarchical)
  po/             po, poItem
  lookup/         item categories, price source types, document categories
  analysis/       derived commercial-analysis views (read-only)
  database/       this module's own migrations (003–009, 011) + seed data
  tests/          validators.test.js
  routes.js       aggregates every stage's routes.js, mounted by shared/backend/routes/index.js
```

Each stage folder keeps the same repository → service → controller → validator → route shape used throughout the backend. `market-price/` and `negotiation/` have no `.validator.js`/other missing layers where the original design never had one (e.g. `analysis/` is read-only, no validator).

## Frontend layout

Lives inside the one Next.js app at `apps/web/src/modules/commercial-lifecycle/` (Next.js requires a single unified `app/` route tree, so this can't be a fully separate top-level `frontend/` folder — see the reorg proposal's §2 callout for why). The route-registration files themselves stay at `apps/web/src/app/(app)/commercial/**` per Next.js's requirement, importing from this module folder via the `@/modules/commercial-lifecycle/...` alias.

## Reused, not owned by this module

Documents, Approvals, and the Audit Log engine live in `shared/backend/documents-approvals-audit/` (reused by every module, not duplicated here). RBAC lives in `shared/rbac/`.
