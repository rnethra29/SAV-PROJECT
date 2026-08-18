"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuIcon, SearchIcon, BellIcon, SunIcon, PlusIcon, ChevronDownIcon } from "@/components/ui/icons";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/lib/supabase/AuthProvider";

type HeaderProps = {
  onOpenMobileNav: () => void;
};

export function Header({ onOpenMobileNav }: HeaderProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  async function handleSignOut() {
    setIsUserMenuOpen(false);
    await signOut();
    router.replace("/login");
  }

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

        <div ref={userMenuRef} className="relative flex items-center border-l border-border pl-2.5 lg:pl-3">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
            aria-label="Account menu"
            className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-background"
          >
            <div aria-hidden="true" className="h-8 w-8 rounded-full bg-border" />
            <ChevronDownIcon className="hidden h-4 w-4 text-text-secondary sm:block" />
          </button>

          {isUserMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-border bg-surface p-1.5 shadow-[0_4px_16px_-4px_color-mix(in_srgb,var(--text-primary)_16%,transparent)]"
            >
              {user?.email && (
                <p className="truncate px-2.5 py-1.5 text-xs text-text-secondary">{user.email}</p>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                className="w-full rounded-md px-2.5 py-1.5 text-left text-sm text-text-primary transition hover:bg-background"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
