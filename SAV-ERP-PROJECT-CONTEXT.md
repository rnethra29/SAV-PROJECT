# SAV-ERP-PROJECT-CONTEXT.md

**Purpose of this document:** This is the working context for Claude Code during the current development stage of the SAV Construction ERP. It contains only what has been discussed and approved. It deliberately does **not** contain detailed specifications for modules beyond Module 1 — those will be added as separate, approved specification documents when each module's design phase begins.

Every item below is tagged:
- **[APPROVED]** — finalized, safe to build against
- **[NOT YET SPECIFIED]** — acknowledged as needed, not yet designed
- **[REQUIRES FUTURE MODULE DESIGN]** — intentionally deferred to that module's own spec phase

---

## A. GLOBAL PROJECT PRINCIPLES `[APPROVED]`
             
- This is a **production system for a real construction company** (SAV Wind Foundations), not a demo, prototype, or portfolio project.
- The system must **never contain fake/placeholder data** — no fake projects, employees, clients, vendors, invoices, financial data, attendance, inventory, diesel records, dashboard metrics, or transactions, anywhere in the shipped product.
- On first deployment there is no operational data. Every module must show a **professional empty state** ("No projects have been created yet" + Create / Import actions) instead of sample content, and charts must show "no data available" rather than fabricated values.
- **Development/test mock data must be fully isolated from production** — mocking happens at the network layer (e.g. MSW) or in a clearly separated dev mode, never hardcoded inside production components.
- The company currently runs on Excel, paper, and WhatsApp. The ERP must integrate with this reality (Excel import/export as a first-class capability) and let the company gradually transition, rather than forcing an abrupt switch.
- Every module should ultimately support: search, filters, sort, pagination, Excel import/export, PDF generation, print, comments, attachments, activity timeline, audit log, approval status, and role permissions — as a shared platform capability, not a per-module reimplementation.
- "View" on any record opens a full **Workspace** (tabbed: Overview, Documents, Approvals, Comments, Audit History, related data) — never a simple read-only detail popup.

## B. APPROVED TECHNOLOGY / ARCHITECTURE DECISIONS

### B.1 Stack `[APPROVED]`
- **Frontend:** Next.js + TypeScript + Tailwind CSS (deployed to Vercel)
- **Backend:** Node.js + Express + **Prisma** (ORM), deployed **separately** from the frontend on a production Node.js-compatible hosting platform — not inside Next.js API routes, and not folded into Vercel serverless functions. The backend remains the primary business/API layer. Architecture stays portable so the backend can move to private cloud/on-premise later if required.
- **Database:** PostgreSQL via Supabase, accessed by the backend through Prisma
- **Auth:** Supabase Auth (infrastructure-level; see B.4 for how it fits the authorization chain)
- **Storage:** Supabase Storage (private buckets, signed URLs only — never public buckets)
- **Security/Edge:** Cloudflare Pro
- **CI:** GitHub Actions
- **Monitoring:** New Relic
- **Dev tooling:** VS Code, Postman, LambdaTest, DBeaver, Figma

