"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type WorkspaceTab = {
  label: string;
  segment: string; // "" for the workspace root (Overview)
};

const TABS: WorkspaceTab[] = [
  { label: "Overview", segment: "" },
  { label: "Items", segment: "items" },
  { label: "Documents", segment: "documents" },
  { label: "Approvals", segment: "approvals" },
  { label: "Audit", segment: "audit" },
  { label: "Revisions", segment: "revisions" },
  { label: "Estimation", segment: "estimation" },
  { label: "Market Price", segment: "market-price" },
  { label: "Actual Price", segment: "actual-price" },
  { label: "Actual vs Quoted", segment: "comparison" },
  { label: "Profit", segment: "profit" },
  { label: "Quotation", segment: "quotation" },
  { label: "Negotiation", segment: "negotiation" },
  { label: "BOQ", segment: "boq" },
  { label: "PO", segment: "po" },
];

type RfqWorkspaceTabsProps = {
  rfqId: string;
};

export function RfqWorkspaceTabs({ rfqId }: RfqWorkspaceTabsProps) {
  const pathname = usePathname();
  const basePath = `/commercial/rfq/${rfqId}`;

  return (
    <div className="overflow-x-auto border-b border-border">
      <nav className="flex min-w-max gap-1 px-1" aria-label="RFQ workspace sections">
        {TABS.map((tab) => {
          const href = tab.segment ? `${basePath}/${tab.segment}` : basePath;
          const isActive = tab.segment ? pathname.startsWith(href) : pathname === basePath;
          return (
            <Link
              key={tab.label}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "border-primary text-text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
