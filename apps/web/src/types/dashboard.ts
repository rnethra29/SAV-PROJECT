export type CurrentUser = {
  fullName: string;
  avatarUrl?: string;
} | null;

export type SetupProgress = {
  completed: boolean;
  percentage: number;
  completedSteps: number;
  totalSteps: number;
} | null;

export type OrgSnapshotMetricKey = "branches" | "projects" | "users" | "departments";

export type OrgSnapshotMetric = {
  key: OrgSnapshotMetricKey;
  label: string;
  value: number | null;
};

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";

export type ProjectSummary = {
  id: string;
  name: string;
  code: string;
  branchName: string;
  status: ProjectStatus;
};

export type ActivityItem = {
  id: string;
  message: string;
  actorName: string;
  occurredAt: string;
};

export type DashboardData = {
  currentUser: CurrentUser;
  setupProgress: SetupProgress;
  orgSnapshot: OrgSnapshotMetric[];
  projects: ProjectSummary[];
  recentActivity: ActivityItem[];
};
