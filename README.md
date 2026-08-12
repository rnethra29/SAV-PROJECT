# SAV ERP — Commercial Lifecycle Module + Sites: Client Management submodule

Backend API for two SAV ERP modules sharing one deployment:
- **Commercial Lifecycle**: RFQ → Estimation → Market Price Analysis → Actual vs Quoted → Profit Analysis → Quotation → Client Offer/Negotiation → BOQ → Purchase Order (`com_*` tables).
- **Sites → Client Management** (submodule): Client Master → Contacts → Requirements → (RFQ..PO, reused from Commercial Lifecycle) → Billing/Invoices → Payments → Client 360° (`clm_*` tables).

Implements the schema and business rules from [`SAV_ERP_Commercial_Lifecycle_Module_Architecture.md`](SAV_ERP_Commercial_Lifecycle_Module_Architecture.md) and [`SAV_ERP_Client_Management_Module_Architecture.md`](SAV_ERP_Client_Management_Module_Architecture.md). Node.js/Express + PostgreSQL (Supabase) via `pg`; Supabase Storage for documents; Supabase Auth (JWKS-verified) for authentication.

Client Management deliberately does **not** duplicate RFQ/Estimation/Quotation/Negotiation/BOQ/PO, Documents, Approvals, or Audit Log — it references the Commercial Lifecycle module's tables by FK and extends `com_documents`/`com_approvals` with new `entity_type` values instead of creating parallel tables. See the architecture doc's escalation notes (top of file) for the two open items before this goes fully live: reconciling `clm_client` against the separate Module 04 client spec, and the `com_rfq.client_id`/`com_boq.client_id` FK-target reconciliation.

## Quick start

```bash
npm install
cp .env.example .env   # fill in your Supabase project's values
npm run migrate        # creates enums/tables/indexes/functions/triggers/views
npm run seed            # populates the 3 lookup tables (item categories, price source types, document categories)
npm run dev              # http://localhost:4000, docs at /api-docs
npm test                  # unit tests (business-rule logic - no DB needed)
```

See [`src/database/README.md`](src/database/README.md) for the database layer and [`src/docs/api.md`](src/docs/api.md) for the full endpoint reference, including the approval-gated status transitions (both modules).

## Layout

```
src/
  config/       env, Postgres pool, Supabase client, logger, swagger
  database/     migrations (canonical schema), seeds, migration runner
  models/       ENUM mirrors, table/view name constants, status state machines, approval stages
  middlewares/  auth (Supabase JWKS), role gating, Joi validation, error handling
  utils/        response envelope, ApiError, async handler, word-count/pagination helpers
  repositories/ SQL data access (one per table/table-group)
  services/     business rules (versioning, append-only history, transitions, approval gates, audits)
  controllers/  thin HTTP handlers
  validators/   Joi request schemas
  routes/       Express routers, mounted in routes/index.js
  tests/        unit tests (node:test) for pure business-rule logic
```

Layered by concern (not by feature) to match this project's existing scaffold. Every module (RFQ, Estimation, Market/Actual Price, Quotation, Negotiation, BOQ, PO, Documents, Approvals, Audit Log, Analysis, and the `clm*`-prefixed Client Management files) follows the same repository → service → controller → route shape.

## External dependencies

This module deliberately does **not** create `companies`, `branches`, `users`, `employees`, `clients`, `projects`, `sites`, `vendors`, `currencies`, or `taxes` — those belong to other SAV ERP modules and are referenced here by FK only. `npm run migrate` will stop at the first table that FKs to one of them until that module exists; re-running it later picks up right where it left off.

`clm_client` (Client Management) is intentionally a separate table from the external `clients` table that `com_rfq`/`com_boq` already FK to — see the escalation notes at the top of `SAV_ERP_Client_Management_Module_Architecture.md` for the reconciliation this implies before the two are unified.
