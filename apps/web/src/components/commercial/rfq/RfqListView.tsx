"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchIcon, InboxIcon } from "@/components/ui/icons";
import { RfqStatusBadge, RFQ_STATUS_LABELS } from "./RfqStatusBadge";
import type { RfqStatus } from "@/types/commercial/rfq";
import type { RfqListEntry } from "@/lib/fixtures/rfq";

type SortKey = "date_desc" | "date_asc" | "rfq_number_asc" | "client_asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc", label: "RFQ Date (Newest First)" },
  { value: "date_asc", label: "RFQ Date (Oldest First)" },
  { value: "rfq_number_asc", label: "RFQ Number (A–Z)" },
  { value: "client_asc", label: "Client (A–Z)" },
];

const STATUS_FILTER_OPTIONS = (Object.keys(RFQ_STATUS_LABELS) as RfqStatus[]).map((status) => ({
  value: status,
  label: RFQ_STATUS_LABELS[status],
}));

type RfqListViewProps = {
  rfqs: RfqListEntry[];
};

export function RfqListView({ rfqs }: RfqListViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RfqStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date_desc");

  const visibleRfqs = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = rfqs.filter((rfq) => {
      const matchesStatus = statusFilter === "all" || rfq.status === statusFilter;
      const matchesTerm =
        term.length === 0 ||
        rfq.rfqNumber.toLowerCase().includes(term) ||
        rfq.clientName.toLowerCase().includes(term) ||
        rfq.projectName.toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "date_asc":
          return a.rfqDate.localeCompare(b.rfqDate);
        case "rfq_number_asc":
          return a.rfqNumber.localeCompare(b.rfqNumber);
        case "client_asc":
          return a.clientName.localeCompare(b.clientName);
        case "date_desc":
        default:
          return b.rfqDate.localeCompare(a.rfqDate);
      }
    });
  }, [rfqs, search, statusFilter, sortKey]);

  return (
    <Panel className="bg-surface">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search RFQ number, client, project…"
            aria-label="Search RFQs"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex w-full gap-3 sm:w-auto">
          <Select
            id="rfq-status-filter"
            label="Status"
            labelClassName="sr-only"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | RfqStatus)}
            options={[{ value: "all", label: "All Statuses" }, ...STATUS_FILTER_OPTIONS]}
            className="sm:w-48"
          />
          <Select
            id="rfq-sort"
            label="Sort by"
            labelClassName="sr-only"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            options={SORT_OPTIONS}
            className="sm:w-56"
          />
        </div>
      </div>

      {rfqs.length === 0 ? (
        <EmptyState
          icon={<InboxIcon className="h-8 w-8" />}
          title="No RFQs yet"
          description="RFQs received from clients will appear here once created."
        />
      ) : visibleRfqs.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-8 w-8" />}
          title="No RFQs match your search"
          description="Try a different search term, or clear the status filter."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">RFQ Number</th>
                <th className="px-5 py-3 font-medium">Client / Project</th>
                <th className="px-5 py-3 font-medium">RFQ Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRfqs.map((rfq) => (
                <tr key={rfq.id} className="border-b border-border transition-colors last:border-0 hover:bg-background/60">
                  <td className="px-5 py-3 font-medium">
                    <Link
                      href={`/commercial/rfq/${rfq.id}`}
                      className="text-text-primary hover:text-secondary hover:underline"
                    >
                      {rfq.rfqNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-text-primary">{rfq.clientName}</div>
                    <div className="text-text-secondary">{rfq.projectName}</div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                    {new Date(rfq.rfqDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <RfqStatusBadge status={rfq.status} />
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{rfq.itemCount}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/commercial/rfq/${rfq.id}`}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:border-secondary hover:text-text-primary"
                      >
                        View
                      </Link>
                      <Link
                        href={`/commercial/rfq/${rfq.id}/edit`}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:border-secondary hover:text-text-primary"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
