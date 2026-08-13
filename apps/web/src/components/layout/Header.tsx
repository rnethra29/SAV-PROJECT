"use client";

import { useEffect, useState } from "react";
import { MenuIcon, SearchIcon, BellIcon, SunIcon, PlusIcon, ChevronDownIcon } from "@/components/ui/icons";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

type HeaderProps = {
  onOpenMobileNav: () => void;
};

export function Header({ onOpenMobileNav }: HeaderProps) {
  // Client-only date: avoided at SSR time to prevent a server/client
  // render-time mismatch, not because the date itself is sensitive.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    // Deferred rather than called inline: setState directly in an effect
    // body triggers a cascading-render lint error. Running the first tick
    // through the same callback the interval uses keeps one code path and
    // satisfies the rule (state changes only from a callback, not the
    // effect body itself).
    const timeoutId = setTimeout(update, 0);
    const intervalId = setInterval(update, 60_000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  const formattedDate = now
    ? now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-surface px-4 lg:px-8">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="rounded-lg p-2 text-text-secondary transition hover:bg-background hover:text-text-primary lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        <div className="relative hidden lg:block">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            placeholder="Search"
            disabled
            aria-label="Search (coming soon)"
            title="Coming soon"
            className="w-64 rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-text-secondary placeholder:text-text-secondary disabled:cursor-not-allowed"
          />
        </div>

        {formattedDate && (
          <span className="hidden text-sm text-text-secondary xl:inline">{formattedDate}</span>
        )}

        <button
          type="button"
          disabled
          title="Coming soon"
          className="hidden items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-text-primary transition disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
        >
          <PlusIcon className="h-4 w-4" />
          Quick Create
        </button>

        <button
          type="button"
          disabled
          title="Dark mode — coming soon"
          aria-label="Toggle theme (coming soon)"
          className="rounded-lg p-2 text-text-secondary transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SunIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-lg p-2 text-text-secondary transition hover:bg-background hover:text-text-primary"
        >
          <BellIcon className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 border-l border-border pl-2.5 lg:pl-3">
          <div aria-hidden="true" className="h-8 w-8 rounded-full bg-border" />
          <ChevronDownIcon className="hidden h-4 w-4 text-text-secondary sm:block" />
        </div>
      </div>
    </header>
  );
}
