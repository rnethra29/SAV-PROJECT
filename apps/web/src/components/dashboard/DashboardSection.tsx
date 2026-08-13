import type { ReactNode } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";

type DashboardSectionProps = {
  title: string;
  viewAllHref?: string;
  children: ReactNode;
};

export function DashboardSection({ title, viewAllHref, children }: DashboardSectionProps) {
  return (
    <Panel className="bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm font-medium text-secondary hover:underline">
            View all
          </Link>
        )}
      </div>
      <div>{children}</div>
    </Panel>
  );
}
