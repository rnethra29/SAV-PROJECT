import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BuildingIcon, InboxIcon } from "@/components/ui/icons";

/**
 * Client 360 RFQs & Projects section — deliberately static, no API calls.
 *
 * RFQs: com_rfq.client_id references `clients(id)` (src/database/
 * migrations/004_rfq_tables.sql:8), a different table from
 * clm_client.client_id (src/database/migrations/014_clm_client_tables.sql).
 * GET /clients/:clientId/rfqs exists (src/routes/clmClient.routes.js:43)
 * and would return 200 with an empty array for any clm_client_id today —
 * indistinguishable from "this client genuinely has no RFQs" once the two
 * client entities are reconciled. Calling it here would misrepresent an
 * architecture gap as "no RFQs yet", so this section stays a static
 * pending-reconciliation notice instead (doc escalation #3).
 *
 * Projects/Sites: GET /clients/:clientId/projects exists (clmClient.routes.js:44)
 * but reads from `v_client_project_summary`, a view over a bare `projects`
 * table (src/database/migrations/019_clm_views.sql:29-32) that no migration
 * in this repository creates — it's assumed to belong to a not-yet-built
 * Project Management module. Calling that endpoint would 500 against a
 * missing relation, so it isn't called at all.
 */
export function ClientRfqProjectsSection() {
  return (
    <div className="space-y-2">
      <Panel className="bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">RFQs</h3>
          <StatusBadge label="Pending reconciliation" tone="warning" />
        </div>
        <EmptyState
          icon={<InboxIcon className="h-8 w-8" />}
          title="RFQ relationships are being connected to this client."
          description="RFQ records will appear here once client linkage is available."
        />
      </Panel>

      <Panel className="bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Projects & Sites</h3>
          <StatusBadge label="Not available" tone="inactive" />
        </div>
        <EmptyState
          icon={<BuildingIcon className="h-8 w-8" />}
          title="Not available yet"
          description="Project and site records will appear here once the Project Management module is connected."
        />
      </Panel>
    </div>
  );
}
