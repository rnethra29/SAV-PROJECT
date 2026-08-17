# 02-site / 01 — Client Management

Client Master → Contacts → Requirements → (RFQ..PO, reused from `01-commercial-lifecycle`) → Billing/Invoices → Payments → Client 360°.

Full specification: [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Status

| Layer | Status |
|---|---|
| Backend | **Complete** (`clm_client*`, `clm_payment*` tables) |
| Frontend | **Not yet started** — no `frontend/` code exists. Do not create placeholder/fake UI here; add a `frontend/` folder only when that work actually begins. |
| Database | Complete (`backend/database/migrations/012–019`) |

## Backend layout

```
backend/
  repositories/, services/, controllers/, validators/, routes/   one file per entity, same shape as every other module
  database/    this module's own migrations (012–019) + seed data (clm_client_type, clm_industry, clm_contact_type)
  tests/       clmValidators.test.js
```

`backend/routes/index.js` aggregates every route file here and is mounted (unprefixed — no URL changed by this reorg) by `shared/backend/routes/index.js`.

## Cross-module dependency

`clmClient360.service.js` reads Commercial Lifecycle's RFQ repository directly (`../../../01-commercial-lifecycle/backend/rfq/rfq.repository`) to proxy `GET /clients/:clientId/rfqs` — this is a real, intentional cross-module read, not an accident of the move.
