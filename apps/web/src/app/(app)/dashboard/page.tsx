import type { Metadata } from "next";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SetupProgressBanner } from "@/components/dashboard/SetupProgressBanner";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProjectsOverview } from "@/components/dashboard/ProjectsOverview";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { BuildingIcon, FolderIcon, UsersIcon, LayersIcon } from "@/components/ui/icons";
import type { DashboardData, OrgSnapshotMetricKey } from "@/types/dashboard";
import type { ComponentType, SVGProps } from "react";

export const metadata: Metadata = {
  title: "Dashboard · SAV ERP",
  description: "SAV Wind Foundations Enterprise ERP dashboard.",
};

// TEMPORARY — no dashboard API exists yet. Replace with a real
// apiFetch("/dashboard") call once the Express endpoint exists. Until then
// this returns the honest empty-data contract, never fabricated numbers.
async function getDashboardData(): Promise<DashboardData> {
  return {
    currentUser: null,
    setupProgress: null,
    orgSnapshot: [
      { key: "branches", label: "Branches", value: null },
      { key: "projects", label: "Projects", value: null },
      { key: "users", label: "Users", value: null },
      { key: "departments", label: "Departments", value: null },
    ],
    projects: [],
    recentActivity: [],
  };
}

const metricIcons: Record<OrgSnapshotMetricKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  branches: BuildingIcon,
  projects: FolderIcon,
  users: UsersIcon,
  departments: LayersIcon,
};

// Visual rhythm only (cream/espresso/teal/amber), not a claim about what
// each count "means" — Branches/Projects/Users/Departments are all equally
// "how many do we have." Two of four stay Neutral so light surfaces remain
// the majority across the page as a whole (every other panel below is
// cream/white already); amber is deliberately not reused here since it's
// already the dashboard's action color (buttons, sidebar, setup banner).
const metricVariants: Record<OrgSnapshotMetricKey, "neutral" | "operational" | "analytics" | "financial"> = {
  branches: "neutral",
  projects: "operational",
  users: "analytics",
  departments: "neutral",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6 2xl:mx-auto 2xl:max-w-[1600px]">
      <SetupProgressBanner progress={data.setupProgress} />

      <DashboardHero currentUser={data.currentUser} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.orgSnapshot.map((metric) => {
          const Icon = metricIcons[metric.key];
          return (
            <MetricCard
              key={metric.key}
              label={metric.label}
              value={metric.value}
              icon={<Icon className="h-5 w-5" />}
              variant={metricVariants[metric.key]}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ProjectsOverview projects={data.projects} />
        </div>
        <ActivityList activity={data.recentActivity} />
      </div>
    </div>
  );
}
