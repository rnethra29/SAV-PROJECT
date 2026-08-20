"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { SearchIcon, BriefcaseIcon, PlusIcon, ArrowRightIcon } from "@/components/ui/icons";
import { ProcurementOrderStatusBadge } from "./ProcurementOrderStatusBadges";
import { formatCurrency, formatDate } from "@/lib/format";
import type { VndPoStatus, VndPurchaseOrder } from "@/types/sites/procurement-order";
import type { VndVendor } from "@/types/sites/vendor";
import type { ClmProjectLookup } from "@/types/sites/project";

type ProcurementOrderListViewProps = {
  orders: VndPurchaseOrder[];
  vendors: VndVendor[];
  projects: ClmProjectLookup[];
};

const PO_STATUS_OPTIONS: { value: VndPoStatus; label: string }[] = [
  { value: "Draft", label: "Draft" },
  { value: "Pending Approval", label: "Pending Approval" },
  { value: "Approved", label: "Approved" },
  { value: "Sent to Vendor", label: "Sent to Vendor" },
  { value: "Partially Received", label: "Partially Received" },
  { value: "Received", label: "Received" },
  { value: "Closed", label: "Closed" },
  { value: "Cancelled", label: "Cancelled" },
];

function toAmount(value: string): number | null {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function ProcurementOrderListView({ orders, vendors, projects }: ProcurementOrderListViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VndPoStatus>("all");

  const vendorName = (vendorId: string) => vendors.find((v) => v.vendor_id === vendorId)?.vendor_name ?? "—";
  const projectLabel = (projectId: string) => {
    const project = projects.find((p) => p.project_id === projectId);
    return project ? `${project.project_code} · ${project.project_name}` : "—";
  };

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesTerm =
        term.length === 0 ||
        order.po_number.toLowerCase().includes(term) ||
        vendorName(order.vendor_id).toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, search, statusFilter, vendors]);

  if (orders.length === 0) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<BriefcaseIcon className="h-8 w-8" />}
          title="No purchase orders yet"
          description="Create the first procurement purchase order to a vendor."
          action={
            <Link href="/sites/procurement/new">
              <Button>
                <PlusIcon className="h-4 w-4" />
                Add Purchase Order
              </Button>
            </Link>
          }
        />
      </Panel>
    );
  }

  return (
    <Panel className="bg-surface">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO number, vendor…"
            aria-label="Search purchase orders"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          />
        </div>
        <Select
          id="po-status-filter"
          label="Status"
          labelClassName="sr-only"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | VndPoStatus)}
          options={[{ value: "all", label: "All Statuses" }, ...PO_STATUS_OPTIONS]}
          className="sm:w-52"
        />
      </div>

      {visibleOrders.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-8 w-8" />}
          title="No purchase orders match your search"
          description="Try a different search term, or clear the status filter."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">PO Number</th>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">PO Date</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr
                  key={order.po_id}
                  onClick={() => router.push(`/sites/procurement/${order.po_id}`)}
                  className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-background/60"
                >
                  <td className="px-5 py-3 font-medium">
                    <Link
                      href={`/sites/procurement/${order.po_id}`}
                      className="flex items-center gap-1.5 text-text-primary hover:text-secondary hover:underline underline-offset-2"
                    >
                      {order.po_number}
                      <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{projectLabel(order.project_id)}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{vendorName(order.vendor_id)}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{formatDate(order.po_date)}</td>
                  <td className="px-5 py-3 text-right text-text-primary">{formatCurrency(toAmount(order.total_amount))}</td>
                  <td className="px-5 py-3">
                    <ProcurementOrderStatusBadge status={order.status} />
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
