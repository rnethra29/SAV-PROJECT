# SAV ERP — SITES Module: Client Management (Project & Financials Extension) + Vendor Management & Procurement
### Database Architecture Specification (PostgreSQL / Supabase / Prisma)

**Status:** Draft for review. This document extends the existing **Client Management** module (`clm_*`, prior spec: `SAV_ERP_Client_Management_Module_Architecture.md`) and introduces a brand-new **Vendor Management & Procurement** module (`vnd_*`). It reuses the **Commercial Lifecycle** module (`com_*`) wherever the request overlaps with work already specified there, rather than rebuilding it.

---

## 0. RECONCILIATION — READ THIS FIRST

Your prompt asks for a self-contained `CLIENT MANAGEMENT` + `VENDORS` database, including its own Projects, Purchase Orders, Invoices and Payments. Two documents already exist in this project (`SAV_ERP_Client_Management_Module_Architecture.md` and `SAV_ERP_Commercial_Lifecycle_Module_Architecture.md`) that already own large parts of this exact ground. Rather than silently duplicating that work (which would leave the database with two competing "client" tables and two competing "purchase order" tables), this document reconciles the three specs as follows. Each decision follows the rule you gave at the end of your prompt — *"do not blindly follow the proposed architecture if a better design exists."*

| Your request | Decision | Reasoning |
|---|---|---|
| Client Data, Client Requirements, Client Payments, Billing/Client Invoices | **Reused, not recreated.** These already exist as `clm_client`, `clm_client_requirement`, `clm_payment` / `clm_payment_allocation`, `clm_client_invoice` / `clm_client_invoice_line` in the Client Management doc. | Recreating them here would produce two client masters and two invoice tables — a direct violation of "avoid unnecessary duplicate data." |
| Projects | **Newly owned here**, as `clm_project` (extends Client Management — fills a gap the prior doc explicitly flagged as "external, assumed"). | No Project Management module exists yet in this project. Projects must live somewhere, and your instruction to make **PROJECT the central entity** requires an owned table, not an assumption. |
| Project Cost Details | **Newly owned here**, as `clm_project_cost` (budget/estimate per category) + calculated actuals. | Did not exist previously. |
| Purchase Orders (materials/services procurement) | **Newly owned here**, as `vnd_purchase_order` / `vnd_purchase_order_item` — a **direct procurement PO**, distinct from `com_po` (the Commercial Lifecycle module's **subcontract/work-package PO**, which is issued off a negotiated, BOQ-settled price after RFQ→Estimation→Quotation→Negotiation). | These are genuinely different documents in a construction company: buying 500 bags of cement from a material vendor is not the same commercial process as awarding a ₹3 Cr foundation subcontract off a negotiated BOQ. Merging them would force irrelevant columns (BOQ traceability, negotiation history) onto simple material POs, and vice versa. Both ultimately feed the same `clm_project_expense` ledger, so nothing is lost. |
| Client Payments | Reused (`clm_payment`). | Already exists. |
| Project Expenses | **Newly owned here**, as `clm_project_expense`, referencing `vnd_purchase_order`, `vnd_vendor`, `vnd_vendor_invoice` (this module) and, for subcontract work, `com_po` (Commercial Lifecycle). | This is the missing ledger both prior docs flagged as "external/assumed" — it can now be filled in because Vendors are finally an owned entity. |
| Vendors (full module: contacts, tax, bank, materials, documents, PO history, invoices, payments, performance) | **Newly owned here**, as `vnd_*` — previously `vendors` was only an external assumption referenced by `com_po.vendor_id`. | This is genuinely new ground; nothing to reconcile. `com_po.vendor_id` and the new `vnd_vendor.vendor_id` become the same physical table. |
| RBAC (users, roles, permissions) | **Newly owned here**, as `sec_role` / `sec_permission` / `sec_user_role` / `sec_role_permission`. `users` itself remains the Supabase `auth.users`-backed profile table both prior docs already assumed. | Neither prior doc defined roles/permissions; both only referenced `users` as an external FK target. |
| Documents, Approvals, Audit Trail | **Reused, not recreated.** Extends the existing polymorphic `com_documents`, `com_approvals`, `com_audit_log` (Commercial Lifecycle doc) with new `entity_type` values. | Matches the precedent already set by the Client Management doc (§13/§16 there) — one document/approval/audit engine for the whole ERP, not one per module. |

**Net effect:** this document owns **13 new tables** (`clm_project`, `clm_project_cost`, `clm_project_expense`, `vnd_vendor`, `vnd_vendor_contact`, `vnd_vendor_bank_account`, `vnd_material_service`, `vnd_vendor_rating`, `vnd_purchase_order`, `vnd_purchase_order_item`, `vnd_vendor_invoice`, `vnd_vendor_invoice_item`, `vnd_vendor_payment`, `vnd_vendor_payment_allocation`) plus 4 small RBAC tables and several lookups — while reusing 11 tables from the Client Management doc and the entire Commercial Lifecycle chain untouched.

**Open item for Nethra:** confirm that `com_po` (subcontract PO, Commercial Lifecycle) and `vnd_purchase_order` (material/service procurement PO, this doc) should indeed stay as two tables. If your business only ever wants one PO concept, they can be merged — but that would mean either dragging BOQ/negotiation columns onto every material PO, or losing subcontract traceability. Recommendation: keep them separate; `v_project_financial_summary` (§10) reports on both together so nobody has to think about the split day-to-day.

---

## PHASE 1 — BUSINESS ARCHITECTURE ANALYSIS

### 1.1 Full workflow (this document's scope, in context of the whole ERP)

```
CLIENT (clm_client, existing)
   → CLIENT REQUIREMENT (clm_client_requirement, existing)
   → PROJECT (clm_project, NEW) ← requirement_id, client_id
        → PROJECT COST PLAN (clm_project_cost, NEW) — estimated + budgeted, per category
        → [Subcontract path]  RFQ → Estimation → Quotation → Negotiation → BOQ → com_po (existing, Commercial Lifecycle)
        → [Procurement path]  VENDOR (vnd_vendor, NEW) → MATERIAL/SERVICE (vnd_material_service, NEW)
                               → PURCHASE ORDER (vnd_purchase_order/_item, NEW)
                               → VENDOR INVOICE (vnd_vendor_invoice/_item, NEW)
                               → VENDOR PAYMENT (vnd_vendor_payment/_allocation, NEW)
        → PROJECT EXPENSE (clm_project_expense, NEW) ← rolls up both paths above
        → CLIENT INVOICE / BILLING (clm_client_invoice/_line, existing)
        → CLIENT PAYMENT (clm_payment/_allocation, existing)
   → PROJECT PROFIT / VARIANCE (views, NEW — §10)

Cross-cutting, all reused: DOCUMENTS (com_documents) · APPROVALS (com_approvals) · AUDIT (com_audit_log) · RBAC (sec_*, NEW)
```

### 1.2 Actors

| Actor | Responsibility |
|---|---|
| Project Manager | Owns `clm_project`, sets budget/cost plan, tracks progress |
| Procurement Officer | Raises `vnd_purchase_order`, selects vendors/materials |
| Procurement Manager | Approves POs (Manager Approval stage) |
| Site Engineer | Confirms receipt of materials (goods-receipt status on PO), raises project expenses |
| Accountant | Records vendor invoices, matches against POs, records client/vendor payments |
| Finance Manager | Approves vendor invoices, approves payments, final PO approval stage |
| Management | Views profitability, dashboards, does not transact |
| Viewer | Read-only |

### 1.3 Missing entities identified (and added)

- **`clm_project`** — the prior Client Management doc explicitly assumed this externally. It must be owned somewhere; owned here.
- **`clm_project_cost`** — a place to store *estimated* and *budgeted* cost per category, separate from *actual* (which is always calculated — see Phase 10). Without this table there is nowhere to store a budget to compare actuals against.
- **`vnd_vendor_bank_account`** — your field list put bank details directly on the vendor. Split into its own table because (a) a vendor commonly has more than one account over its lifetime and a payment must point at *the account it was actually paid to*, and (b) isolating sensitive financial data into its own table makes column/row-level security and encryption-at-rest policies easier to scope tightly (see Phase 20).
- **`vnd_vendor_contact`** — same reasoning as `clm_client_contact` in the existing doc: a vendor has a purchase contact, an accounts contact, a dispatch contact, etc. — a repeatable child table, not flat columns.
- **`vnd_vendor_rating`** — your field list asks for `quality_rating`, `delivery_rating`, `price_rating` per vendor. These are *subjective, periodic* inputs (someone rates the vendor after a delivery), so they need a small append-style table; the *objective* stats (`on_time_delivery_percentage`, `total_pos`, `completed_pos`, …) are 100% derivable from PO/invoice data and must **not** be stored — see the `v_vendor_performance` view in Phase 6.
- **`vnd_vendor_payment_allocation`** — mirrors `clm_payment_allocation`. Without it, "a payment settling three separate vendor invoices" (completely normal in practice) has nowhere to be recorded, and "payment exceeding invoice balance" (a validation you explicitly asked for) cannot be enforced.
- **`sec_role`, `sec_permission`, `sec_role_permission`, `sec_user_role`** — RBAC was requested explicitly but never modeled in either prior doc.

### 1.4 Redundant entities identified (and removed from your original list)

- A separate **`purchase_order_items`**-style table for the *Vendor PO History* section (§7 of your Vendors spec) is not needed — it's fully answered by aggregating `vnd_purchase_order` (see `v_vendor_po_summary`, Phase 6). Storing "Total PO Value / Number of POs / Completed / Pending / Cancelled" as columns on the vendor row would mean updating the vendor row on every PO change — a classic derived-data trap this ERP's own conventions (see both prior docs) explicitly reject.
- A dedicated **`vendor_documents`** table is not created — `com_documents` (already polymorphic, already versioned, already Supabase-Storage-backed) is extended with new `entity_type` values instead, exactly mirroring how the Client Management doc handled the same request for clients.
- **Client Invoices / Client Payments** are not recreated — see the reconciliation table above.

---

## PHASE 2 — MODULE / SUBMODULE HIERARCHY

```
SAV CONSTRUCTIONS ERP
        │
      SITES
        │
   ┌────┴─────────────────────────┐
   │                              │
CLIENT MANAGEMENT              VENDORS
(clm_*, existing + extended)   (vnd_*, new)
   │                              │
 ┌─┴───────────────┐        ┌─────┴──────────────┐
 Client (existing)  Project  Vendor Master        Materials/Services
 Requirement (ex.)  (NEW)    Contacts (NEW)       PO + Items (NEW)
 Invoice/Billing(ex.)Cost    Bank Accounts (NEW)  Vendor Invoice (NEW)
 Payment (existing) (NEW)    Documents (reused)   Vendor Payment (NEW)
                    Expense                       Rating/Performance (NEW)
                    (NEW)

Shared/cross-cutting (reused across both submodules and the rest of the ERP):
  Documents (com_documents) · Approvals (com_approvals) · Audit Log (com_audit_log) · RBAC (sec_*, NEW)

Referenced, not owned by SITES:
  Commercial Lifecycle chain (com_rfq → com_estimation → com_quotation → com_negotiation_offers → com_boq → com_po)
```

---

## PHASE 3 — COMPLETE ENTITY LIST WITH PURPOSE

| # | Entity | New / Reused | Purpose |
|---|---|---|---|
| 1 | `clm_client` | Reused | Client master (see Client Management doc) |
| 2 | `clm_client_requirement` | Reused | Pre-project requirement capture |
| 3 | **`clm_project`** | **New** | Central project record — the hub this whole module revolves around |
| 4 | **`clm_project_cost`** | **New** | Estimated/budgeted cost per category per project |
| 5 | `clm_client_invoice` / `_line` | Reused | Client billing |
| 6 | `clm_payment` / `_allocation` | Reused | Money received from client |
| 7 | **`clm_project_expense`** | **New** | Actual money spent/recognized against a project, from any source |
| 8 | **`vnd_vendor`** | **New** | Vendor master |
| 9 | **`vnd_vendor_contact`** | **New** | Vendor contacts (purchase/accounts/dispatch…) |
| 10 | **`vnd_vendor_bank_account`** | **New** | Vendor bank accounts (sensitive) |
| 11 | **`vnd_material_service`** | **New** | Catalog of what a vendor supplies, with standard rate |
| 12 | **`vnd_vendor_rating`** | **New** | Subjective periodic vendor ratings |
| 13 | **`vnd_purchase_order`** | **New** | Direct procurement PO header |
| 14 | **`vnd_purchase_order_item`** | **New** | PO line items |
| 15 | **`vnd_vendor_invoice`** | **New** | Invoice received from vendor |
| 16 | **`vnd_vendor_invoice_item`** | **New** | Vendor invoice line items, reconciled against PO items |
| 17 | **`vnd_vendor_payment`** | **New** | Money paid to vendor |
| 18 | **`vnd_vendor_payment_allocation`** | **New** | Payment ↔ invoice many-to-many allocation |
| 19 | `vnd_vendor_type`, `vnd_material_category` | New (lookups) | Small controlled vocabularies |
| 20 | **`sec_role`, `sec_permission`, `sec_role_permission`, `sec_user_role`** | **New** | RBAC |
| — | `com_rfq…com_po` chain | Reused (external to this doc) | Subcontract/work-package commercial lifecycle |
| — | `com_documents`, `com_approvals`, `com_audit_log` | Reused, extended | Documents, approvals, audit |
| — | `companies`, `branches`, `users`, `employees`, `currencies`, `taxes` | External masters | Standing ERP masters |

---

## PHASE 4 — ER / RELATIONSHIP EXPLANATION

- **Client → Project** (1:many): every project belongs to exactly one client. `clm_project.client_id → clm_client.client_id`.
- **Client Requirement → Project** (1:1 typical, modeled nullable 1:many): a requirement usually converts into one project; kept nullable + non-unique in case a requirement is split into multiple projects (e.g. phased delivery).
- **Project → Project Cost** (1:many): one row per (project, cost_category) — a small, fixed, known set of 8 categories, so this is a controlled fan-out, not an open list.
- **Project → Purchase Order** (1:many): a project can have many procurement POs; a PO belongs to exactly one project.
- **Vendor → Purchase Order** (1:many): a vendor can fulfill many POs across many projects.
- **Purchase Order → PO Item** (1:many), **PO Item → Vendor Invoice Item** (1:many, since partial/split invoicing against one PO line is normal).
- **Vendor Invoice → Vendor Payment**: many-to-many via `vnd_vendor_payment_allocation`, same reasoning as the existing `clm_payment_allocation` — one payment can settle several invoices, and one invoice can be settled across several payments (partial payments, explicitly required).
- **Project → Project Expense** (1:many): every recognized cost line, whatever its source (procurement PO, subcontract PO, direct/petty cost) is a expense row.
- **Vendor → Vendor Contact / Bank Account / Material-Service / Rating** (all 1:many): standard master/child fan-outs.
- **Vendor → Vendor Invoice** (1:many), **Vendor Invoice → Vendor Invoice Item** (1:many).
- **Documents/Approvals/Audit** are polymorphic against every entity in this doc via `(entity_type, entity_id)`, same mechanism already established.
- **RBAC**: `users ←(sec_user_role)→ sec_role ←(sec_role_permission)→ sec_permission` — pure many-to-many both directions, no permissions hard-coded on any business table.

No circular FKs are introduced. The FK graph flows strictly `Client → Project → {Cost Plan, PO/Vendor chain, Expense, Invoice, Payment}` — one direction, matching the business flow diagram you provided.

---

## PHASE 5 — CARDINALITY OF EVERY IMPORTANT RELATIONSHIP

| Relationship | Cardinality | Enforced by |
|---|---|---|
| Client → Project | 1 : N | FK `clm_project.client_id NOT NULL` |
| Client Requirement → Project | 1 : 0..N | FK `clm_project.requirement_id` nullable |
| Project → Project Cost | 1 : N (≤8 per project, one per category) | FK + `UNIQUE(project_id, cost_category)` |
| Project → Purchase Order | 1 : N | FK `vnd_purchase_order.project_id NOT NULL` |
| Vendor → Purchase Order | 1 : N | FK `vnd_purchase_order.vendor_id NOT NULL` |
| Purchase Order → PO Item | 1 : N | FK `vnd_purchase_order_item.po_id NOT NULL` |
| Vendor → Vendor Invoice | 1 : N | FK |
| Purchase Order → Vendor Invoice | 0..1 : N (an invoice may not reference a PO — e.g. a service call-out) | FK nullable |
| Vendor Invoice → Vendor Invoice Item | 1 : N | FK |
| PO Item → Vendor Invoice Item | 0..1 : N | FK nullable, supports partial/split invoicing |
| Vendor Invoice ↔ Vendor Payment | M : N | Junction `vnd_vendor_payment_allocation` |
| Vendor → Vendor Contact | 1 : N | FK |
| Vendor → Vendor Bank Account | 1 : N (exactly one `is_primary`) | FK + partial unique index |
| Vendor → Material/Service | 1 : N | FK |
| Vendor → Rating | 1 : N (append-only, one per review event) | FK |
| Project → Project Expense | 1 : N | FK |
| Vendor / PO / Vendor Invoice → Project Expense | 0..1 each : N | all nullable FKs — an expense may cite any subset |
| User ↔ Role | M : N | Junction `sec_user_role` |
| Role ↔ Permission | M : N | Junction `sec_role_permission` |

---

## PHASE 6 — COMPLETE DATABASE TABLE DESIGN

Convention (unchanged from the two prior docs): UUID v4 PKs (`gen_random_uuid()`), `company_id`/`branch_id` on every table, soft delete via `deleted_at` (never hard-delete), standard audit columns on Core/Transaction tables (`created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`), a lighter audit set on Lookup and append-only History tables, `NUMERIC` for money, `TIMESTAMPTZ` for time, `snake_case` throughout.

### 6.1 `clm_project` (Core — NEW)

| Column | Type | Null | Default | PK/FK/U/IDX | Description |
|---|---|---|---|---|---|
| project_id | UUID | N | gen_random_uuid() | PK | |
| project_code | VARCHAR(30) | N | | U, IDX | e.g. `PRJ-2026-0031` |
| project_name | VARCHAR(200) | N | | IDX | |
| client_id | UUID | N | | FK→clm_client, IDX | |
| requirement_id | UUID | | | FK→clm_client_requirement | Nullable — see Phase 5 |
| site_location | VARCHAR(255) | N | | | Free-text per your field list; no separate Sites master introduced (out of scope, avoids over-engineering) |
| description | TEXT | | | | |
| start_date | DATE | | | | |
| expected_completion_date | DATE | | | | |
| actual_completion_date | DATE | | | | |
| contract_value | NUMERIC(18,2) | N | | CHECK ≥ 0 | Agreed value with client — the anchor for Expected Profit |
| project_manager_id | UUID | | | FK→employees | |
| project_status | clm_project_status (ENUM) | N | 'Planning' | IDX | Planning/Estimation/Approved/In Progress/On Hold/Completed/Cancelled |
| progress_percentage | NUMERIC(5,2) | N | 0 | CHECK 0–100 | Manually updated or rolled up from a future milestone module — out of scope here |
| remarks | TEXT | | | | |

*Design note:* `progress_percentage` is stored (not derived) because no work-breakdown/milestone module exists yet to calculate it from; flagged as a future candidate to convert to a calculated column once a milestones/schedule module exists.

### 6.2 `clm_project_cost` (Core — NEW)

| Column | Type | Null | Default | Key | Description |
|---|---|---|---|---|---|
| project_cost_id | UUID | N | gen_random_uuid() | PK | |
| project_id | UUID | N | | FK→clm_project, IDX | |
| cost_category | clm_cost_category (ENUM) | N | | IDX | Material/Labour/Equipment/Transportation/Subcontractor/Overhead/Contingency/Other |
| estimated_cost | NUMERIC(18,2) | N | 0 | CHECK ≥ 0 | From the estimation stage |
| budgeted_cost | NUMERIC(18,2) | N | 0 | CHECK ≥ 0 | Approved working budget (may differ from estimate after review) |
| remarks | TEXT | | | | |

UNIQUE (`project_id`, `cost_category`)

*Design note — no `actual_cost` column:* actual cost is **always** `SUM(clm_project_expense.amount) WHERE project_id = … AND expense_category = …` — see `v_project_cost_summary` (Phase 6.16). Storing it here would violate "do not unnecessarily duplicate calculated values," the instruction you gave explicitly for this exact metric.

### 6.3 `clm_project_expense` (Core — NEW)

| Column | Type | Null | Default | Key | Description |
|---|---|---|---|---|---|
| expense_id | UUID | N | gen_random_uuid() | PK | |
| project_id | UUID | N | | FK→clm_project, IDX | |
| expense_category | clm_cost_category (ENUM) | N | | IDX | Same enum as `clm_project_cost` — required for the budget-vs-actual view to join cleanly |
| vendor_id | UUID | | | FK→vnd_vendor, IDX | Nullable — not every expense has a vendor (e.g. statutory fee) |
| purchase_order_id | UUID | | | FK→vnd_purchase_order, IDX | Nullable |
| subcontract_po_id | UUID | | | FK→com_po, IDX | Nullable — subcontract-path expenses reference the Commercial Lifecycle PO |
| vendor_invoice_id | UUID | | | FK→vnd_vendor_invoice, IDX | Nullable |
| description | TEXT | N | | | |
| amount | NUMERIC(18,2) | N | | CHECK > 0 | |
| expense_date | DATE | N | | IDX | |
| payment_status | clm_expense_payment_status (ENUM) | N | 'Unpaid' | | Unpaid/Partially Paid/Paid — derived display value, kept as a denormalized status for worklist filtering; source of truth is still `vnd_vendor_payment_allocation` |
| approval_status | clm_approval_status_simple (ENUM) | N | 'Pending' | IDX | Pending/Approved/Rejected |
| remarks | TEXT | | | | |

CHECK: at least one of `vendor_id`, `purchase_order_id`, `subcontract_po_id` is set **or** `expense_category = 'Other'` (statutory/petty costs have no vendor).

*Design note on `payment_status`:* this is the one intentionally denormalized status in this entire document. It is a UI convenience (fast filtering of "what's still unpaid" without a join on every list render) and is **written by application logic whenever a `vnd_vendor_payment_allocation` row is inserted/reversed against this expense's linked invoice** — not a free-standing source of truth. This mirrors how `clm_client_invoice.status` already works in the existing doc (job/trigger-maintained display state, real balance always computed in a view).

### 6.4 `vnd_vendor_type` (Lookup — NEW)

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| vendor_type_id | UUID | N | gen_random_uuid() | PK |
| type_name | VARCHAR(100) | N | | U |
| is_active | BOOLEAN | N | true | |

Seeded values: Material Supplier, Equipment Supplier, Subcontractor, Service Provider, Transporter.

### 6.5 `vnd_material_category` (Lookup — NEW)

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| material_category_id | UUID | N | gen_random_uuid() | PK |
| category_name | VARCHAR(100) | N | | U |
| is_active | BOOLEAN | N | true |

### 6.6 `vnd_vendor` (Core — NEW)

| Column | Type | Null | Default | Key | Description |
|---|---|---|---|---|---|
| vendor_id | UUID | N | gen_random_uuid() | PK | |
| vendor_code | VARCHAR(30) | N | | U, IDX | |
| vendor_name | VARCHAR(200) | N | | IDX | |
| vendor_type_id | UUID | N | | FK→vnd_vendor_type, IDX | |
| company_type | VARCHAR(50) | | | | Proprietorship/Partnership/Pvt Ltd/LLP/Individual |
| registration_date | DATE | | | | |
| address_line1 | VARCHAR(255) | N | | | |
| address_line2 | VARCHAR(255) | | | | |
| city | VARCHAR(100) | N | | | |
| state | VARCHAR(100) | N | | | |
| country | VARCHAR(100) | N | 'India' | | |
| pincode | VARCHAR(12) | N | | | |
| website | VARCHAR(200) | | | | |
| gst_number | VARCHAR(15) | | | U (partial, WHERE NOT NULL) | |
| pan_number | VARCHAR(10) | | | | |
| gst_registration_type | VARCHAR(50) | | | | Regular/Composition/Unregistered |
| msme_status | BOOLEAN | N | false | | |
| msme_number | VARCHAR(30) | | | | |
| company_registration_number | VARCHAR(50) | | | | |
| tds_applicable | BOOLEAN | N | true | | |
| tds_category | VARCHAR(50) | | | | Drives TDS rate lookup — kept as a reference code, not a hardcoded rate (rates change by law, not by vendor) |
| vendor_status | vnd_vendor_status (ENUM) | N | 'Active' | IDX | Active/Inactive/Blacklisted/Under Review |
| notes | TEXT | | | | |

UNIQUE (`vendor_code`); partial UNIQUE (`gst_number`) WHERE `gst_number IS NOT NULL`

*Design note:* Contact person and bank details are **not** columns here (see 6.7/6.8) — same reasoning as the reconciliation note in Phase 1.3: they're repeatable, sensitive, and change over the vendor relationship's lifetime, so they get their own tables rather than being squeezed onto the master row.

### 6.7 `vnd_vendor_contact` (Core — NEW)

| Column | Type | Null | Default | Key | Description |
|---|---|---|---|---|---|
| vendor_contact_id | UUID | N | gen_random_uuid() | PK | |
| vendor_id | UUID | N | | FK→vnd_vendor, IDX | |
| contact_name | VARCHAR(150) | N | | | |
| designation | VARCHAR(100) | | | | |
| contact_role | VARCHAR(50) | N | 'General' | | Purchase/Accounts/Dispatch/Technical/General — free text-ish, kept as VARCHAR rather than a new lookup table since it's low-cardinality and rarely queried on its own |
| mobile_number | VARCHAR(20) | N | | | |
| alternate_number | VARCHAR(20) | | | | |
| email | VARCHAR(150) | | | | |
| is_primary_contact | BOOLEAN | N | false | | |
| is_active | BOOLEAN | N | true | | |

Partial UNIQUE (`vendor_id`) WHERE `is_primary_contact = true AND deleted_at IS NULL` — exactly one primary contact per vendor.

### 6.8 `vnd_vendor_bank_account` (Core, sensitive — NEW)

| Column | Type | Null | Default | Key | Description |
|---|---|---|---|---|---|
| bank_account_id | UUID | N | gen_random_uuid() | PK | |
| vendor_id | UUID | N | | FK→vnd_vendor, IDX | |
| account_holder_name | VARCHAR(150) | N | | | |
| bank_name | VARCHAR(150) | N | | | |
| account_number | VARCHAR(30) | N | | | **Encrypt at rest / mask in API responses — see Phase 20** |
| ifsc_code | VARCHAR(11) | N | | | |
| branch | VARCHAR(150) | | | | |
| account_type | VARCHAR(20) | | | | Savings/Current |
| upi_id | VARCHAR(100) | | | | |
| is_primary | BOOLEAN | N | true | | |
| is_verified | BOOLEAN | N | false | | Set true after a penny-drop/manual verification step |
| verified_at | TIMESTAMPTZ | | | | |
| verified_by | UUID | | | FK→users | |

Partial UNIQUE (`vendor_id`) WHERE `is_primary = true AND deleted_at IS NULL`.

### 6.9 `vnd_material_service` (Core — NEW)

| Column | Type | Null | Default | Key | Description |
|---|---|---|---|---|---|
| material_service_id | UUID | N | gen_random_uuid() | PK | |
| vendor_id | UUID | N | | FK→vnd_vendor, IDX | |
| material_category_id | UUID | | | FK→vnd_material_category | |
| item_name | VARCHAR(200) | N | | IDX | |
| description | TEXT | | | | |
| unit | VARCHAR(20) | N | | | |
| standard_rate | NUMERIC(18,4) | | | CHECK ≥ 0 | Reference/catalog rate — actual PO rate can differ, see 6.11 |
| tax_rate | NUMERIC(5,2) | N | 0 | | |
| minimum_order_quantity | NUMERIC(18,3) | | | CHECK ≥ 0 | |
| delivery_time_days | INTEGER | | | | |
| is_active | BOOLEAN | N | true | | |

### 6.10 `vnd_vendor_rating` (Supporting, append-style — NEW)

| Column | Type | Null | Default | Key | Description |
|---|---|---|---|---|---|
| rating_id | UUID | N | gen_random_uuid() | PK | |
| vendor_id | UUID | N | | FK→vnd_vendor, IDX | |
| purchase_order_id | UUID | | | FK→vnd_purchase_order | The PO/delivery this rating is about, if applicable |
| quality_rating | SMALLINT | N | | CHECK 1–5 | |
| delivery_rating | SMALLINT | N | | CHECK 1–5 | |
| price_rating | SMALLINT | N | | CHECK 1–5 | |
| rated_by | UUID | N | | FK→users | |
| rated_at | TIMESTAMPTZ | N | now() | IDX | |
| remarks | TEXT | | | | |

*(Lighter audit: `created_at`/`created_by` only — a rating is a point-in-time opinion, corrected by a new rating, never edited in place.)*
`overall_rating` is **not** stored — it's `AVG` of the three sub-ratings, computed in `v_vendor_performance` (6.17).

### 6.11 `vnd_purchase_order` (Core — NEW)

| Column | Type | Null | Default | Key | Description |
|---|---|---|---|---|---|
| po_id | UUID | N | gen_random_uuid() | PK | |
| po_number | VARCHAR(50) | N | | U, IDX | |
| project_id | UUID | N | | FK→clm_project, IDX | |
| vendor_id | UUID | N | | FK→vnd_vendor, IDX | |
| po_date | DATE | N | | | |
| expected_delivery_date | DATE | | | | |
| delivery_location | VARCHAR(255) | | | | |
| payment_terms | TEXT | | | | |
| subtotal_amount | NUMERIC(18,2) | N | 0 | CHECK ≥ 0 | Roll-up of items — trigger-maintained, see note |
| discount_amount | NUMERIC(18,2) | N | 0 | CHECK ≥ 0 | |
| tax_amount | NUMERIC(18,2) | N | 0 | CHECK ≥ 0 | |
| total_amount | NUMERIC(18,2) | N | 0 | CHECK ≥ 0 | `subtotal − discount + tax`, trigger-maintained |
| status | vnd_po_status (ENUM) | N | 'Draft' | IDX | Draft/Pending Approval/Approved/Sent to Vendor/Partially Received/Received/Closed/Cancelled |
| approval_status | vnd_approval_status (ENUM) | N | 'Not Required' | IDX | Not Required/Pending/Manager Approved/Finance Approved/Rejected — mirrors the two-stage approval example in your prompt, backed by `com_approvals` rows for the actual sign-off records |
| remarks | TEXT | | | | |

*Design note on `subtotal_amount`/`total_amount`:* unlike `com_quotation`'s equivalents (left un-maintained/nullable in the Commercial Lifecycle doc, since that header total is rarely needed ahead of the item rollup), procurement POs are approved and sent to vendors *as a header total*, so a small `AFTER INSERT/UPDATE/DELETE` trigger on `vnd_purchase_order_item` keeps the header in sync — a deliberate, narrow exception to "prefer views," justified because the PO PDF sent to the vendor needs a stable, printable total that doesn't recompute after the fact.

### 6.12 `vnd_purchase_order_item` (Core — NEW)

| Column | Type | Null | Default | Key | Description |
|---|---|---|---|---|---|
| po_item_id | UUID | N | gen_random_uuid() | PK | |
| po_id | UUID | N | | FK→vnd_purchase_order, IDX | |
| material_service_id | UUID | | | FK→vnd_material_service | Nullable — a one-off item not in the catalog is still allowed |
| item_name | VARCHAR(200) | N | | | Snapshot — remains accurate even if the catalog item is later renamed |
| description | TEXT | | | | |
| quantity | NUMERIC(18,3) | N | | CHECK > 0 | |
| unit | VARCHAR(20) | N | | | |
| unit_price | NUMERIC(18,4) | N | | CHECK ≥ 0 | |
| discount_amount | NUMERIC(18,2) | N | 0 | CHECK ≥ 0 | |
| tax_percentage | NUMERIC(5,2) | N | 0 | | |
| line_amount | NUMERIC(18,2) | N | | GENERATED ALWAYS AS (quantity × unit_price − discount_amount) STORED | Pre-tax line total, same-row generated column — safe |
| received_quantity | NUMERIC(18,3) | N | 0 | CHECK ≥ 0 AND ≤ quantity | Supports partial receipt tracking |
| sequence_no | INTEGER | N | | | |
| remarks | TEXT | | | | |

### 6.13 `vnd_vendor_invoice` (Core — NEW)

| Column | Type | Null | Default | Key | Description |
|---|---|---|---|---|---|
| vendor_invoice_id | UUID | N | gen_random_uuid() | PK | |
| invoice_number | VARCHAR(50) | N | | | Vendor's own invoice number — **not globally unique** (two vendors can both number their invoices "001") |
| vendor_id | UUID | N | | FK→vnd_vendor, IDX | |
| purchase_order_id | UUID | | | FK→vnd_purchase_order, IDX | Nullable |
| project_id | UUID | N | | FK→clm_project, IDX | |
| invoice_date | DATE | N | | | |
| due_date | DATE | | | | |
| subtotal_amount | NUMERIC(18,2) | N | | CHECK ≥ 0 | |
| tax_amount | NUMERIC(18,2) | N | 0 | CHECK ≥ 0 | |
| total_amount | NUMERIC(18,2) | N | | GENERATED ALWAYS AS (subtotal_amount + tax_amount) STORED | |
| status | vnd_invoice_status (ENUM) | N | 'Draft' | IDX | Draft/Submitted/Verified/Approved/Partially Paid/Paid/Disputed/Cancelled |
| verified_by | UUID | | | FK→users | Required-invoice-verification-before-payment gate (your validation list) |
| verified_at | TIMESTAMPTZ | | | | |
| remarks | TEXT | | | | |

UNIQUE (`vendor_id`, `invoice_number`) — correctly scopes the "duplicate invoice number" validation *per vendor*, not globally, since two different vendors legitimately reuse the same numbering.

*Design note — no stored `amount_paid`/`balance_amount`:* identical reasoning to `clm_client_invoice` in the existing doc — computed in `v_vendor_invoice_summary` (6.18) from `vnd_vendor_payment_allocation`, never stored.

### 6.14 `vnd_vendor_invoice_item` (Core — NEW)

| Column | Type | Null | Default | Key | Description |
|---|---|---|---|---|---|
| vendor_invoice_item_id | UUID | N | gen_random_uuid() | PK | |
| vendor_invoice_id | UUID | N | | FK→vnd_vendor_invoice, IDX | |
| po_item_id | UUID | | | FK→vnd_purchase_order_item, IDX | Nullable — reconciliation link |
| description | TEXT | N | | | |
| quantity | NUMERIC(18,3) | N | | CHECK > 0 | |
| unit | VARCHAR(20) | | | | |
| rate | NUMERIC(18,4) | N | | CHECK ≥ 0 | |
| line_amount | NUMERIC(18,2) | N | | GENERATED ALWAYS AS (quantity × rate) STORED | |
| sequence_no | INTEGER | N | | | |

### 6.15 `vnd_vendor_payment` (Core — NEW)

| Column | Type | Null | Default | Key | Description |
|---|---|---|---|---|---|
| vendor_payment_id | UUID | N | gen_random_uuid() | PK | |
| payment_reference_number | VARCHAR(100) | N | | U, IDX | |
| vendor_id | UUID | N | | FK→vnd_vendor, IDX | |
| project_id | UUID | | | FK→clm_project | Nullable — a payment can cover invoices across several projects, resolved via allocation |
| bank_account_id | UUID | | | FK→vnd_vendor_bank_account | Which account it was actually paid to |
| payment_date | DATE | N | | IDX | |
| amount | NUMERIC(18,2) | N | | CHECK > 0 | |
| payment_method | vnd_payment_method (ENUM) | N | | | Bank Transfer/Cheque/UPI/Cash/Other |
| transaction_reference | VARCHAR(100) | | | | |
| payment_status | vnd_payment_status (ENUM) | N | 'Pending' | IDX | Pending/Processed/Failed/Reversed |
| remarks | TEXT | | | | |
| approved_by | UUID | | | FK→users | Required-approval-before-payment gate |

### 6.16 `vnd_vendor_payment_allocation` (Supporting, junction — NEW)

| Column | Type | Null | Default | Key |
|---|---|---|---|---|
| allocation_id | UUID | N | gen_random_uuid() | PK |
| vendor_payment_id | UUID | N | | FK→vnd_vendor_payment, IDX |
| vendor_invoice_id | UUID | N | | FK→vnd_vendor_invoice, IDX |
| allocated_amount | NUMERIC(18,2) | N | | CHECK > 0 |
| allocated_date | DATE | N | | |

UNIQUE (`vendor_payment_id`, `vendor_invoice_id`). Same `AFTER INSERT` trigger pattern as `clm_fn_check_allocation` (see DDL, Phase 8) enforces: allocations for one payment never exceed that payment's amount, allocations for one invoice never exceed that invoice's total.

### 6.17 Derived views for this module

```sql
-- Vendor performance (objective stats + average of subjective ratings)
CREATE VIEW v_vendor_performance AS
SELECT v.vendor_id,
       COUNT(po.po_id) AS total_pos,
       COUNT(po.po_id) FILTER (WHERE po.status = 'Closed') AS completed_pos,
       COUNT(po.po_id) FILTER (WHERE po.status = 'Cancelled') AS cancelled_pos,
       COUNT(po.po_id) FILTER (WHERE po.status NOT IN ('Closed','Cancelled')) AS pending_pos,
       COUNT(po.po_id) FILTER (WHERE po.status = 'Closed'
              AND po.expected_delivery_date IS NOT NULL
              AND po.updated_at::date > po.expected_delivery_date) AS delayed_deliveries,
       CASE WHEN COUNT(po.po_id) FILTER (WHERE po.status = 'Closed') = 0 THEN NULL
            ELSE round(100.0 * COUNT(po.po_id) FILTER (WHERE po.status = 'Closed'
                   AND (po.expected_delivery_date IS NULL OR po.updated_at::date <= po.expected_delivery_date))
                 / COUNT(po.po_id) FILTER (WHERE po.status = 'Closed'), 2) END AS on_time_delivery_percentage,
       round(AVG(r.quality_rating), 2)  AS avg_quality_rating,
       round(AVG(r.delivery_rating), 2) AS avg_delivery_rating,
       round(AVG(r.price_rating), 2)    AS avg_price_rating,
       round(AVG((r.quality_rating + r.delivery_rating + r.price_rating) / 3.0), 2) AS overall_rating
FROM vnd_vendor v
LEFT JOIN vnd_purchase_order po ON po.vendor_id = v.vendor_id AND po.deleted_at IS NULL
LEFT JOIN vnd_vendor_rating r ON r.vendor_id = v.vendor_id
GROUP BY v.vendor_id;

-- Vendor PO summary (replaces storing running totals on the vendor row)
CREATE VIEW v_vendor_po_summary AS
SELECT vendor_id,
       COUNT(*) AS number_of_pos,
       SUM(total_amount) AS total_po_value,
       COUNT(*) FILTER (WHERE status = 'Closed') AS completed_pos,
       COUNT(*) FILTER (WHERE status NOT IN ('Closed','Cancelled')) AS pending_pos,
       COUNT(*) FILTER (WHERE status = 'Cancelled') AS cancelled_pos
FROM vnd_purchase_order WHERE deleted_at IS NULL GROUP BY vendor_id;

-- Vendor invoice outstanding (never stored on the invoice row)
CREATE VIEW v_vendor_invoice_summary AS
SELECT inv.vendor_invoice_id, inv.vendor_id, inv.total_amount,
       COALESCE(SUM(a.allocated_amount), 0) AS amount_paid,
       inv.total_amount - COALESCE(SUM(a.allocated_amount), 0) AS balance_amount,
       inv.status
FROM vnd_vendor_invoice inv
LEFT JOIN vnd_vendor_payment_allocation a ON a.vendor_invoice_id = inv.vendor_invoice_id
WHERE inv.deleted_at IS NULL
GROUP BY inv.vendor_invoice_id, inv.vendor_id, inv.total_amount, inv.status;

-- Financial traceability chain per vendor
CREATE VIEW v_vendor_financial_summary AS
SELECT v.vendor_id,
       COALESCE(pos.total_po_value, 0) AS total_po_value,
       COALESCE(SUM(inv.total_amount), 0) AS total_invoice_value,
       COALESCE(SUM(pa.allocated_amount), 0) AS total_paid,
       COALESCE(SUM(inv.total_amount), 0) - COALESCE(SUM(pa.allocated_amount), 0) AS pending_payable
FROM vnd_vendor v
LEFT JOIN v_vendor_po_summary pos ON pos.vendor_id = v.vendor_id
LEFT JOIN vnd_vendor_invoice inv ON inv.vendor_id = v.vendor_id AND inv.deleted_at IS NULL
LEFT JOIN vnd_vendor_payment_allocation pa ON pa.vendor_invoice_id = inv.vendor_invoice_id
GROUP BY v.vendor_id, pos.total_po_value;
```

### 6.18 Project-centric views (financial traceability — the heart of Phase 10)

```sql
-- Actual cost per project per category (budget vs actual)
CREATE VIEW v_project_cost_summary AS
SELECT pc.project_id, pc.cost_category, pc.estimated_cost, pc.budgeted_cost,
       COALESCE(pe.actual_cost, 0) AS actual_cost,
       pc.budgeted_cost - COALESCE(pe.actual_cost, 0) AS budget_variance,
       pc.estimated_cost - COALESCE(pe.actual_cost, 0) AS cost_variance
FROM clm_project_cost pc
LEFT JOIN (SELECT project_id, expense_category, SUM(amount) AS actual_cost
           FROM clm_project_expense GROUP BY project_id, expense_category) pe
  ON pe.project_id = pc.project_id AND pe.expense_category = pc.cost_category;

-- Full per-project financial summary — CONTRACT VALUE -> BILLING -> PAYMENTS -> REVENUE
--                                        PROJECT BUDGET -> PO -> VENDOR INVOICE -> VENDOR PAYMENT -> EXPENSE -> ACTUAL COST
CREATE VIEW v_project_financial_summary AS
SELECT p.project_id, p.project_code, p.project_name, p.contract_value,
       COALESCE(billed.total_billed, 0)          AS total_client_billed,
       COALESCE(received.total_received, 0)      AS total_client_received,
       COALESCE(billed.total_billed, 0) - COALESCE(received.total_received, 0) AS pending_client_receivable,
       COALESCE(cost.total_estimated, 0)          AS total_estimated_cost,
       COALESCE(cost.total_budgeted, 0)           AS total_budgeted_cost,
       COALESCE(po.total_po_value, 0)              AS total_po_value,
       COALESCE(vinv.total_vendor_invoice, 0)       AS total_vendor_invoice_value,
       COALESCE(vpay.total_vendor_paid, 0)           AS total_vendor_payment,
       COALESCE(vinv.total_vendor_invoice, 0) - COALESCE(vpay.total_vendor_paid, 0) AS pending_vendor_payable,
       COALESCE(exp.total_expense, 0)                 AS total_project_expense,
       (p.contract_value - COALESCE(cost.total_estimated, 0))        AS expected_profit,
       (COALESCE(billed.total_billed, 0) - COALESCE(exp.total_expense, 0)) AS actual_profit,
       CASE WHEN COALESCE(billed.total_billed, 0) = 0 THEN NULL
            ELSE round(((COALESCE(billed.total_billed, 0) - COALESCE(exp.total_expense, 0))
                  / billed.total_billed) * 100, 2) END           AS profit_margin_pct,
       (COALESCE(cost.total_budgeted, 0) - COALESCE(exp.total_expense, 0))  AS budget_variance,
       (COALESCE(cost.total_estimated, 0) - COALESCE(exp.total_expense, 0)) AS cost_variance
FROM clm_project p
LEFT JOIN (SELECT project_id, SUM(net_amount) total_billed FROM clm_client_invoice WHERE deleted_at IS NULL GROUP BY project_id) billed
  ON billed.project_id = p.project_id
LEFT JOIN (SELECT ci.project_id, SUM(pa.allocated_amount) total_received
           FROM clm_client_invoice ci JOIN clm_payment_allocation pa ON pa.invoice_id = ci.invoice_id
           GROUP BY ci.project_id) received ON received.project_id = p.project_id
LEFT JOIN (SELECT project_id, SUM(estimated_cost) total_estimated, SUM(budgeted_cost) total_budgeted
           FROM clm_project_cost GROUP BY project_id) cost ON cost.project_id = p.project_id
LEFT JOIN (SELECT project_id, SUM(total_amount) total_po_value FROM vnd_purchase_order
           WHERE deleted_at IS NULL GROUP BY project_id) po ON po.project_id = p.project_id
LEFT JOIN (SELECT project_id, SUM(total_amount) total_vendor_invoice FROM vnd_vendor_invoice
           WHERE deleted_at IS NULL GROUP BY project_id) vinv ON vinv.project_id = p.project_id
LEFT JOIN (SELECT vi.project_id, SUM(pa.allocated_amount) total_vendor_paid
           FROM vnd_vendor_invoice vi JOIN vnd_vendor_payment_allocation pa ON pa.vendor_invoice_id = vi.vendor_invoice_id
           GROUP BY vi.project_id) vpay ON vpay.project_id = p.project_id
LEFT JOIN (SELECT project_id, SUM(amount) total_expense FROM clm_project_expense GROUP BY project_id) exp
  ON exp.project_id = p.project_id;
```

---

## PHASE 7 — NORMALIZATION REVIEW

**1NF:** every table has a single-valued PK, no repeating groups; multi-value data (contacts, bank accounts, cost categories, ratings) is split into child tables rather than comma-joined columns. Checked and passed for all 13 new tables.

**2NF:** every non-key column depends on the *whole* PK, not part of it. The only composite-feeling table is `clm_project_cost` (PK is `project_cost_id`, but the natural key is `(project_id, cost_category)`, enforced via UNIQUE, not used as PK — deliberate: a surrogate UUID PK keeps FKs from child tables simple and stable even if a category were ever renamed). No partial dependencies found.

**3NF:** no non-key column depends on another non-key column.
- `vnd_purchase_order.total_amount` *looks* like it could be a 3NF violation (it depends on the item rows, not just the PO's own PK) — this is the one deliberate, documented exception (Phase 6.11), trigger-maintained for the printable-PO reason given there, not left to accidental drift.
- `vnd_vendor_invoice.total_amount` is a same-row `GENERATED` column (`subtotal + tax`, both on the same row) — this is 3NF-safe by definition; PostgreSQL generated columns from same-row inputs don't create a transitive dependency on another table.
- `clm_project_expense.payment_status` is the one deliberately denormalized display column in the whole doc — flagged explicitly in 6.3, not accidental.

Everything else (`v_project_financial_summary`, `v_vendor_performance`, `v_project_cost_summary`, etc.) is a **view**, which by definition doesn't need to satisfy normal forms — it's not stored data, it's a query.

---

## PHASE 8 — PRIMARY KEYS, FOREIGN KEYS, CONSTRAINTS (SQL DDL)

```sql
-- ============================================================
-- SAV ERP — SITES: Client Management extension + Vendor Management & Procurement
-- External dependencies (NOT created here):
--   companies, branches, users, employees, currencies, taxes,
--   clm_client, clm_client_requirement, clm_client_invoice, clm_client_invoice_line,
--   clm_payment, clm_payment_allocation                (Client Management module)
--   com_po, com_boq                                    (Commercial Lifecycle module — subcontract PO)
--   com_documents, com_approvals, com_audit_log         (Commercial Lifecycle module — reused engines)
-- ============================================================

-- ---------- ENUM TYPES ----------
CREATE TYPE clm_project_status AS ENUM
  ('Planning','Estimation','Approved','In Progress','On Hold','Completed','Cancelled');

CREATE TYPE clm_cost_category AS ENUM
  ('Material','Labour','Equipment','Transportation','Subcontractor','Overhead','Contingency','Other');

CREATE TYPE clm_expense_payment_status AS ENUM ('Unpaid','Partially Paid','Paid');
CREATE TYPE clm_approval_status_simple AS ENUM ('Pending','Approved','Rejected');

CREATE TYPE vnd_vendor_status AS ENUM ('Active','Inactive','Blacklisted','Under Review');

CREATE TYPE vnd_po_status AS ENUM
  ('Draft','Pending Approval','Approved','Sent to Vendor','Partially Received','Received','Closed','Cancelled');
CREATE TYPE vnd_approval_status AS ENUM ('Not Required','Pending','Manager Approved','Finance Approved','Rejected');

CREATE TYPE vnd_invoice_status AS ENUM
  ('Draft','Submitted','Verified','Approved','Partially Paid','Paid','Disputed','Cancelled');

CREATE TYPE vnd_payment_method AS ENUM ('Bank Transfer','Cheque','UPI','Cash','Other');
CREATE TYPE vnd_payment_status AS ENUM ('Pending','Processed','Failed','Reversed');

-- ---------- PROJECT ----------
CREATE TABLE clm_project (
  project_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code               VARCHAR(30) NOT NULL UNIQUE,
  project_name                 VARCHAR(200) NOT NULL,
  client_id                      UUID NOT NULL REFERENCES clm_client(client_id) ON DELETE RESTRICT,
  requirement_id                   UUID REFERENCES clm_client_requirement(requirement_id),
  site_location                      VARCHAR(255) NOT NULL,
  description                         TEXT,
  start_date                            DATE,
  expected_completion_date                DATE,
  actual_completion_date                    DATE,
  contract_value                              NUMERIC(18,2) NOT NULL CHECK (contract_value >= 0),
  project_manager_id                            UUID REFERENCES employees(id),
  project_status                                  clm_project_status NOT NULL DEFAULT 'Planning',
  progress_percentage                               NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (progress_percentage BETWEEN 0 AND 100),
  remarks                                             TEXT,
  company_id                                            UUID NOT NULL REFERENCES companies(id),
  branch_id                                               UUID REFERENCES branches(id),
  created_at                                                TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                                  UUID NOT NULL REFERENCES users(id),
  updated_at                                                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                      UUID REFERENCES users(id),
  deleted_at                                                        TIMESTAMPTZ,
  deleted_by                                                          UUID REFERENCES users(id)
);
CREATE INDEX idx_clmproject_client ON clm_project(client_id);
CREATE INDEX idx_clmproject_status ON clm_project(project_status);
CREATE INDEX idx_clmproject_name ON clm_project(project_name);

-- ---------- PROJECT COST PLAN ----------
CREATE TABLE clm_project_cost (
  project_cost_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES clm_project(project_id) ON DELETE RESTRICT,
  cost_category        clm_cost_category NOT NULL,
  estimated_cost         NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  budgeted_cost            NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (budgeted_cost >= 0),
  remarks                    TEXT,
  company_id                   UUID NOT NULL REFERENCES companies(id),
  branch_id                      UUID REFERENCES branches(id),
  created_at                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                         UUID NOT NULL REFERENCES users(id),
  updated_at                           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                             UUID REFERENCES users(id),
  UNIQUE (project_id, cost_category)
);
CREATE INDEX idx_clmprojectcost_project ON clm_project_cost(project_id);

-- ---------- VENDOR LOOKUPS ----------
CREATE TABLE vnd_vendor_type (
  vendor_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name      VARCHAR(100) NOT NULL UNIQUE,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE vnd_material_category (
  material_category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name         VARCHAR(100) NOT NULL UNIQUE,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            UUID NOT NULL REFERENCES users(id)
);

-- ---------- VENDOR MASTER ----------
CREATE TABLE vnd_vendor (
  vendor_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_code                    VARCHAR(30) NOT NULL UNIQUE,
  vendor_name                      VARCHAR(200) NOT NULL,
  vendor_type_id                     UUID NOT NULL REFERENCES vnd_vendor_type(vendor_type_id),
  company_type                         VARCHAR(50),
  registration_date                      DATE,
  address_line1                            VARCHAR(255) NOT NULL,
  address_line2                              VARCHAR(255),
  city                                         VARCHAR(100) NOT NULL,
  state                                          VARCHAR(100) NOT NULL,
  country                                          VARCHAR(100) NOT NULL DEFAULT 'India',
  pincode                                            VARCHAR(12) NOT NULL,
  website                                              VARCHAR(200),
  gst_number                                             VARCHAR(15),
  pan_number                                               VARCHAR(10),
  gst_registration_type                                      VARCHAR(50),
  msme_status                                                  BOOLEAN NOT NULL DEFAULT false,
  msme_number                                                    VARCHAR(30),
  company_registration_number                                      VARCHAR(50),
  tds_applicable                                                     BOOLEAN NOT NULL DEFAULT true,
  tds_category                                                         VARCHAR(50),
  vendor_status                                                          vnd_vendor_status NOT NULL DEFAULT 'Active',
  notes                                                                     TEXT,
  company_id                                                                 UUID NOT NULL REFERENCES companies(id),
  branch_id                                                                    UUID REFERENCES branches(id),
  created_at                                                                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                                                       UUID NOT NULL REFERENCES users(id),
  updated_at                                                                         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                                           UUID REFERENCES users(id),
  deleted_at                                                                             TIMESTAMPTZ,
  deleted_by                                                                               UUID REFERENCES users(id)
);
CREATE UNIQUE INDEX uq_vnd_vendor_gst ON vnd_vendor(gst_number) WHERE gst_number IS NOT NULL;
CREATE INDEX idx_vnd_vendor_status ON vnd_vendor(vendor_status);
CREATE INDEX idx_vnd_vendor_name ON vnd_vendor(vendor_name);
CREATE INDEX idx_vnd_vendor_type ON vnd_vendor(vendor_type_id);

-- ---------- VENDOR CONTACTS ----------
CREATE TABLE vnd_vendor_contact (
  vendor_contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  contact_name          VARCHAR(150) NOT NULL,
  designation             VARCHAR(100),
  contact_role             VARCHAR(50) NOT NULL DEFAULT 'General',
  mobile_number              VARCHAR(20) NOT NULL,
  alternate_number             VARCHAR(20),
  email                          VARCHAR(150),
  is_primary_contact               BOOLEAN NOT NULL DEFAULT false,
  is_active                          BOOLEAN NOT NULL DEFAULT true,
  company_id                          UUID NOT NULL REFERENCES companies(id),
  branch_id                             UUID REFERENCES branches(id),
  created_at                              TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                UUID NOT NULL REFERENCES users(id),
  updated_at                                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                    UUID REFERENCES users(id),
  deleted_at                                      TIMESTAMPTZ,
  deleted_by                                        UUID REFERENCES users(id)
);
CREATE INDEX idx_vnd_contact_vendor ON vnd_vendor_contact(vendor_id);
CREATE UNIQUE INDEX uq_vnd_contact_primary ON vnd_vendor_contact(vendor_id)
  WHERE is_primary_contact = true AND deleted_at IS NULL;

-- ---------- VENDOR BANK ACCOUNTS (sensitive) ----------
CREATE TABLE vnd_vendor_bank_account (
  bank_account_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  account_holder_name     VARCHAR(150) NOT NULL,
  bank_name                 VARCHAR(150) NOT NULL,
  account_number              VARCHAR(30) NOT NULL,
  ifsc_code                     VARCHAR(11) NOT NULL,
  branch                          VARCHAR(150),
  account_type                     VARCHAR(20),
  upi_id                              VARCHAR(100),
  is_primary                           BOOLEAN NOT NULL DEFAULT true,
  is_verified                            BOOLEAN NOT NULL DEFAULT false,
  verified_at                              TIMESTAMPTZ,
  verified_by                                UUID REFERENCES users(id),
  company_id                                   UUID NOT NULL REFERENCES companies(id),
  branch_id                                      UUID REFERENCES branches(id),
  created_at                                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                         UUID NOT NULL REFERENCES users(id),
  updated_at                                           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                             UUID REFERENCES users(id),
  deleted_at                                               TIMESTAMPTZ,
  deleted_by                                                 UUID REFERENCES users(id)
);
CREATE INDEX idx_vnd_bank_vendor ON vnd_vendor_bank_account(vendor_id);
CREATE UNIQUE INDEX uq_vnd_bank_primary ON vnd_vendor_bank_account(vendor_id)
  WHERE is_primary = true AND deleted_at IS NULL;

-- ---------- MATERIALS / SERVICES CATALOG ----------
CREATE TABLE vnd_material_service (
  material_service_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id               UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  material_category_id      UUID REFERENCES vnd_material_category(material_category_id),
  item_name                   VARCHAR(200) NOT NULL,
  description                   TEXT,
  unit                            VARCHAR(20) NOT NULL,
  standard_rate                     NUMERIC(18,4) CHECK (standard_rate IS NULL OR standard_rate >= 0),
  tax_rate                             NUMERIC(5,2) NOT NULL DEFAULT 0,
  minimum_order_quantity                 NUMERIC(18,3) CHECK (minimum_order_quantity IS NULL OR minimum_order_quantity >= 0),
  delivery_time_days                       INTEGER,
  is_active                                  BOOLEAN NOT NULL DEFAULT true,
  company_id                                   UUID NOT NULL REFERENCES companies(id),
  branch_id                                      UUID REFERENCES branches(id),
  created_at                                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                         UUID NOT NULL REFERENCES users(id),
  updated_at                                           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                             UUID REFERENCES users(id)
);
CREATE INDEX idx_vnd_matsvc_vendor ON vnd_material_service(vendor_id);
CREATE INDEX idx_vnd_matsvc_name ON vnd_material_service(item_name);

-- ---------- PURCHASE ORDER (procurement) ----------
CREATE TABLE vnd_purchase_order (
  po_id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number                 VARCHAR(50) NOT NULL UNIQUE,
  project_id                  UUID NOT NULL REFERENCES clm_project(project_id) ON DELETE RESTRICT,
  vendor_id                     UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  po_date                          DATE NOT NULL,
  expected_delivery_date             DATE,
  delivery_location                    VARCHAR(255),
  payment_terms                          TEXT,
  subtotal_amount                          NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0),
  discount_amount                            NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount                                   NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount                                   NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status                                           vnd_po_status NOT NULL DEFAULT 'Draft',
  approval_status                                    vnd_approval_status NOT NULL DEFAULT 'Not Required',
  remarks                                              TEXT,
  company_id                                             UUID NOT NULL REFERENCES companies(id),
  branch_id                                                UUID REFERENCES branches(id),
  created_at                                                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                                   UUID NOT NULL REFERENCES users(id),
  updated_at                                                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                       UUID REFERENCES users(id),
  deleted_at                                                         TIMESTAMPTZ,
  deleted_by                                                           UUID REFERENCES users(id)
);
CREATE INDEX idx_vnd_po_project ON vnd_purchase_order(project_id);
CREATE INDEX idx_vnd_po_vendor ON vnd_purchase_order(vendor_id);
CREATE INDEX idx_vnd_po_status ON vnd_purchase_order(status);

-- ---------- PURCHASE ORDER ITEMS ----------
CREATE TABLE vnd_purchase_order_item (
  po_item_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id                    UUID NOT NULL REFERENCES vnd_purchase_order(po_id) ON DELETE RESTRICT,
  material_service_id        UUID REFERENCES vnd_material_service(material_service_id),
  item_name                     VARCHAR(200) NOT NULL,
  description                     TEXT,
  quantity                          NUMERIC(18,3) NOT NULL CHECK (quantity > 0),
  unit                                VARCHAR(20) NOT NULL,
  unit_price                           NUMERIC(18,4) NOT NULL CHECK (unit_price >= 0),
  discount_amount                        NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_percentage                           NUMERIC(5,2) NOT NULL DEFAULT 0,
  line_amount                                NUMERIC(18,2) GENERATED ALWAYS AS
    (quantity * unit_price - discount_amount) STORED,
  received_quantity                            NUMERIC(18,3) NOT NULL DEFAULT 0,
  sequence_no                                    INTEGER NOT NULL,
  remarks                                          TEXT,
  company_id                                         UUID NOT NULL REFERENCES companies(id),
  branch_id                                            UUID REFERENCES branches(id),
  created_at                                             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                               UUID NOT NULL REFERENCES users(id),
  updated_at                                                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                   UUID REFERENCES users(id),
  CHECK (received_quantity >= 0 AND received_quantity <= quantity)
);
CREATE INDEX idx_vnd_poitem_po ON vnd_purchase_order_item(po_id);
CREATE INDEX idx_vnd_poitem_matsvc ON vnd_purchase_order_item(material_service_id);

-- Keep PO header totals in sync with item rows (documented exception, see §6.11)
CREATE OR REPLACE FUNCTION vnd_fn_recalc_po_totals() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE v_po_id UUID := COALESCE(NEW.po_id, OLD.po_id);
BEGIN
  UPDATE vnd_purchase_order po SET
    subtotal_amount = COALESCE((SELECT SUM(quantity * unit_price) FROM vnd_purchase_order_item WHERE po_id = v_po_id), 0),
    discount_amount = COALESCE((SELECT SUM(discount_amount) FROM vnd_purchase_order_item WHERE po_id = v_po_id), 0),
    tax_amount      = COALESCE((SELECT SUM(line_amount * tax_percentage / 100) FROM vnd_purchase_order_item WHERE po_id = v_po_id), 0),
    updated_at = now()
  WHERE po.po_id = v_po_id;
  UPDATE vnd_purchase_order SET total_amount = subtotal_amount - discount_amount + tax_amount WHERE po_id = v_po_id;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_vnd_po_totals
AFTER INSERT OR UPDATE OR DELETE ON vnd_purchase_order_item
FOR EACH ROW EXECUTE FUNCTION vnd_fn_recalc_po_totals();

-- ---------- VENDOR INVOICE ----------
CREATE TABLE vnd_vendor_invoice (
  vendor_invoice_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number          VARCHAR(50) NOT NULL,
  vendor_id                 UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  purchase_order_id           UUID REFERENCES vnd_purchase_order(po_id),
  project_id                    UUID NOT NULL REFERENCES clm_project(project_id),
  invoice_date                    DATE NOT NULL,
  due_date                          DATE,
  subtotal_amount                     NUMERIC(18,2) NOT NULL CHECK (subtotal_amount >= 0),
  tax_amount                            NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount                            NUMERIC(18,2) GENERATED ALWAYS AS (subtotal_amount + tax_amount) STORED,
  status                                    vnd_invoice_status NOT NULL DEFAULT 'Draft',
  verified_by                                 UUID REFERENCES users(id),
  verified_at                                    TIMESTAMPTZ,
  remarks                                          TEXT,
  company_id                                         UUID NOT NULL REFERENCES companies(id),
  branch_id                                            UUID REFERENCES branches(id),
  created_at                                             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                               UUID NOT NULL REFERENCES users(id),
  updated_at                                                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                   UUID REFERENCES users(id),
  deleted_at                                                     TIMESTAMPTZ,
  deleted_by                                                       UUID REFERENCES users(id),
  UNIQUE (vendor_id, invoice_number)
);
CREATE INDEX idx_vnd_vinv_vendor ON vnd_vendor_invoice(vendor_id);
CREATE INDEX idx_vnd_vinv_po ON vnd_vendor_invoice(purchase_order_id);
CREATE INDEX idx_vnd_vinv_project ON vnd_vendor_invoice(project_id);
CREATE INDEX idx_vnd_vinv_status ON vnd_vendor_invoice(status);

-- ---------- VENDOR INVOICE ITEMS ----------
CREATE TABLE vnd_vendor_invoice_item (
  vendor_invoice_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_invoice_id         UUID NOT NULL REFERENCES vnd_vendor_invoice(vendor_invoice_id) ON DELETE RESTRICT,
  po_item_id                   UUID REFERENCES vnd_purchase_order_item(po_item_id),
  description                     TEXT NOT NULL,
  quantity                          NUMERIC(18,3) NOT NULL CHECK (quantity > 0),
  unit                                VARCHAR(20),
  rate                                  NUMERIC(18,4) NOT NULL CHECK (rate >= 0),
  line_amount                            NUMERIC(18,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  sequence_no                              INTEGER NOT NULL
);
CREATE INDEX idx_vnd_vinvitem_invoice ON vnd_vendor_invoice_item(vendor_invoice_id);
CREATE INDEX idx_vnd_vinvitem_poitem ON vnd_vendor_invoice_item(po_item_id);

-- ---------- VENDOR PAYMENT ----------
CREATE TABLE vnd_vendor_payment (
  vendor_payment_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference_number  VARCHAR(100) NOT NULL UNIQUE,
  vendor_id                    UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  project_id                     UUID REFERENCES clm_project(project_id),
  bank_account_id                  UUID REFERENCES vnd_vendor_bank_account(bank_account_id),
  payment_date                       DATE NOT NULL,
  amount                                NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  payment_method                          vnd_payment_method NOT NULL,
  transaction_reference                     VARCHAR(100),
  payment_status                              vnd_payment_status NOT NULL DEFAULT 'Pending',
  remarks                                       TEXT,
  approved_by                                     UUID REFERENCES users(id),
  company_id                                        UUID NOT NULL REFERENCES companies(id),
  branch_id                                           UUID REFERENCES branches(id),
  created_at                                            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                              UUID NOT NULL REFERENCES users(id),
  updated_at                                                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                  UUID REFERENCES users(id)
);
CREATE INDEX idx_vnd_vpay_vendor ON vnd_vendor_payment(vendor_id);
CREATE INDEX idx_vnd_vpay_date ON vnd_vendor_payment(payment_date);
CREATE INDEX idx_vnd_vpay_status ON vnd_vendor_payment(payment_status);

-- ---------- VENDOR PAYMENT ALLOCATION ----------
CREATE TABLE vnd_vendor_payment_allocation (
  allocation_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_payment_id     UUID NOT NULL REFERENCES vnd_vendor_payment(vendor_payment_id) ON DELETE RESTRICT,
  vendor_invoice_id        UUID NOT NULL REFERENCES vnd_vendor_invoice(vendor_invoice_id) ON DELETE RESTRICT,
  allocated_amount           NUMERIC(18,2) NOT NULL CHECK (allocated_amount > 0),
  allocated_date                DATE NOT NULL,
  company_id                      UUID NOT NULL REFERENCES companies(id),
  branch_id                         UUID REFERENCES branches(id),
  created_at                          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                            UUID NOT NULL REFERENCES users(id),
  UNIQUE (vendor_payment_id, vendor_invoice_id)
);
CREATE INDEX idx_vnd_alloc_payment ON vnd_vendor_payment_allocation(vendor_payment_id);
CREATE INDEX idx_vnd_alloc_invoice ON vnd_vendor_payment_allocation(vendor_invoice_id);

CREATE OR REPLACE FUNCTION vnd_fn_check_allocation() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE v_payment_total NUMERIC(18,2); v_payment_amount NUMERIC(18,2);
        v_invoice_total NUMERIC(18,2); v_invoice_amount NUMERIC(18,2);
BEGIN
  SELECT COALESCE(SUM(allocated_amount),0) INTO v_payment_total FROM vnd_vendor_payment_allocation WHERE vendor_payment_id = NEW.vendor_payment_id;
  SELECT amount INTO v_payment_amount FROM vnd_vendor_payment WHERE vendor_payment_id = NEW.vendor_payment_id;
  IF v_payment_total > v_payment_amount THEN
    RAISE EXCEPTION 'Allocated amount exceeds vendor payment amount for %', NEW.vendor_payment_id;
  END IF;
  SELECT COALESCE(SUM(allocated_amount),0) INTO v_invoice_total FROM vnd_vendor_payment_allocation WHERE vendor_invoice_id = NEW.vendor_invoice_id;
  SELECT total_amount INTO v_invoice_amount FROM vnd_vendor_invoice WHERE vendor_invoice_id = NEW.vendor_invoice_id;
  IF v_invoice_total > v_invoice_amount THEN
    RAISE EXCEPTION 'Allocated amount exceeds vendor invoice amount for %', NEW.vendor_invoice_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_vnd_check_allocation
AFTER INSERT ON vnd_vendor_payment_allocation
FOR EACH ROW EXECUTE FUNCTION vnd_fn_check_allocation();

-- ---------- VENDOR RATING ----------
CREATE TABLE vnd_vendor_rating (
  rating_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id           UUID NOT NULL REFERENCES vnd_vendor(vendor_id) ON DELETE RESTRICT,
  purchase_order_id      UUID REFERENCES vnd_purchase_order(po_id),
  quality_rating            SMALLINT NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
  delivery_rating             SMALLINT NOT NULL CHECK (delivery_rating BETWEEN 1 AND 5),
  price_rating                  SMALLINT NOT NULL CHECK (price_rating BETWEEN 1 AND 5),
  rated_by                        UUID NOT NULL REFERENCES users(id),
  rated_at                          TIMESTAMPTZ NOT NULL DEFAULT now(),
  remarks                             TEXT,
  created_at                            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                              UUID NOT NULL REFERENCES users(id)
);
CREATE INDEX idx_vnd_rating_vendor ON vnd_vendor_rating(vendor_id);

-- ---------- PROJECT EXPENSE ----------
CREATE TABLE clm_project_expense (
  expense_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             UUID NOT NULL REFERENCES clm_project(project_id) ON DELETE RESTRICT,
  expense_category         clm_cost_category NOT NULL,
  vendor_id                   UUID REFERENCES vnd_vendor(vendor_id),
  purchase_order_id             UUID REFERENCES vnd_purchase_order(po_id),
  subcontract_po_id                UUID REFERENCES com_po(po_id),
  vendor_invoice_id                   UUID REFERENCES vnd_vendor_invoice(vendor_invoice_id),
  description                           TEXT NOT NULL,
  amount                                  NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  expense_date                              DATE NOT NULL,
  payment_status                              clm_expense_payment_status NOT NULL DEFAULT 'Unpaid',
  approval_status                               clm_approval_status_simple NOT NULL DEFAULT 'Pending',
  remarks                                         TEXT,
  company_id                                        UUID NOT NULL REFERENCES companies(id),
  branch_id                                           UUID REFERENCES branches(id),
  created_at                                            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                              UUID NOT NULL REFERENCES users(id),
  updated_at                                                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                  UUID REFERENCES users(id),
  deleted_at                                                    TIMESTAMPTZ,
  deleted_by                                                      UUID REFERENCES users(id),
  CHECK (vendor_id IS NOT NULL OR purchase_order_id IS NOT NULL
         OR subcontract_po_id IS NOT NULL OR expense_category = 'Other')
);
CREATE INDEX idx_clmexpense_project ON clm_project_expense(project_id);
CREATE INDEX idx_clmexpense_vendor ON clm_project_expense(vendor_id);
CREATE INDEX idx_clmexpense_po ON clm_project_expense(purchase_order_id);
CREATE INDEX idx_clmexpense_category ON clm_project_expense(expense_category);
CREATE INDEX idx_clmexpense_date ON clm_project_expense(expense_date);

-- ---------- RBAC ----------
CREATE TABLE sec_role (
  role_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name    VARCHAR(100) NOT NULL UNIQUE,
  description   TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE sec_permission (
  permission_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_code VARCHAR(100) NOT NULL UNIQUE,   -- e.g. 'vnd_purchase_order.approve'
  module           VARCHAR(50) NOT NULL,           -- e.g. 'Vendors', 'ClientManagement'
  description        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by              UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE sec_role_permission (
  role_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id               UUID NOT NULL REFERENCES sec_role(role_id) ON DELETE RESTRICT,
  permission_id           UUID NOT NULL REFERENCES sec_permission(permission_id) ON DELETE RESTRICT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                  UUID NOT NULL REFERENCES users(id),
  UNIQUE (role_id, permission_id)
);

CREATE TABLE sec_user_role (
  user_role_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role_id           UUID NOT NULL REFERENCES sec_role(role_id) ON DELETE RESTRICT,
  assigned_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by           UUID NOT NULL REFERENCES users(id),
  UNIQUE (user_id, role_id)
);
CREATE INDEX idx_sec_userrole_user ON sec_user_role(user_id);
CREATE INDEX idx_sec_rolepermission_role ON sec_role_permission(role_id);

-- ---------- EXTEND EXISTING POLYMORPHIC ENUMS (Commercial Lifecycle module) ----------
-- ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'Project';
-- ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'Vendor';
-- ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'VendorContact';
-- ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'ProcurementPO';
-- ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'VendorInvoice';
-- ALTER TYPE com_document_entity_type ADD VALUE IF NOT EXISTS 'VendorPayment';
-- ALTER TYPE com_approval_entity_type ADD VALUE IF NOT EXISTS 'ProcurementPO';
-- ALTER TYPE com_approval_entity_type ADD VALUE IF NOT EXISTS 'VendorInvoice';
-- ALTER TYPE com_approval_entity_type ADD VALUE IF NOT EXISTS 'VendorPayment';
```

---

## PHASE 9 — INDEX STRATEGY

| Index | Why |
|---|---|
| `clm_project(project_code)` UNIQUE | Fast lookup/validation |
| `clm_project(client_id)`, `(project_status)`, `(project_name)` | Client drill-down, status worklists, search |
| `clm_project_cost(project_id, cost_category)` UNIQUE | Enforces one row per category, fast budget-vs-actual join |
| `vnd_vendor(vendor_code)` UNIQUE, `(gst_number)` partial UNIQUE | Duplicate-code/GST validation |
| `vnd_vendor(vendor_status)`, `(vendor_name)`, `(vendor_type_id)` | Worklists and search/autocomplete |
| `vnd_vendor_contact(vendor_id)` + partial UNIQUE primary-contact | 360° vendor profile, one-primary rule |
| `vnd_vendor_bank_account(vendor_id)` + partial UNIQUE primary-account | Payment routing lookups, one-primary rule |
| `vnd_material_service(vendor_id)`, `(item_name)` | Catalog browsing, PO item autocomplete |
| `vnd_purchase_order(project_id)`, `(vendor_id)`, `(status)` | Project drill-down, vendor drill-down, status worklists |
| `vnd_purchase_order_item(po_id)`, `(material_service_id)` | Line item joins, catalog usage lookups |
| `vnd_vendor_invoice(vendor_id)`, `(purchase_order_id)`, `(project_id)`, `(status)` | 360° vendor tab, PO reconciliation, project cost rollup |
| `vnd_vendor_invoice_item(vendor_invoice_id)`, `(po_item_id)` | Invoice-to-PO-item reconciliation |
| `vnd_vendor_payment(vendor_id)`, `(payment_date)`, `(payment_status)` | Payment history, verification worklists |
| `vnd_vendor_payment_allocation(vendor_payment_id)`, `(vendor_invoice_id)` | Both directions of the M:N join — used on every outstanding-balance calculation |
| `vnd_vendor_rating(vendor_id)` | Performance view aggregation |
| `clm_project_expense(project_id)`, `(vendor_id)`, `(purchase_order_id)`, `(expense_category)`, `(expense_date)` | Cost rollup by project/category, vendor traceability, date-range reports |
| `sec_user_role(user_id)`, `sec_role_permission(role_id)` | Permission-check hot path — evaluated on every authorized request |
| All FK columns | Join performance |

---

## PHASE 10 — FINANCIAL BUSINESS RULES: STORED vs. CALCULATED

| Value | Storage | Formula |
|---|---|---|
| Contract Value | **Stored** (`clm_project.contract_value`) | Negotiated input, not derivable |
| Estimated / Budgeted Cost per category | **Stored** (`clm_project_cost`) | Planning input |
| Actual Cost per category | **Calculated** | `SUM(clm_project_expense.amount)` grouped by category — `v_project_cost_summary` |
| Budget Variance | **Calculated** | `budgeted_cost − actual_cost` |
| Cost Variance | **Calculated** | `estimated_cost − actual_cost` |
| PO line amount | **Stored, generated (same row)** | `quantity × unit_price − discount` |
| PO header subtotal/tax/total | **Stored, trigger-maintained** | Sum of item rows (documented exception, §6.11) |
| Vendor Invoice total | **Stored, generated (same row)** | `subtotal + tax` |
| Vendor Invoice paid/balance | **Calculated** | `SUM(allocation)` / `total − paid` — `v_vendor_invoice_summary` |
| Client Invoice paid/balance | **Calculated** (existing doc) | Same pattern, `v_client_billing_summary` |
| Total PO Value (per project) | **Calculated** | `SUM(vnd_purchase_order.total_amount)` |
| Total Vendor Invoice Value | **Calculated** | `SUM(vnd_vendor_invoice.total_amount)` |
| Total Vendor Payment | **Calculated** | `SUM(vnd_vendor_payment_allocation.allocated_amount)` |
| Pending Vendor Payable | **Calculated** | `total_vendor_invoice_value − total_vendor_payment` |
| Total Client Billing / Payments / Pending Receivable | **Calculated** (existing doc's views, joined here per-project) | |
| Expected Profit | **Calculated** | `contract_value − total_estimated_cost` |
| Actual Profit | **Calculated** | `total_client_billed − total_project_expense` |
| Profit Margin % | **Calculated**, zero-guarded | `actual_profit / total_client_billed × 100` |
| Vendor `overall_rating` / `on_time_delivery_percentage` / PO counters | **Calculated** | `v_vendor_performance`, `v_vendor_po_summary` |

**Rule applied uniformly:** anything that can be reconstructed from other stored rows is a view. The only stored "roll-up-looking" columns are same-row `GENERATED` columns and the one documented `vnd_purchase_order` header-total exception — everything else is `SUM`/`AVG`/`COUNT` in `v_project_financial_summary`, `v_project_cost_summary`, `v_vendor_performance`, `v_vendor_po_summary`, `v_vendor_invoice_summary`, `v_vendor_financial_summary` (all defined in Phase 6).

---

## PHASE 11 — AUDIT TRAIL DESIGN

No new audit table is created. Every write to any table in this document (`clm_project*`, `vnd_*`, `sec_*`) inserts a corresponding row into the existing `com_audit_log` (Commercial Lifecycle module) — `entity_type` set to the table name, `entity_id` to the row's PK, `old_value`/`new_value` as JSONB diffs, `action` from the existing `com_audit_action` ENUM (`Insert`/`Update`/`Delete`/`StatusChange`), extended with `Approve`/`Reject`/`Submit`/`Cancel`/`Payment`/`Upload`/`Download` per your request:

```sql
ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Approve';
ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Reject';
ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Submit';
ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Cancel';
ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Payment';
ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Upload';
ALTER TYPE com_audit_action ADD VALUE IF NOT EXISTS 'Download';
```

Implementation stays application-layer (a shared backend interceptor writing `com_audit_log` inside the same transaction as the business write), matching the existing modules' stated approach rather than a per-table Postgres trigger — this keeps `user_id` (from the request's auth context) available, which a pure DB trigger cannot see without extra plumbing.

---

## PHASE 12 — DOCUMENT MANAGEMENT & VERSION CONTROL

No new document table. `com_documents` is extended with the `entity_type` values listed at the end of Phase 8 (`Project`, `Vendor`, `VendorContact`, `ProcurementPO`, `VendorInvoice`, `VendorPayment`). Same mechanics as already specified in the Commercial Lifecycle doc: polymorphic `(entity_type, entity_id)`, Supabase Storage-backed, `version_no` + `previous_version_id` linked-list versioning, private buckets + signed URLs, status `Active`/`Superseded`/`Archived`, originals never deleted.

**Vendor documents specifically** (GST Certificate, PAN, MSME Certificate, Company Registration, Bank Proof, Agreement, License, Quality Certificate, Other): stored as `com_documents` rows with `entity_type = 'Vendor'`, `document_category_id` pointing at the existing `com_document_category` lookup (seed it with these 8 categories). The `expiry_date` you asked for is already a column-shaped gap in `com_documents` — **add it**:

```sql
ALTER TABLE com_documents ADD COLUMN expiry_date DATE;
ALTER TABLE com_documents ADD COLUMN verification_status VARCHAR(20) NOT NULL DEFAULT 'Pending';
CREATE INDEX idx_com_documents_expiry ON com_documents(expiry_date) WHERE expiry_date IS NOT NULL;
```
*(This is the one small, additive change requested against an existing table — no data loss, purely additive columns with safe defaults.)*

---

## PHASE 13 — APPROVAL WORKFLOW

Reuses `com_approvals` (polymorphic, reusable, already supports multi-stage chains via free-text `approval_stage`). New `entity_type` values added (Phase 8). Concrete stage sequences for this module's two gated documents:

**Procurement PO** — mirrors your example exactly:
```
Draft → Submitted → Manager Approval → Finance Approval → Approved → Sent to Vendor
```
Each arrow after "Submitted" corresponds to one `com_approvals` row: `entity_type='ProcurementPO'`, `approval_stage='Manager'` then `approval_stage='Finance'`. `vnd_purchase_order.approval_status` is a denormalized display column (`Pending`/`Manager Approved`/`Finance Approved`/`Rejected`) updated by application logic whenever the corresponding `com_approvals` row is written — the `com_approvals` rows remain the source of truth for who-approved-what-when.

**Vendor Invoice**:
```
Draft → Submitted → Verified → Approved → Paid
```
"Verified" is captured directly on `vnd_vendor_invoice.verified_by`/`verified_at` (a single, mandatory checkpoint before any approval stage, per your explicit "required invoice verification" validation) — modeled as columns rather than a `com_approvals` row because it's a single fixed checkpoint, not a configurable multi-level chain. "Approved" then goes through `com_approvals` (`entity_type='VendorInvoice'`) exactly like the PO. "Paid" is reached once `v_vendor_invoice_summary.balance_amount = 0`.

The design allows additional approval levels in the future purely by inserting more `com_approvals` rows with new `approval_stage` values — no schema change needed.

---

## PHASE 14 — ROLE-BASED ACCESS CONTROL

`sec_role`, `sec_permission`, `sec_role_permission`, `sec_user_role` (DDL in Phase 8) implement classic RBAC: permissions are never hard-coded into business tables or application `if` statements against a role name — every authorization check is `user → sec_user_role → sec_role → sec_role_permission → sec_permission`, so adding a new role or regrouping permissions never requires a code change.

Seed roles (from your list) and representative permissions for this module:

| Role | Representative permissions (this module) |
|---|---|
| Super Admin | `*` (all) |
| Admin | `vnd_*.manage`, `clm_project.manage`, `sec_role.manage` |
| Project Manager | `clm_project.read/update` (own projects), `clm_project_cost.manage`, `clm_project_expense.approve` |
| Site Engineer | `clm_project_expense.create`, `vnd_purchase_order.receive` (goods-receipt) |
| Procurement Manager | `vnd_purchase_order.approve` (Manager stage), `vnd_vendor.manage` |
| Procurement Officer | `vnd_purchase_order.create`, `vnd_material_service.manage` |
| Finance Manager | `vnd_purchase_order.approve` (Finance stage), `vnd_vendor_invoice.approve`, `vnd_vendor_payment.approve` |
| Accountant | `vnd_vendor_invoice.create/verify`, `vnd_vendor_payment.create`, `clm_payment.create` |
| Management | `*.read` (all modules, dashboards) |
| Viewer | `*.read` (scoped subset) |

Row-level scoping (which specific projects/vendors a user may see, not just which actions) is layered on top via Supabase RLS policies keyed off `company_id`/`branch_id` plus an optional `user_project_access` mapping — same pattern already used in the Client Management doc (§15) for client-level scoping, extended here to projects.

---

## PHASE 15 — PRISMA SCHEMA

See the accompanying `schema.prisma` file (delivered alongside this document) for the complete, buildable schema covering every table in this document. It includes stub models for the reused tables (`ClmClient`, `ClmClientInvoice`, `ClmPayment`, `ComPo`, `ComDocuments`, `ComApprovals`, `ComAuditLog`, `Users`) with only the fields this module's relations need — the authoritative full definition of those models remains the Client Management / Commercial Lifecycle docs; do not let the two schemas drift, generate from one consolidated `schema.prisma` in the real repo.

---

## PHASE 16 — MIGRATION STRATEGY (PRISMA + SUPABASE)

1. **Baseline first.** If `clm_*`/`com_*` tables from the two prior docs are not yet in the database, migrate those first (`npx prisma migrate dev --name init_client_and_commercial`), then layer this module on top (`--name add_project_vendor_procurement`). Never combine unrelated modules into one migration — it makes rollback surgical instead of all-or-nothing.
2. **Enum additions to existing types** (`com_document_entity_type`, `com_approval_entity_type`, `com_audit_action`) must run as raw SQL (`ALTER TYPE ... ADD VALUE`) inside a Prisma migration's `migration.sql`, since Prisma's migration engine doesn't natively diff enum value additions on Postgres native enums cleanly in all versions — add them via `prisma migrate dev --create-only` then hand-edit the generated SQL file before applying.
3. **`ALTER TYPE ... ADD VALUE` cannot run inside the same transaction as other DDL in Postgres ≤11**; Supabase runs modern Postgres so this is not a blocker, but keep enum-extension migrations as their own migration file regardless, for clean rollback.
4. **Order within this module's migration:** lookups (`vnd_vendor_type`, `vnd_material_category`) → `clm_project` → `clm_project_cost` → `vnd_vendor` → `vnd_vendor_contact`/`vnd_vendor_bank_account`/`vnd_material_service` → `vnd_purchase_order` → `vnd_purchase_order_item` → `vnd_vendor_invoice` → `vnd_vendor_invoice_item` → `vnd_vendor_payment` → `vnd_vendor_payment_allocation` → `vnd_vendor_rating` → `clm_project_expense` (references almost everything above, must be last) → `sec_*` tables (independent, can run anytime) → triggers/functions → view creation (`CREATE VIEW` statements as a final `migration.sql` appended block, since Prisma has no first-class view support — manage views via a `prisma/sql/views.sql` applied post-migration, or `postgres_fdw`-style `db push` hook).
5. **Views and triggers are NOT modeled in `schema.prisma`** (Prisma has no DDL primitive for `CREATE VIEW`/`CREATE TRIGGER`); keep them in a versioned `prisma/migrations/<ts>_views_and_triggers/migration.sql` so they travel with the same migration history, and expose views to the app layer as Prisma `@@ignore`d read-only models (Prisma 5+ supports mapping to views directly via `prisma db pull` after creation, or hand-written `Unsupported`/raw-query access).
6. **Staging rollout:** apply to a Supabase staging project first, run the seed script (Phase 17), verify every dashboard query (Phase 19) returns sane numbers, then promote via `prisma migrate deploy` against production — never `migrate dev` against production.
7. **RLS policies ship in the same migration** as the tables they protect (as raw SQL blocks), not as an afterthought — an unprotected `vnd_vendor_bank_account` table for even one deploy cycle is a real exposure.

---

## PHASE 17 — SEED DATA

See the accompanying `seed.sql` file. It continues the same illustrative story already used in the Client Management doc (client **Jindal Industries**, project **JSW Foundation**) so the three module docs compose into one coherent demo dataset:

- Project `PRJ-2026-0031` "JSW Foundation" for Jindal Industries, `contract_value = ₹3,00,00,000` (matching the Client Management doc's PO example).
- Project cost plan across all 8 categories (estimated vs budgeted).
- Two vendors: **Ultratech Cement Ltd.** (Material Supplier) and **Apex Equipment Rentals** (Equipment Supplier).
- One procurement PO to Ultratech for cement + steel, partially received.
- One vendor invoice against that PO, partially paid.
- One project expense row derived from that invoice.
- One vendor rating.
- Baseline RBAC seed: the 10 roles from Phase 14 and a representative permission set.

---

## PHASE 18 — REST API STRUCTURE

```
# Projects (Client Management extension)
GET/POST      /api/projects
GET/PUT       /api/projects/:projectId
GET           /api/projects/:projectId/financial-summary      → v_project_financial_summary
GET/POST      /api/projects/:projectId/cost-plan               → clm_project_cost
GET           /api/projects/:projectId/cost-summary             → v_project_cost_summary
GET/POST       /api/projects/:projectId/expenses
PUT            /api/expenses/:expenseId
PUT            /api/expenses/:expenseId/approve

# Vendors
GET/POST       /api/vendors
GET/PUT        /api/vendors/:vendorId
GET/POST       /api/vendors/:vendorId/contacts
GET/POST       /api/vendors/:vendorId/bank-accounts
GET/POST       /api/vendors/:vendorId/materials
GET/POST       /api/vendors/:vendorId/ratings
GET            /api/vendors/:vendorId/performance                → v_vendor_performance
GET            /api/vendors/:vendorId/documents                   → com_documents filtered
GET            /api/vendors/:vendorId/financial-summary             → v_vendor_financial_summary

# Purchase Orders (procurement)
GET/POST       /api/purchase-orders
GET/PUT        /api/purchase-orders/:poId
POST           /api/purchase-orders/:poId/submit
POST           /api/purchase-orders/:poId/approve       (body: {stage: 'Manager'|'Finance'})
POST           /api/purchase-orders/:poId/receive        (body: {items: [{poItemId, receivedQuantity}]})
POST           /api/purchase-orders/:poId/cancel

# Vendor Invoices
GET/POST       /api/vendor-invoices
GET/PUT        /api/vendor-invoices/:invoiceId
POST           /api/vendor-invoices/:invoiceId/verify
POST           /api/vendor-invoices/:invoiceId/approve

# Vendor Payments
GET/POST       /api/vendor-payments
POST           /api/vendor-payments/:paymentId/allocations
POST           /api/vendor-payments/:paymentId/approve

# Client Invoices / Payments (existing — unchanged, proxied here for convenience)
GET            /api/projects/:projectId/client-invoices     → proxies Client Management module
GET            /api/projects/:projectId/client-payments      → proxies Client Management module

# Documents / Approvals / Audit Logs (shared engines)
GET            /api/documents?entityType=&entityId=
POST           /api/documents
GET            /api/approvals?entityType=&entityId=
POST           /api/approvals/:approvalId/decision           (body: {status: 'Approved'|'Rejected', comments})
GET            /api/audit-logs?entityType=&entityId=

# RBAC
GET/POST       /api/roles
GET/POST       /api/roles/:roleId/permissions
GET/POST       /api/users/:userId/roles
```

---

## PHASE 19 — DASHBOARD QUERIES

See the accompanying `dashboard_queries.sql` file for the complete, runnable set covering: Total Clients, Total Vendors, Active Projects, Total Contract Value, Client Payments, Pending Client Payments, Total PO Value, Vendor Invoice Value, Vendor Payments, Pending Vendor Payments, Project Expenses, Expected Profit, Actual Profit, Project Profitability (ranked), and Vendor Performance (ranked).

---

## PHASE 20 — SECURITY AND SCALABILITY RECOMMENDATIONS

**Security**
- Enable Row Level Security on every table in this document; policies keyed off `company_id`/`branch_id` from the JWT, exactly as both prior docs already specify.
- `vnd_vendor_bank_account.account_number` and `upi_id`: mask in all list/summary API responses (show last 4 digits only); full value retrievable only via a dedicated, separately-permissioned endpoint (`permission_code = 'vnd_vendor_bank_account.reveal'`), and every reveal is written to `com_audit_log` with `action='Download'`. Consider Supabase's `pgsodium`/column encryption extension for at-rest encryption of this one column set rather than relying on RLS alone.
- Service-role keys stay server-side only; all frontend calls go through the anon key + RLS, matching the Commercial Lifecycle doc's existing stance.
- Every state-changing endpoint in Phase 18 checks `sec_role_permission` before executing — never trust a role name string from the client.
- Payment endpoints (`vendor-payments`, `client payments` in the existing module) require `approved_by` to be a *different* user than `created_by` where the org wants segregation-of-duties — enforce at the application layer with a `CHECK`-adjacent trigger if the business requires it (not included by default, to avoid over-engineering ahead of an explicit requirement).

**Scalability**
- `v_project_financial_summary` and `v_vendor_performance` aggregate across several tables and are dashboard-read-heavy; both are strong candidates for `MATERIALIZED VIEW` with a scheduled refresh (every 5–15 minutes) once project/vendor counts grow past a few hundred — same recommendation pattern already used in the Client Management doc.
- All money aggregation views filter `deleted_at IS NULL` and hit indexed FK columns (Phase 9) — verified against the DDL above.
- The `vnd_fn_recalc_po_totals` trigger runs one `UPDATE` per PO-item write, not per-row-of-the-whole-PO — fine at normal PO sizes (tens of lines); if bulk-import of hundreds of PO lines per transaction becomes common, batch the recalculation into a single statement-level trigger instead of the current row-level trigger.
- Partition `com_audit_log` by month once volume grows (mentioned as a forward-looking note, not built now — no premature optimization).

---

## FINAL ARCHITECTURE — WHAT THIS DOCUMENT OWNS VS. REUSES

| Owns (13 new core tables + 4 RBAC + 2 lookups) | Reuses unchanged | Extends (additive only) |
|---|---|---|
| `clm_project`, `clm_project_cost`, `clm_project_expense`, `vnd_vendor`, `vnd_vendor_contact`, `vnd_vendor_bank_account`, `vnd_material_service`, `vnd_vendor_rating`, `vnd_purchase_order`, `vnd_purchase_order_item`, `vnd_vendor_invoice`, `vnd_vendor_invoice_item`, `vnd_vendor_payment`, `vnd_vendor_payment_allocation`, `vnd_vendor_type`, `vnd_material_category`, `sec_role`, `sec_permission`, `sec_role_permission`, `sec_user_role` | `clm_client`, `clm_client_contact`, `clm_client_requirement`, `clm_client_invoice`, `clm_client_invoice_line`, `clm_payment`, `clm_payment_allocation`, entire `com_rfq→com_po` chain | `com_documents` (+`expiry_date`,+`verification_status`, +6 entity_type values), `com_approvals` (+3 entity_type values), `com_audit_log` (+7 action values) |

**Central-entity check (your final instruction):** `clm_project` is now the hub every financial fact hangs off — client billing (`clm_client_invoice.project_id`), procurement (`vnd_purchase_order.project_id`), vendor invoices/expenses (`vnd_vendor_invoice.project_id`, `clm_project_expense.project_id`), and the subcontract chain (`com_po.project_id`, already true in the existing doc) all point at it, and `v_project_financial_summary` is the single query that answers "how is this project doing" end to end — exactly the design goal you stated.
