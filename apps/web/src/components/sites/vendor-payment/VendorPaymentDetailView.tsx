"use client";

import { useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { VendorPaymentStatusBadge } from "./VendorPaymentStatusBadge";
import { VendorPaymentAllocationsContainer } from "./VendorPaymentAllocationsContainer";
import { VendorPaymentStatusActions } from "./VendorPaymentStatusActions";
import { getVendorPaymentById } from "@/lib/sites/vendor-payments-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devGetVendorPaymentById } from "@/lib/dev-preview/vendor-payment-fixtures";
import { formatCurrency, formatDate } from "@/lib/format";
import type { VndVendorPaymentDetail } from "@/types/sites/vendor-payment";
import type { VndVendor } from "@/types/sites/vendor";
import type { ClmProjectLookup } from "@/types/sites/project";

type VendorPaymentDetailViewProps = {
  payment: VndVendorPaymentDetail;
  vendors: VndVendor[];
  projects: ClmProjectLookup[];
};

type FieldProps = {
  label: string;
  value: string | null;
};

function Field({ label, value }: FieldProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm text-text-primary">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

export function VendorPaymentDetailView({ payment: initialPayment, vendors, projects }: VendorPaymentDetailViewProps) {
  const [payment, setPayment] = useState(initialPayment);

  async function refreshPayment() {
    const refreshed = DEV_FIXTURE_MODE
      ? await devGetVendorPaymentById(payment.vendor_payment_id)
      : await getVendorPaymentById(payment.vendor_payment_id);
    setPayment(refreshed);
  }

  const vendor = vendors.find((v) => v.vendor_id === payment.vendor_id);
  const project = payment.project_id ? projects.find((p) => p.project_id === payment.project_id) : null;

  return (
    <div className="space-y-6">
      <Panel className="space-y-5 bg-surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{payment.payment_reference_number}</p>
            <h2 className="text-lg font-semibold text-text-primary">{vendor?.vendor_name ?? "—"}</h2>
            <p className="text-sm text-text-secondary">
              {project ? `${project.project_code} · ${project.project_name}` : "Not linked to a project"}
            </p>
          </div>
          <VendorPaymentStatusBadge status={payment.payment_status} />
        </div>

        <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Payment Date" value={formatDate(payment.payment_date)} />
          <Field label="Payment Method" value={payment.payment_method} />
          <Field label="Transaction Reference" value={payment.transaction_reference} />
          <Field label="Approved" value={payment.approved_by ? "Yes" : "Not yet approved"} />
        </dl>

        <div className="border-t border-border pt-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Amount</dt>
          <dd className="mt-0.5 text-sm font-semibold text-text-primary">{formatCurrency(Number(payment.amount))}</dd>
        </div>

        {payment.remarks?.trim() && (
          <div className="border-t border-border pt-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Remarks</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-text-primary">{payment.remarks}</dd>
          </div>
        )}

        <VendorPaymentStatusActions payment={payment} onChanged={refreshPayment} />
      </Panel>

      <VendorPaymentAllocationsContainer paymentId={payment.vendor_payment_id} vendorId={payment.vendor_id} />

      <Link href="/sites/vendor-payments" className="inline-block text-sm font-medium text-secondary hover:underline underline-offset-2">
        ← Back to Vendor Payments
      </Link>
    </div>
  );
}
