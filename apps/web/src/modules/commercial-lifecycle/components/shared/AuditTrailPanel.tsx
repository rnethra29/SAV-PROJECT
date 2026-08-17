import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format";
import { userNames } from "@/modules/commercial-lifecycle/fixtures/audit";
import type { AuditAction, AuditLogEntry } from "@/modules/commercial-lifecycle/types/shared";

const ACTION_LABELS: Record<AuditAction, string> = {
  insert: "Created",
  update: "Updated",
  delete: "Deleted",
  status_change: "Status changed",
};

function describeChange(entry: AuditLogEntry): string | null {
  if (entry.action === "status_change" && entry.oldValue && entry.newValue) {
    const from = (entry.oldValue as { status?: string }).status;
    const to = (entry.newValue as { status?: string }).status;
    if (from && to) return `${from.replace(/_/g, " ")} → ${to.replace(/_/g, " ")}`;
  }
  return null;
}

type AuditTrailPanelProps = {
  entries: AuditLogEntry[];
  title?: string;
};

export function AuditTrailPanel({ entries, title = "Audit Trail" }: AuditTrailPanelProps) {
  return (
    <Panel className="bg-surface">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      {entries.length === 0 ? (
        <EmptyState
          icon={<LayersIcon className="h-8 w-8" />}
          title="No audit history yet"
          description="Every insert, update and status change against this record will be logged here."
        />
      ) : (
        <ol className="divide-y divide-border">
          {entries.map((entry) => {
            const change = describeChange(entry);
            return (
              <li key={entry.id} className="flex items-start gap-3 p-4">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">{ACTION_LABELS[entry.action]}</span>
                    {change && <span className="text-text-secondary"> · {change}</span>}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {userNames[entry.userId] ?? entry.userId} · {formatDateTime(entry.performedAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
