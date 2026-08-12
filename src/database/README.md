# Database layer

- **`migrations/`** — canonical, ordered, applied by `npm run migrate` (see `migrate.js`). This is the single source of truth for schema, functions, triggers and views. Files are idempotent (`IF NOT EXISTS` / `CREATE OR REPLACE` / duplicate-object-safe `DO $$` blocks, `ADD VALUE IF NOT EXISTS` for ENUMs) so re-running is always safe.
  - `001`–`011`: Commercial Lifecycle module (`com_*`).
  - `012`–`019`: **Sites module → Client Management submodule** (`clm_*`). `012` also `ALTER TYPE`-extends `com_document_entity_type`/`com_approval_entity_type` with the new Client/ClientContact/ClientRequirement/ClientInvoice/ClientPayment values — Documents and Approvals are reused from Commercial Lifecycle, not duplicated (see `SAV_ERP_Client_Management_Module_Architecture.md` §2/§9/§16).
- **`functions/`**, **`views/`**, **`schema/`** — kept as thin pointers (below) rather than duplicated copies of the SQL in `migrations/`, to avoid the two drifting apart. Open the referenced migration file directly to read/edit the actual definition.
  - Helper functions & triggers → `migrations/002_helper_functions.sql`, `migrations/008_boq_tables.sql` (word-count trigger), `migrations/017_clm_payment_tables.sql` (allocation-sum guard trigger)
  - Views → `migrations/011_views.sql` (`v_estimation_item_cost`, `v_item_commercial_analysis`, `v_item_commercial_analysis_final`), `migrations/019_clm_views.sql` (11 Client 360°/billing/cost views)
  - Full table DDL → `migrations/003_*.sql` through `010_*.sql` (Commercial Lifecycle), `013_*.sql` through `018_*.sql` (Client Management)
- **`seeds/`** — static seed data applied by `npm run seed` (see `seed.js`): `001_lookup_data.js` for the Commercial Lifecycle Lookup tables, `002_client_management_lookup_data.js` for the Client Management Lookup tables (`clm_client_type`, `clm_industry`, `clm_contact_type`).

## Setup

1. Fill in `.env` (see `.env.example`) with your Supabase project's `DATABASE_URL` (direct/session Postgres connection string), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`.
2. `npm run migrate` — creates every enum/table/index/function/trigger/view for both modules.
3. `npm run seed` — populates every lookup table (requires at least one row in the external `users` table, or set `SEED_USER_ID`).

External master tables (`companies`, `branches`, `users`, `employees`, `clients`, `projects`, `sites`, `vendors`, `currencies`, `taxes`) are **not** created by these migrations — they belong to other SAV ERP modules and are referenced by FK only, per each module's architecture spec. Note: `clm_client` (Client Management) is a separate table from the external `clients` table `com_rfq`/`com_boq` FK to — see the escalation notes at the top of `SAV_ERP_Client_Management_Module_Architecture.md`.