### B.2 Data Architecture Principles `[APPROVED]`
- Data flows: **Master Data → Transactions → Derived Data → Reports/Analytics**.
- Proper foreign-key relationships throughout; **no duplication of shared entities across modules** — every module references the existing master record (`organization_id`, `branch_id`, `project_id`, `user_id`, `employee_id`, `client_id`, `vendor_id`) rather than storing its own copy of that data.
- Official company information (name, GSTIN, PAN, address, bank details, logo) is stored once at the Organization level and referenced everywhere it's needed (documents, reports) — never re-entered per module.
- Excel import must validate every column against a defined schema, reject invalid rows with row-level error detail, and commit only valid rows. Export uses the same template shape as import.
- Soft delete (`deleted_at`) throughout — records are archived, never hard-deleted, since historical transactions may reference them.
- Financial data is modeled as a **proper double-entry ledger** (Chart of Accounts + Journal Entries), not simple income/expense tables. *(Full ledger schema belongs to the Finance module's own spec — `[REQUIRES FUTURE MODULE DESIGN]` — this principle is approved now so no future module builds against a simpler assumption.)*

### B.3 Organizational Data Model `[APPROVED]`
```
Organization
   └── Branches
          └── Projects
   └── Users ──── role_id → Roles
              └── department_id → Departments   (attribute only — see C)
```
- Every business record traces to an Organization, directly or transitively — even though V1 supports only one organization (SAV Wind Foundations), so multi-organization support later requires no schema redesign.
- Access to branches/projects is granted via an **`access_grants`** table (`user_id`, `scope_type: 'branch' | 'project'`, `scope_id`) — a branch-level grant implies access to every project under that branch, including ones created later. Users with `is_org_admin = true` (MD/Administrator-tier) bypass scope checks entirely and see everything.

### B.4 Resolved Architecture Decisions `[APPROVED]`

These three items were previously open and are now decided. Do not introduce an alternative architecture for any of them unless a genuine technical blocker appears — if one does, stop and explain it explicitly rather than silently changing direction.

**1. Backend hosting topology.** Frontend (Next.js) deploys to Vercel. Express is deployed **separately**, on a production Node.js-compatible hosting platform — never placed inside Next.js API routes, and the entire backend security layer must not live there either. Express remains the primary business/API layer for the ERP. Kept portable so the backend can move to private cloud or on-premise infrastructure later if the company requires it.

**2. Prisma + Row-Level Security.** Prisma is the backend's database access layer, but it is **not** a substitute for authorization. The enforced request chain is:

```
Request
  ↓
Authentication
  ↓
Application Authorization / RBAC
  ↓
Project / Branch Scope Validation
  ↓
Prisma Query
  ↓
PostgreSQL
  ↓
RLS (where applicable)
```

The backend must fully authorize a request — identity, permission, and branch/project scope — *before* the Prisma query executes. PostgreSQL RLS is additional defense-in-depth, not the primary or sole authorization mechanism, and must not be relied upon to catch what the application layer failed to check. Authorization logic must not be duplicated in complicated form across both layers — each rule's owning layer should be clear and documented as either **Application RBAC** or **PostgreSQL RLS**, not both re-implementing the same nuance.

**3. Frontend data access.** The frontend never performs unrestricted or direct business-data database operations. All business-critical ERP operations flow:

```
Next.js Frontend → Express API → Authentication/Authorization → Prisma → PostgreSQL/Supabase
```

Supabase may still be used directly for pure infrastructure services — Storage, and Auth infrastructure if the final authentication design calls for it — but never for business data reads/writes, and privileged/service-role credentials must never be exposed to the browser.

**Security principle underlying all three:** never trust the frontend. The frontend controls UX; the backend controls authorization; the database is an additional boundary. Every protected operation validates authentication, permission, and scope — a user must not be able to gain access to another branch's or project's data by changing a URL, modifying a request, calling the API directly, manipulating frontend state, or substituting an ID.

## C. SECURITY / RBAC PRINCIPLES `[APPROVED]`

Access is governed by five independent, non-overlapping factors:

| Factor | Question it answers |
|---|---|
| Identity | Who is the user? |
| Department | Where does the user organizationally belong? |
| Role | What responsibility/capability does the user have? |
| Permission | What specific actions can the user perform? |
| Branch / Project | Which locations and projects can the user access? |

- **Department is explicitly NOT part of the access-control hierarchy.** It is an organizational attribute on the user record (used for directory, reporting, org charts, workflow routing) and must never be used to grant or restrict data access on its own — Finance, HR, and Procurement staff routinely need visibility across projects regardless of department.
- Permissions are granular and role-assignable, not hardcoded: View, Create, Edit, Delete, Approve, Reject, Import, Export, Generate Report, Configure.
- **No public registration, ever.** The first (bootstrap) Administrator account is created via a one-time deployment script, not through any user-facing flow. After bootstrap, all further users are created/invited by an Administrator only — there is no Sign Up page.
- **Frontend hides unauthorized UI for usability; backend independently enforces every permission on every request.** A user must never gain access by manipulating a URL or API call directly — the frontend's hiding of a button is a UX convenience, never the actual security boundary.
- Login flow: authenticate → load role, department, permissions, and branch/project grants → render only the authorized navigation and dashboard.

## D. DESIGN SYSTEM PRINCIPLES `[APPROVED]`

**Visual language:** the attached SAV Wind Foundations dashboard mockup is the approved reference for palette, typography, spacing, card treatment, and component style — but it is a *reference for visual language*, not a literal template to reproduce screen-for-screen. **Function over decoration, usability over visual complexity, consistency over individual-screen beauty.**

**Palette:**
- Cream/off-white base, deep espresso-brown sidebar/hero, amber-gold primary accent, teal secondary accent.
- Clean, structured, professional, low visual noise — enterprise software, not a startup dashboard. Avoid excessive gradients, shadows, animation, or decorative illustration.

**KPI card semantic colors** (identity-based, never changes with live data status):
| Category | Color | Answers |
|---|---|---|
| Neutral | Cream | "How many do we have?" (static counts) |
| Operational | Dark Brown | "What's happening right now on site?" |
| Analytics/Performance | Teal | "How well are we performing?" |
| Financial | Warm Sand | Anything money-related |

**Universal status colors** (state-based, completely independent of the above — never replaced by brand palette colors):
| Meaning | Color |
|---|---|
| Success / Approved / Completed | Green |
| Warning / Pending | Amber |
| Critical / Rejected / Error | Red |
| Informational / In Progress | Blue |
| Neutral / Inactive | Grey |

- **Alerts are an overlay, not a category** — a card's base semantic color never changes due to a warning state; only a badge/border/icon indicator appears on top of it.
- **Never rely on color alone.** Every status indicator pairs color with an icon and text — e.g. `✓ Approved`, `× Rejected`, `◷ Pending`, `! Critical` — so meaning is understandable even to someone unfamiliar with the palette. Status is shown as colored badges, not colored text.
- **Dark mode is planned but NOT in V1.** V1 ships light theme only; the theme toggle stays visible but disabled ("Coming Soon"). Colors must never be hardcoded in components — every component consumes centralized CSS custom-property design tokens (`--background`, `--surface`, `--sidebar-background`, `--primary`, `--secondary`, `--success`, `--warning`, `--danger`, `--border`, `--text-primary`, `--text-secondary`, plus the KPI semantic tokens) so dark mode is a future token-value change, not a component rewrite.

**Page structure convention:** Page Header (breadcrumb, title, description, primary action) → Filters/Search → Main Content → Supporting Information → Pagination/Actions. Layout adapts to what the module actually is, rather than forcing every screen into the dashboard-card pattern: data-heavy modules prioritize tables and filters; configuration modules prioritize forms; analytical modules prioritize charts and KPIs; transactional modules prioritize workflow and status.

**Responsive & accessible:** works across desktop, laptop, and tablet (mobile where applicable); proper contrast, full keyboard navigation, visible focus states, screen-reader support, large click targets.

## E. MODULE DEVELOPMENT PHILOSOPHY `[APPROVED]`

The ERP is built **one module at a time.** Before implementing any future module, it goes through this sequence, in order, and is not implemented until the sequence is complete:

1. Discuss module requirements
2. Define complete business workflow
3. Define database entities
4. Define relationships with existing entities (referencing established masters — never duplicating them)
5. Define RBAC for the module
6. Define API requirements
7. Define frontend requirements
8. Define Excel import/export
9. Define reports
10. Define notifications
11. Define approval requirements
12. Define audit requirements
13. Define integrations with other modules
14. Define edge cases
15. Define acceptance criteria
16. Approve the module specification
17. Only then implement

**Do not assume requirements for future modules. Do not invent future database tables prematurely. Do not implement a future module just because its name is already known** (e.g. from the earlier full module list) — a named-but-unspecified module has no approved design yet.

## F. MODULE 1 — COMPLETE CONTEXT `[APPROVED — ready to implement]`

**Module 1 = Authentication + RBAC + Organization / Branch / Project Foundation.** This is the only fully specified module at this stage. Every other module in the ERP will be built on top of this one.

### F.1 Organization / Company
- Company profile: legal name, logo, GSTIN, PAN, registered address, contact information, financial year, company-level settings.
- Single Organization record in V1 (multi-organization support is architecturally possible later without redesign — see B.3 — but not activated in V1).

### F.2 Branches
- Branch creation, editing, activation/deactivation.
- Branch attributes: code, address, contact details, branch manager.
- Branches have users assigned to them (via `access_grants`) and projects associated with them (`projects.branch_id`).

### F.3 Departments
- Simple department master (e.g. Finance, HR, Procurement, Operations) assigned to employees/users.
- **Department is an organizational classification only — not part of the access hierarchy** (see Section C). Used for directory, reporting, and future workflow-routing purposes.

### F.4 Users / Employees
- Fields: Employee ID, name, email, phone, profile, department, designation, role, branch assignment(s), project assignment(s), status, joining date, last login, activation status.
- No employee record is created via any public flow — always by an Administrator, or the one-time bootstrap script for the first Administrator.

### F.5 Authentication
- Login, logout, forgot password, reset password, change password, secure session management.
- Account activation/deactivation (soft, not deletion — a deactivated user's history remains intact and attributable).
- **User invitation flow:** Administrator creates employee → assigns role, branch(es), project(s), department → system sends an invitation email → employee sets their own password → employee logs in. This is the only supported onboarding path.
- **No public sign-up page exists in the application at all** — not hidden, not disabled, genuinely absent from the routed application.

### F.6 Bootstrap Administrator
- Created only via a one-time, ops-only deployment/setup script — never reachable as an HTTP route or public action.
- Deployment flow: deploy ERP → run initial setup script → create Organization → create bootstrap Administrator → Administrator logs in → completes Company Setup → invites remaining users.
- After deployment, public registration remains permanently disabled.

### F.7 RBAC
- **Roles (V1 baseline — refinable later, not a fixed final list):** Managing Director, Administrator, Project Manager, Finance Manager, HR Manager, Procurement Manager, Store Manager, Site Engineer, Supervisor, Equipment Manager, Vehicle Manager, Safety Officer, Quality Engineer, Employee.
- **Permissions** are granular and assignable per role: View, Create, Edit, Delete, Approve, Reject, Import, Export, Generate Report, Configure. Roles are collections of permissions, not hardcoded logic — new/custom roles must be addable without code changes.
- **Access scope** = Organization / Branch / Project / Role / Permission, per the model in Sections B.3 and C. A user sees only branches/projects they're explicitly granted (directly, or via a branch-level grant covering all its projects), unless their role carries organization-wide access (MD, Administrator).

### F.8 Company Setup Wizard
- Shown once, only to the bootstrap Administrator (or MD) — regular employees never see it.
- Steps (logical dependencies exist — e.g. Company Info before Invoice Templates — otherwise completable in any order): Company Information → Company Logo → Branches → Departments → Employees (import or create) → Approval Configuration → Document Templates → Invite Users.
- **Dismissible, not blocking.** Progress is saved and resumable across sessions (`setup_completed`, `setup_percentage`, `completed_steps`, `remaining_steps`, `completed_at`, `completed_by`). A persistent banner ("Finish Company Setup — X of 7 steps remaining") shows until complete; the full ERP remains usable throughout. After completion, the wizard never auto-appears again but can be reopened via Administration → Company Setup.

### F.9 What Module 1 Explicitly Does Not Include
- Any Procurement, Finance, Inventory, Attendance, or other business-workflow module — those are `[REQUIRES FUTURE MODULE DESIGN]`.
- The Approval Engine's full configurable workflow templates (amount-tiered routing, `condition_json` rule evaluation) are an approved *design* (see the project's Database Architecture document) but are not part of Module 1's build scope — Module 1 needs only the user/role/permission/access-grant foundation those engines will later sit on top of.
- The Excel Template Engine, Document Generator, Notification Engine, and Reporting Engine are approved designs for the overall ERP but are `[REQUIRES FUTURE MODULE DESIGN]` for their own implementation timing — Module 1 does not build these.

## G. FUTURE MODULE HANDLING RULES `[APPROVED]`

- The ERP will eventually contain 25+ modules (Project Management, BOQ & Estimation, Procurement, Inventory, Finance, Attendance, Diesel, Equipment, Quality Control, Safety, and others). **Their detailed specifications are intentionally not included in this document.**
- The only binding rule for every future module: **it must integrate with the existing approved foundation, never create a duplicate/parallel version of** Organization, Branch, Department, User, Employee, Role, Permission, or Project. Shared cross-cutting entities (attachments, approvals, audit log) are designed once, centrally, and reused by every module — not reimplemented per module.
- When a future module's design phase begins, its approved specification is written as a **separate document** and added to the project documentation — it does not get folded into this file, which stays scoped to global principles + whatever is currently approved for active development.

---

## Summary

### 1. Approved Architecture Principles
No fake/demo data anywhere in production; Excel-first, import-driven data entry; Master → Transaction → Derived → Reports data flow; no duplicated master entities across modules; soft delete throughout; double-entry financial ledger (design principle, Finance module build deferred); Organization → Branch → Project hierarchy with Department as a non-hierarchical user attribute; shared polymorphic cross-cutting tables (attachments, approvals, audit log) rather than per-module duplicates.

### 2. Module 1 Scope
Authentication, bootstrap Administrator + deployment-only account creation, no public signup, Administrator-driven user invitation, Organization/Branch/Department/User data model, RBAC (roles, granular permissions, branch/project access grants), Company Setup Wizard.

### 3. Module 1 Dependencies
None upstream — this is the foundation every other module depends on. Downstream: every future module depends on this module's Organization/Branch/Project/User/Role/Permission model being stable before it can be built.

### 4. Current Technology Decisions
Next.js + TypeScript + Tailwind on Vercel (frontend) · Node.js + Express + Prisma on a separate production Node host (backend) · PostgreSQL/Auth/Storage via Supabase · Cloudflare Pro · GitHub Actions (CI) · New Relic (monitoring). All three previously-open architecture questions — backend hosting topology, Prisma/RLS layering, and frontend-to-Express-only data access — are now resolved and approved; see Section B.4 for the exact enforcement chain.

### 5. Production Data Rules
Zero fake/placeholder data anywhere in the shipped product; professional empty states with Create/Import actions; dev/test mock data fully isolated from production code paths; the company's real Excel files and master data are the intended source of initial data population.

### 6. Future Module Development Process
One module at a time, through the 17-step sequence in Section E, each producing its own approved specification document before implementation begins. No requirements assumed or invented ahead of that process.

### 7. Explicitly Unspecified Future Areas
Every module beyond Module 1 (Project Management, BOQ/Estimation, Commercial/RFQ lifecycle, Procurement, Inventory, Finance ledger detail, Attendance, Diesel, Equipment, Quality Control, Safety, Payroll, Document Generator implementation, Excel Template Engine implementation, Notification Engine implementation, Reporting Engine implementation) — all `[REQUIRES FUTURE MODULE DESIGN]`. Their existence and high-level purpose are known from earlier planning; their schemas, workflows, and acceptance criteria are not yet approved and must not be built against.
