"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { Logo } from "@/components/brand/Logo";
import {
  LayoutIcon,
  BriefcaseIcon,
  BuildingIcon,
  LayersIcon,
  UsersIcon,
  ShieldIcon,
  SettingsIcon,
  ChevronLeftIcon,
  InboxIcon,
  FolderIcon,
  SearchIcon,
  ChartBarIcon,
  TrendingUpIcon,
} from "@/components/ui/icons";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

// Only what's actually approved for Module 1. Future modules (Project
// Management, Procurement, Finance, ...) are not listed here, even as
// disabled placeholders — they haven't been through the spec process yet.
const primaryNav: NavItem[] = [{ label: "Dashboard", href: "/dashboard", icon: LayoutIcon }];

// Commercial Lifecycle module — full frontend scope: RFQ through PO, one
// connected pipeline. Every entry here has a built, non-dead route.
const commercialNav: NavItem[] = [
  { label: "Overview", href: "/commercial", icon: LayoutIcon },
  { label: "RFQ", href: "/commercial/rfq", icon: InboxIcon },
  { label: "Estimation", href: "/commercial/estimation", icon: LayersIcon },
  { label: "Market Price Analysis", href: "/commercial/market-price", icon: SearchIcon },
  { label: "Actual vs Quoted", href: "/commercial/actual-vs-quoted", icon: ChartBarIcon },
  { label: "Profit Analysis", href: "/commercial/profit-analysis", icon: TrendingUpIcon },
  { label: "Quotations", href: "/commercial/quotations", icon: FolderIcon },
  { label: "Negotiations", href: "/commercial/negotiations", icon: UsersIcon },
  { label: "BOQ", href: "/commercial/boq", icon: BriefcaseIcon },
  { label: "Purchase Orders", href: "/commercial/po", icon: BuildingIcon },
];

const administrationNav: NavItem[] = [
  { label: "Organization", href: "/administration/organization", icon: BriefcaseIcon },
  { label: "Branches", href: "/administration/branches", icon: BuildingIcon },
  { label: "Departments", href: "/administration/departments", icon: LayersIcon },
  { label: "Users", href: "/administration/users", icon: UsersIcon },
  { label: "Roles & Permissions", href: "/administration/roles", icon: ShieldIcon },
  { label: "Company Setup", href: "/administration/company-setup", icon: SettingsIcon },
];

type SidebarProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const renderLink = (item: NavItem) => {
    // "/commercial" (Overview) would otherwise prefix-match every other
    // Commercial route (e.g. /commercial/rfq/...) since they all share that
    // base path — exact-match it so only the other, more specific entries
    // light up on their own subtrees.
    const isActive =
      pathname === item.href || (item.href !== "/commercial" && pathname.startsWith(`${item.href}/`));
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onCloseMobile}
        aria-current={isActive ? "page" : undefined}
        title={isCollapsed ? item.label : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? "bg-primary text-text-primary"
            : "text-text-on-sidebar/80 hover:bg-text-on-sidebar/5 hover:text-text-on-sidebar"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <div
          aria-hidden="true"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-text-primary/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar-background transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        <div className="flex h-16 items-center overflow-hidden border-b border-text-on-sidebar/10 px-4">
          <Logo variant={isCollapsed ? "mark" : "full"} />
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <div className="space-y-1">{primaryNav.map(renderLink)}</div>
          <div>
            {!isCollapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-on-sidebar/50">
                Commercial
              </p>
            )}
            <div className="space-y-1">{commercialNav.map(renderLink)}</div>
          </div>
          <div>
            {!isCollapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-on-sidebar/50">
                Administration
              </p>
            )}
            <div className="space-y-1">{administrationNav.map(renderLink)}</div>
          </div>
        </nav>

        <div className="hidden border-t border-text-on-sidebar/10 p-3 lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-on-sidebar/80 transition hover:bg-text-on-sidebar/5 hover:text-text-on-sidebar"
          >
            <ChevronLeftIcon
              className={`h-4 w-4 shrink-0 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
            />
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
