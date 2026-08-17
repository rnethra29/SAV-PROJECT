# SAV ERP

Backend + frontend for the SAV Wind Foundations Construction ERP, organized **business module first**: open the repository root and the folder names tell you the business architecture before you open a single file.

```
SAV-PROJECT/
├── 01-commercial-lifecycle/     RFQ → Estimation → Market Price → Quotation → Negotiation → BOQ → PO
├── 02-site/
│   ├── 01-client-management/    Client Master → Contacts → Requirements → Billing → Payments → Client 360°
│   ├── 02-vendor-management/    Project → Vendor → Materials/Services → Procurement PO → Vendor Invoice/Payment
│   └── 03-subcontractor-management/   not started — structural placeholder only
├── shared/                      backend infrastructure + engines used by every module (config, auth, docs/
│                                 approvals/audit, RBAC, migration runner) — never duplicated per module
├── apps/web/                    Next.js frontend (all business-module UI lives inside here per-module, under
│                                 src/modules/ — see below; Next.js needs one unified app/ route tree)
├── apps/api/                    Express + Prisma skeleton for the separately-specified Auth/RBAC/Organization
│                                 foundation (`SAV-ERP-PROJECT-CONTEXT.md` §F) — not yet built beyond a health check
└── docs/architecture/           cross-cutting docs not scoped to one business module
```

Each business module also carries its own `ARCHITECTURE.md` (full DDL/API spec) and `README.md` (status + folder guide) — see [`01-commercial-lifecycle/README.md`](01-commercial-lifecycle/README.md), [`02-site/README.md`](02-site/README.md), and [`shared/README.md`](shared/README.md).

## Status

| Module | Frontend | Backend | Database |
|---|---|---|---|
| 01 Commercial Lifecycle | Built (fixture-driven, not yet wired to a live API) | Complete | Complete |
| 02-01 Client Management | Not started | Complete | Complete |
| 02-02 Vendor Management | Not started | Complete | Complete |
| 02-03 Subcontractor Management | Not started | Not started | Not started |
| Auth/RBAC platform (`apps/api`) | Not started | Skeleton (health check only) | Not started (no schema yet) |

## Quick start

```bash
npm install
cp .env.example .env   # fill in your Supabase project's values
npm run migrate        # applies every module's migrations, in the original cross-module dependency order
npm run seed            # populates every module's lookup tables + baseline RBAC
npm run dev              # backend on http://localhost:4000, docs at /api-docs
npm test                  # unit tests across every module (node:test) — business-rule logic, no DB needed
npm run dev:web            # Next.js frontend, separately (apps/web)
```

## Why the backend layers the way it does

Every module's `backend/` follows the same repository → service → controller → validator → route shape, one file per entity — this stayed unchanged by the reorg, only *where* each file lives changed. Genuinely cross-module infrastructure (env/DB config, auth/role/validation middleware, the ENUM and status-transition constants, the polymorphic Documents/Approvals/Audit Log engine, RBAC, and the migration runner) lives in `shared/`, not inside whichever module happened to define it first — see [`shared/README.md`](shared/README.md) for the full list and reasoning.

No live API URL changed as part of this reorg — every endpoint is still mounted at exactly the path it was before (e.g. still `/api/v1/rfqs`, `/api/v1/procurement-orders`); only the files implementing them moved.

## External dependencies

The backend deliberately does **not** create `companies`, `branches`, `users`, `employees`, `clients`, `sites`, `currencies`, or `taxes` — those belong to the future Auth/RBAC/Organization foundation (`apps/api`) and are referenced here by FK only. `npm run migrate` will stop at the first table that FKs to one of them until that foundation exists; re-running it later picks up right where it left off. (`vendors` and `projects` *are* created here already, as `vnd_vendor` and `clm_project` — see `02-site/02-vendor-management/ARCHITECTURE.md`.)

`clm_client` (Client Management) is intentionally a separate table from the external `clients` table that Commercial Lifecycle's `com_rfq`/`com_boq` already FK to, and `clm_project` similarly from the external `projects` table those same tables FK to — both are open reconciliations, flagged in-line in the relevant migration files' header comments and in each module's `ARCHITECTURE.md` escalation notes, not resolved by this reorg.
