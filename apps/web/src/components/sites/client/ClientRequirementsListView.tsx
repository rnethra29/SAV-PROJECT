import { EmptyState } from "@/components/ui/EmptyState";
import { FolderIcon } from "@/components/ui/icons";
import { RequirementPriorityBadge, RequirementStatusBadge } from "./RequirementBadges";
import { formatDate } from "@/lib/format";
import type { ClmClientRequirement } from "@/types/sites/requirement";

type ClientRequirementsListViewProps = {
  requirements: ClmClientRequirement[];
};

/**
 * Pure list/table rendering for the Requirements section, extracted out of
 * ClientRequirementsContainer so it can be reused wherever loaded
 * requirements data is already available (e.g. a development preview) —
 * same List/Detail split already used for ClientListContainer/ClientListView.
 */
export function ClientRequirementsListView({ requirements }: ClientRequirementsListViewProps) {
  if (requirements.length === 0) {
    return (
      <EmptyState
        icon={<FolderIcon className="h-8 w-8" />}
        title="No requirements yet"
        description="Log the client's first requirement to start the pre-RFQ trail."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-secondary">
          <tr>
            <th className="px-5 py-3 font-medium">Requirement</th>
            <th className="px-5 py-3 font-medium">Received</th>
            <th className="px-5 py-3 font-medium">Due</th>
            <th className="px-5 py-3 font-medium">Priority</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {requirements.map((requirement) => (
            <tr key={requirement.requirement_id} className="border-b border-border last:border-0 hover:bg-background/60">
              <td className="px-5 py-3">
                <div className="font-medium text-text-primary">{requirement.requirement_title}</div>
                <div className="text-text-secondary">{requirement.requirement_number}</div>
              </td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{formatDate(requirement.received_date)}</td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                {formatDate(requirement.required_completion_date)}
              </td>
              <td className="px-5 py-3">
                <RequirementPriorityBadge priority={requirement.priority} />
              </td>
              <td className="px-5 py-3">
                <RequirementStatusBadge status={requirement.requirement_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
