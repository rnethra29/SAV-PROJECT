"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { SearchIcon, InboxIcon, PlusIcon, ArrowRightIcon } from "@/components/ui/icons";
import { VendorPaymentStatusBadge } from "./VendorPaymentStatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { VndPaymentStatus, VndVendorPayment } from "@/types/sites/vendor-payment";
import type { VndVendor } from "@/types/sites/vendor";

type VendorPaymentListViewProps = {
  payments: VndVendorPayment[];
  vendors: VndVendor[];
};

const PAYMENT_STATUS_OPTIONS: { value: VndPaymentStatus; label: string }[] = [
  { value: "Pending", label: "Pending" },
  { value: "Processed", label: "Processed" },
  { value: "Failed", label: "Failed" },
  { value: "Reversed", label: "Reversed" },
];

function toAmount(value: string): number | null {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function VendorPaymentListView({ payments, vendors }: VendorPaymentListViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VndPaymentStatus>("all");

  const vendorName = (vendorId: string) => vendors.find((v) => v.vendor_id === vendorId)?.vendor_name ?? "—";

  const visiblePayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesStatus = statusFilter === "all" || payment.payment_status === statusFilter;
      const matchesTerm =
        term.length === 0 ||
        payment.payment_reference_number.toLowerCase().includes(term) ||
        vendorName(payment.vendor_id).toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, search, statusFilter, vendors]);

  if (payments.length === 0) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<InboxIcon className="h-8 w-8" />}
          title="No vendor payments yet"
          description="Record the first payment made to a vendor."
          action={
            <Link href="/sites/vendor-payments/new">
              <Button>
                <PlusIcon className="h-4 w-4" />
                Add Vendor Payment
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
            placeholder="Search reference number, vendor…"
            aria-label="Search vendor payments"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          />
        </div>
        <Select
          id="payment-status-filter"
          label="Status"
          labelClassName="sr-only"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | VndPaymentStatus)}
          options={[{ value: "all", label: "All Statuses" }, ...PAYMENT_STATUS_OPTIONS]}
          className="sm:w-48"
        />
      </div>

      {visiblePayments.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-8 w-8" />}
          title="No vendor payments match your search"
          description="Try a different search term, or clear the status filter."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">Reference Number</th>
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">Payment Date</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visiblePayments.map((payment) => (
                <tr
                  key={payment.vendor_payment_id}
                  onClick={() => router.push(`/sites/vendor-payments/${payment.vendor_payment_id}`)}
                  className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-background/60"
                >
                  <td className="px-5 py-3 font-medium">
                    <Link
                      href={`/sites/vendor-payments/${payment.vendor_payment_id}`}
                      className="flex items-center gap-1.5 text-text-primary hover:text-secondary hover:underline underline-offset-2"
                    >
                      {payment.payment_reference_number}
                      <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{vendorName(payment.vendor_id)}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{formatDate(payment.payment_date)}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{payment.payment_method}</td>
                  <td className="px-5 py-3 text-right text-text-primary">{formatCurrency(toAmount(payment.amount))}</td>
                  <td className="px-5 py-3">
                    <VendorPaymentStatusBadge status={payment.payment_status} />
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
