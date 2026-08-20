"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { SearchIcon, BuildingIcon, PlusIcon, ArrowRightIcon } from "@/components/ui/icons";
import { VendorStatusBadge, VENDOR_STATUS_LABELS } from "./VendorStatusBadge";
import type { VndVendor, VndVendorStatus, VndVendorType } from "@/types/sites/vendor";

type VendorListViewProps = {
  vendors: VndVendor[];
  vendorTypes: VndVendorType[];
};

const STATUS_FILTER_OPTIONS = (Object.keys(VENDOR_STATUS_LABELS) as VndVendorStatus[]).map((status) => ({
  value: status,
  label: VENDOR_STATUS_LABELS[status],
}));

export function VendorListView({ vendors, vendorTypes }: VendorListViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VndVendorStatus>("all");

  const vendorTypeLabel = (vendorTypeId: string) =>
    vendorTypes.find((type) => type.vendor_type_id === vendorTypeId)?.type_name ?? "—";

  const visibleVendors = useMemo(() => {
    const term = search.trim().toLowerCase();
    return vendors.filter((vendor) => {
      const matchesStatus = statusFilter === "all" || vendor.vendor_status === statusFilter;
      const matchesTerm =
        term.length === 0 ||
        vendor.vendor_code.toLowerCase().includes(term) ||
        vendor.vendor_name.toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [vendors, search, statusFilter]);

  if (vendors.length === 0) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<BuildingIcon className="h-8 w-8" />}
          title="No vendors yet"
          description="Create your first vendor to start managing procurement relationships."
          action={
            <Link href="/sites/vendors/new">
              <Button>
                <PlusIcon className="h-4 w-4" />
                Add Vendor
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
            placeholder="Search vendor code, name…"
            aria-label="Search vendors"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          />
        </div>
        <Select
          id="vendor-status-filter"
          label="Status"
          labelClassName="sr-only"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | VndVendorStatus)}
          options={[{ value: "all", label: "All Statuses" }, ...STATUS_FILTER_OPTIONS]}
          className="sm:w-48"
        />
      </div>

      {visibleVendors.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-8 w-8" />}
          title="No vendors match your search"
          description="Try a different search term, or clear the status filter."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">Vendor Code</th>
                <th className="px-5 py-3 font-medium">Vendor Name</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleVendors.map((vendor) => (
                <tr
                  key={vendor.vendor_id}
                  onClick={() => router.push(`/sites/vendors/${vendor.vendor_id}`)}
                  className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-background/60"
                >
                  <td className="px-5 py-3 font-medium text-text-primary">
                    <Link
                      href={`/sites/vendors/${vendor.vendor_id}`}
                      className="hover:text-secondary hover:underline underline-offset-2"
                    >
                      {vendor.vendor_code}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/sites/vendors/${vendor.vendor_id}`} className="flex items-center gap-1.5">
                      <span className="text-text-primary group-hover:text-secondary group-hover:underline underline-offset-2">
                        {vendor.vendor_name}
                      </span>
                      <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                    {vendorTypeLabel(vendor.vendor_type_id)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                    {[vendor.city, vendor.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <VendorStatusBadge status={vendor.vendor_status} />
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
