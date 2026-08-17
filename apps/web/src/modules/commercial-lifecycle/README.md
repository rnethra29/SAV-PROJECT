# Commercial Lifecycle frontend code

Business-module-owned code for `01-commercial-lifecycle` (RFQ → Estimation → Market/Actual Price → Quotation → Negotiation → BOQ → PO), living here rather than at the repository's top level because Next.js needs one unified `app/` route tree — this is the module-first tree that tree's thin route files (`apps/web/src/app/(app)/commercial/**`) import from via the `@/modules/commercial-lifecycle/...` alias.

```
commercial-lifecycle/
  components/   one folder per stage (rfq/, estimation/, market-price/, quotation/, negotiation/, boq/, po/,
                actual-price/, profit/, comparison/) + shared/ (status badges, document/approval/audit panels)
  lib/          rfq-workflow.ts (client-side status-transition mirror), boq-generation.ts, po-generation.ts,
                document-export.ts
  fixtures/     TEMPORARY mock data standing in for the not-yet-wired-up backend — every file is labeled and
                every write action honestly reports "service unavailable" rather than faking a save. Replace
                with real apiFetch(...) calls against 01-commercial-lifecycle/backend/ once wired up.
  types/        TS types mirroring the backend's com_* table shapes
```

Route-registration files stay in `apps/web/src/app/(app)/commercial/**` (Next.js requirement) and import from here.
