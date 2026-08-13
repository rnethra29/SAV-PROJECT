"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { SettingsIcon } from "@/components/ui/icons";
import type { SetupProgress } from "@/types/dashboard";

type SetupProgressBannerProps = {
  progress: SetupProgress;
};

// F.8: shown until Company Setup is complete, dismissible (not blocking),
// reappears next session if still incomplete since `dismissed` is local
// state, not persisted — matches "persistent banner... until complete."
export function SetupProgressBanner({ progress }: SetupProgressBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!progress || progress.completed || dismissed) return null;

  const remaining = progress.totalSteps - progress.completedSteps;

  return (
    <Panel className="flex overflow-hidden bg-kpi-neutral">
      {/* Plain flex sibling, not a border-color override on Panel itself —
          two competing border/bg utilities on one element aren't reliably
          resolved by className string order (see Panel.tsx). */}
      <div aria-hidden="true" className="w-1.5 shrink-0 bg-primary" />
      <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <SettingsIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              Finish Company Setup — {remaining} of {progress.totalSteps} steps remaining
            </p>
            <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percentage}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-text-primary transition hover:bg-background"
          >
            Resume Setup
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="rounded-lg p-2 text-lg leading-none text-text-secondary transition hover:bg-background hover:text-text-primary"
          >
            ×
          </button>
        </div>
      </div>
    </Panel>
  );
}
