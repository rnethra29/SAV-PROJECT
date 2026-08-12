"use client";

import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";

// TEMPORARY — no destination exists yet (no admin pages/API built). Isolated
// no-op handler, same pattern as Login's Forgot Password, until each
// action's destination is designed and built.
function noop() {}

const secondaryActions = ["Create Branch", "Invite User"];

export function QuickActions() {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:flex-col lg:items-stretch">
      <Button variant="primary" onClick={noop} className="justify-center gap-2">
        <PlusIcon className="h-4 w-4" />
        Create Project
      </Button>
      {secondaryActions.map((label) => (
        <button
          key={label}
          type="button"
          onClick={noop}
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary shadow-[0_1px_3px_color-mix(in_srgb,var(--text-primary)_14%,transparent)] transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
