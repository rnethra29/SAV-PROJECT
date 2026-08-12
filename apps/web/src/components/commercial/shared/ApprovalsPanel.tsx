import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShieldIcon } from "@/components/ui/icons";
import { ApprovalStatusBadge } from "./StatusBadges";
import { formatDateTime } from "@/lib/format";
import { userNames } from "@/lib/fixtures/audit";
import type { Approval } from "@/types/commercial/shared";

type ApprovalsPanelProps = {
  approvals: Approval[];
  title?: string;
};

export function ApprovalsPanel({ approvals, title = "Approvals" }: ApprovalsPanelProps) {
  return (
    <Panel className="bg-surface">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      {approvals.length === 0 ? (
        <EmptyState
          icon={<ShieldIcon className="h-8 w-8" />}
          title="No approval gates recorded"
          description="Approval history for this record will appear here as gates are actioned."
        />
      ) : (
        <ul className="divide-y divide-border">
          {approvals.map((approval) => (
            <li key={approval.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{approval.approvalStage}</p>
                <p className="text-xs text-text-secondary">
                  {userNames[approval.approverId] ?? approval.approverId} · Requested{" "}
                  {formatDateTime(approval.createdAt)}
                </p>
                {approval.comments && <p className="mt-1 text-sm text-text-secondary">{approval.comments}</p>}
                {approval.rejectionReason && (
                  <p className="mt-1 text-sm text-danger">{approval.rejectionReason}</p>
                )}
              </div>
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <ApprovalStatusBadge status={approval.status} />
                {approval.approvedAt && (
                  <span className="text-xs text-text-secondary">{formatDateTime(approval.approvedAt)}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
