"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { SearchIcon, InboxIcon, PlusIcon, ArrowRightIcon } from "@/components/ui/icons";
import { VendorInvoiceStatusBadge } from "./VendorInvoiceStatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { VndInvoiceStatus, VndVendorInvoice } from "@/types/sites/vendor-invoice";
import type { VndVendor } from "@/types/sites/vendor";
import type { ClmProjectLookup } from "@/types/sites/project";

type VendorInvoiceListViewProps = {
  invoices: VndVendorInvoice[];
  vendors: VndVendor[];
  projects: ClmProjectLookup[];
};

const INVOICE_STATUS_OPTIONS: { value: VndInvoiceStatus; label: string }[] = [
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Submitted" },
  { value: "Verified", label: "Verified" },
  { value: "Approved", label: "Approved" },
  { value: "Partially Paid", label: "Partially Paid" },
  { value: "Paid", label: "Paid" },
  { value: "Disputed", label: "Disputed" },
  { value: "Cancelled", label: "Cancelled" },
];

function toAmount(value: string): number | null {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function VendorInvoiceListView({ invoices, vendors, projects }: VendorInvoiceListViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VndInvoiceStatus>("all");

  const vendorName = (vendorId: string) => vendors.find((v) => v.vendor_id === vendorId)?.vendor_name ?? "—";
  const projectLabel = (projectId: string) => {
    const project = projects.find((p) => p.project_id === projectId);
    return project ? `${project.project_code} · ${project.project_name}` : "—";
  };

  const visibleInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      const matchesTerm =
        term.length === 0 ||
        invoice.invoice_number.toLowerCase().includes(term) ||
        vendorName(invoice.vendor_id).toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, search, statusFilter, vendors]);

  if (invoices.length === 0) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<InboxIcon className="h-8 w-8" />}
          title="No vendor invoices yet"
          description="Record the first invoice received from a vendor."
          action={
            <Link href="/sites/vendor-invoices/new">
              <Button>
                <PlusIcon className="h-4 w-4" />
                Add Vendor Invoice
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
            placeholder="Search invoice number, vendor…"
            aria-label="Search vendor invoices"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          />
        </div>
        <Select
          id="invoice-status-filter"
          label="Status"
          labelClassName="sr-only"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | VndInvoiceStatus)}
          options={[{ value: "all", label: "All Statuses" }, ...INVOICE_STATUS_OPTIONS]}
          className="sm:w-52"
        />
      </div>

      {visibleInvoices.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-8 w-8" />}
          title="No vendor invoices match your search"
          description="Try a different search term, or clear the status filter."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">Invoice Number</th>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">Invoice Date</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleInvoices.map((invoice) => (
                <tr
                  key={invoice.vendor_invoice_id}
                  onClick={() => router.push(`/sites/vendor-invoices/${invoice.vendor_invoice_id}`)}
                  className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-background/60"
                >
                  <td className="px-5 py-3 font-medium">
                    <Link
                      href={`/sites/vendor-invoices/${invoice.vendor_invoice_id}`}
                      className="flex items-center gap-1.5 text-text-primary hover:text-secondary hover:underline underline-offset-2"
                    >
                      {invoice.invoice_number}
                      <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{projectLabel(invoice.project_id)}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{vendorName(invoice.vendor_id)}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{formatDate(invoice.invoice_date)}</td>
                  <td className="px-5 py-3 text-right text-text-primary">{formatCurrency(toAmount(invoice.total_amount))}</td>
                  <td className="px-5 py-3">
                    <VendorInvoiceStatusBadge status={invoice.status} />
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
