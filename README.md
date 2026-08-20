# SAV ERP — Commercial Lifecycle Module + Sites (Client Management + Vendor Management & Procurement)

Backend API for three SAV ERP modules sharing one deployment:
- **Commercial Lifecycle**: RFQ → Estimation → Market Price Analysis → Actual vs Quoted → Profit Analysis → Quotation → Client Offer/Negotiation → BOQ → Purchase Order (`com_*` tables).
- **Sites → Client Management** (submodule): Client Master → Contacts → Requirements → (RFQ..PO, reused from Commercial Lifecycle) → Billing/Invoices → Payments → Client 360° (`clm_client*`/`clm_payment*` tables).
- **Sites → Vendor Management & Procurement** (submodule): Project (the hub) → Cost Plan → [Vendor → Materials/Services → Procurement PO → Vendor Invoice → Vendor Payment] → Project Expense → Project Financial Summary, plus RBAC (`clm_project*`, `vnd_*`, `sec_*` tables).

Implements the schema and business rules from [`SAV_ERP_Commercial_Lifecycle_Module_Architecture.md`](SAV_ERP_Commercial_Lifecycle_Module_Architecture.md), [`SAV_ERP_Client_Management_Module_Architecture.md`](SAV_ERP_Client_Management_Module_Architecture.md), and [`SAV_ERP_Sites_Vendor_Procurement_Module_Architecture.md`](SAV_ERP_Sites_Vendor_Procurement_Module_Architecture.md). Node.js/Express + PostgreSQL (Supabase) via `pg`; Supabase Storage for documents; Supabase Auth (JWKS-verified) for authentication.

Both Sites submodules deliberately avoid duplicating existing ground: Client Management references the Commercial Lifecycle module's tables by FK; Vendor Management & Procurement references *both* prior modules and introduces its own **`vnd_purchase_order`** (direct material/service procurement) as a deliberately separate table from `com_po` (the Commercial Lifecycle module's subcontract/work-package PO) — see that doc's §0 reconciliation table for why. All three modules extend the same shared `com_documents`/`com_approvals`/`com_audit_log` engines with new `entity_type`/`action` values instead of creating parallel tables. See each doc's own escalation notes for open items before going fully live (client-master reconciliation against Module 04, the `com_rfq.client_id`/`com_boq.client_id` FK-target reconciliation, and whether `com_po`/`vnd_purchase_order` should ever be merged).

## Running locally (Frontend)

The frontend (`apps/web`, Next.js) is what `npm run dev` runs from the repository root. It can be browsed on its own — no backend, database, or Supabase project required — via an isolated, in-memory development fixture layer (`DEV_FIXTURE_MODE`).

```bash
git clone <repository-url>
cd SAV-PROJECT
npm install     # installs both apps/web and the backend, via npm workspaces
npm run dev     # starts the frontend (apps/web) — http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000).

By default the frontend calls the real backend API and Supabase Auth, neither of which is required to browse it. To see the app with realistic sample data and skip both, create `apps/web/.env.local` (gitignored, never committed) with:

```
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
```

This bypasses the login redirect and swaps every Client Management / Vendor Management / Procurement data call for an isolated in-memory fixture store instead of a real API call — it has no effect on `next build`/`next start` (Next.js hard-sets `NODE_ENV=production` for real builds regardless of this flag), so it can never leak into a production build.

## Backend quick start (API)

```bash
npm install
cp .env.example .env   # fill in your Supabase project's values
npm run migrate        # creates enums/tables/indexes/functions/triggers/views
npm run seed            # populates the 3 lookup tables (item categories, price source types, document categories)
npm run dev:server       # http://localhost:4000, docs at /api-docs
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

Layered by concern (not by feature) to match this project's existing scaffold. Every module (RFQ, Estimation, Market/Actual Price, Quotation, Negotiation, BOQ, PO, Documents, Approvals, Audit Log, Analysis, the `clm*`-prefixed Client Management files, and the `clmProject*`/`vnd*`/`secRbac`-prefixed Vendor Management & Procurement files) follows the same repository → service → controller → route shape.

## External dependencies

This module deliberately does **not** create `companies`, `branches`, `users`, `employees`, `clients`, `sites`, `currencies`, or `taxes` — those belong to other SAV ERP modules and are referenced here by FK only. `npm run migrate` will stop at the first table that FKs to one of them until that module exists; re-running it later picks up right where it left off. (`vendors` and `projects` *are* created here now, as `vnd_vendor` and `clm_project` — see below.)

`clm_client` (Client Management) is intentionally a separate table from the external `clients` table that `com_rfq`/`com_boq` already FK to — see the escalation notes at the top of `SAV_ERP_Client_Management_Module_Architecture.md` for the reconciliation this implies before the two are unified.

`vnd_vendor` (Vendor Management & Procurement) is intended to *become* the same physical table `com_po.vendor_id` already assumes as an external `vendors` table (per that doc's §0 reconciliation) — confirm/rename before going live. Likewise `clm_project` fills the "external, assumed" `projects` gap both prior docs left open, but `com_rfq.project_id`/`com_boq.project_id`/`com_po.project_id` still target the external `projects(id)` table as-is (see `004_rfq_tables.sql`) — the same unreconciled-FK-target pattern as `clients`/`clm_client`, called out again in `clm_project`'s own migration comments. Once reconciled, `clm_project` becomes the hub every financial fact in the whole deployment hangs off (`clm_client_invoice`/`vnd_purchase_order`/`vnd_vendor_invoice`/`clm_project_expense` already carry a `project_id` pointing at it today).
