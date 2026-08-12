import type { ReactNode } from "react";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";

type MetricCardVariant = "neutral" | "operational" | "analytics" | "financial";

// Section D's KPI palette. Which variant a given metric gets is a visual
// rhythm decision made at the call site (dashboard/page.tsx), not a claim
// about business meaning — see that file for which metric uses which.
const variantClasses: Record<MetricCardVariant, string> = {
  neutral: "bg-kpi-neutral text-text-primary",
  operational: "bg-kpi-operational text-text-on-sidebar",
  analytics: "bg-kpi-analytics text-text-on-sidebar",
  financial: "bg-kpi-financial text-text-primary",
};

const skeletonTone: Record<MetricCardVariant, "default" | "on-dark"> = {
  neutral: "default",
  operational: "on-dark",
  analytics: "on-dark",
  financial: "default",
};

// Icon chip tint follows the card's own variant rather than always being
// amber — keeps operational/analytics cards internally coherent instead of
// an amber accent clashing against a dark-espresso or teal fill.
const chipClasses: Record<MetricCardVariant, string> = {
  neutral: "bg-primary/15 text-primary",
  operational: "bg-text-on-sidebar/15 text-text-on-sidebar",
  analytics: "bg-text-on-sidebar/15 text-text-on-sidebar",
  financial: "bg-text-primary/10 text-text-primary",
};

type MetricCardProps = {
  label: string;
  value: number | null;
  icon?: ReactNode;
  variant?: MetricCardVariant;
  isLoading?: boolean;
  // Defaults to plain en-IN grouping (existing Dashboard behavior) — the
  // Commercial module passes formatCurrency for money-valued KPIs.
  valueFormatter?: (value: number) => string;
};

export function MetricCard({
  label,
  value,
  icon,
  variant = "neutral",
  isLoading,
  valueFormatter,
}: MetricCardProps) {
  return (
    <Panel className={`p-5 ${variantClasses[variant]}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium opacity-80">{label}</p>
        {icon && (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${chipClasses[variant]}`}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3">
        {isLoading ? (
          <Skeleton className="h-8 w-16" tone={skeletonTone[variant]} />
        ) : (
          <p className="text-3xl font-semibold tracking-tight">
            {value === null ? "—" : (valueFormatter ?? ((v: number) => v.toLocaleString("en-IN")))(value)}
          </p>
        )}
      </div>
    </Panel>
  );
}
