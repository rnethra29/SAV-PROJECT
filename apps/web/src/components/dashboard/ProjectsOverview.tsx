import { DashboardSection } from "./DashboardSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { FolderIcon } from "@/components/ui/icons";
import type { ProjectSummary } from "@/types/dashboard";

type ProjectsOverviewProps = {
  projects: ProjectSummary[];
  isLoading?: boolean;
};

const statusLabels: Record<ProjectSummary["status"], string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function ProjectsOverview({ projects, isLoading }: ProjectsOverviewProps) {
  return (
    <DashboardSection title="Projects">
      {isLoading ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="h-8 w-8" />}
          title="No projects have been created yet"
          description="Create a project directly or import from Excel."
          action={
            <div className="flex gap-2.5">
              <button
                type="button"
                className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-text-primary transition hover:brightness-95"
              >
                Create Project
              </button>
              <button
                type="button"
                className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-text-primary transition hover:bg-background"
              >
                Import Excel
              </button>
            </div>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Branch</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-text-primary">
                    {project.name}
                    <span className="ml-2 text-text-secondary">{project.code}</span>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{project.branchName}</td>
                  <td className="px-5 py-3 text-text-secondary">{statusLabels[project.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardSection>
  );
}
