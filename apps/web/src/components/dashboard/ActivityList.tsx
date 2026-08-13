import { DashboardSection } from "./DashboardSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { InboxIcon } from "@/components/ui/icons";
import type { ActivityItem } from "@/types/dashboard";

type ActivityListProps = {
  activity: ActivityItem[];
  isLoading?: boolean;
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

export function ActivityList({ activity, isLoading }: ActivityListProps) {
  return (
    <DashboardSection title="Recent Activity">
      {isLoading ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      ) : activity.length === 0 ? (
        <EmptyState
          icon={<InboxIcon className="h-8 w-8" />}
          title="No recent activity yet"
          description="Actions across your organization will appear here."
        />
      ) : (
        <ul className="divide-y divide-border">
          {activity.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-3">
              <div>
                <p className="text-sm text-text-primary">{item.message}</p>
                <p className="text-xs text-text-secondary">{item.actorName}</p>
              </div>
              <span className="shrink-0 text-xs text-text-secondary">
                {formatRelativeTime(item.occurredAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
