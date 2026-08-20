"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { VendorInvoiceStatusBadge } from "./VendorInvoiceStatusBadge";
import { VendorInvoiceItemsContainer } from "./VendorInvoiceItemsContainer";
import { VendorInvoiceStatusActions } from "./VendorInvoiceStatusActions";
import { getVendorInvoiceById, getVendorInvoiceSummary } from "@/lib/sites/vendor-invoices-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devGetVendorInvoiceById, devGetVendorInvoiceSummary } from "@/lib/dev-preview/vendor-invoice-fixtures";
import { formatCurrency, formatDate } from "@/lib/format";
import type { VndVendorInvoiceDetail, VndVendorInvoiceSummary } from "@/types/sites/vendor-invoice";
import type { VndVendor } from "@/types/sites/vendor";
import type { ClmProjectLookup } from "@/types/sites/project";
import type { VndPurchaseOrder } from "@/types/sites/procurement-order";

type VendorInvoiceDetailViewProps = {
  invoice: VndVendorInvoiceDetail;
  vendors: VndVendor[];
  projects: ClmProjectLookup[];
  purchaseOrders: VndPurchaseOrder[];
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

function toAmount(value: string): number | null {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function VendorInvoiceDetailView({ invoice: initialInvoice, vendors, projects, purchaseOrders }: VendorInvoiceDetailViewProps) {
  const [invoice, setInvoice] = useState(initialInvoice);
  const [summary, setSummary] = useState<VndVendorInvoiceSummary | null>(null);

  async function refreshInvoice() {
    const refreshed = DEV_FIXTURE_MODE
      ? await devGetVendorInvoiceById(invoice.vendor_invoice_id)
      : await getVendorInvoiceById(invoice.vendor_invoice_id);
    setInvoice(refreshed);
  }

  async function refreshSummary() {
    const refreshed = DEV_FIXTURE_MODE
      ? await devGetVendorInvoiceSummary(invoice.vendor_invoice_id)
      : await getVendorInvoiceSummary(invoice.vendor_invoice_id);
    setSummary(refreshed);
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      refreshSummary();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice.vendor_invoice_id]);

  async function refreshAll() {
    await Promise.all([refreshInvoice(), refreshSummary()]);
  }

  const vendor = vendors.find((v) => v.vendor_id === invoice.vendor_id);
  const project = projects.find((p) => p.project_id === invoice.project_id);
  const purchaseOrder = purchaseOrders.find((po) => po.po_id === invoice.purchase_order_id);

  return (
    <div className="space-y-6">
      <Panel className="space-y-5 bg-surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{invoice.invoice_number}</p>
            <h2 className="text-lg font-semibold text-text-primary">{vendor?.vendor_name ?? "—"}</h2>
            <p className="text-sm text-text-secondary">
              {project ? `${project.project_code} · ${project.project_name}` : "—"}
            </p>
          </div>
          <VendorInvoiceStatusBadge status={invoice.status} />
        </div>

        <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Invoice Date" value={formatDate(invoice.invoice_date)} />
          <Field label="Due Date" value={invoice.due_date ? formatDate(invoice.due_date) : null} />
          <Field label="Purchase Order" value={purchaseOrder?.po_number ?? (invoice.purchase_order_id ? "—" : "Not linked to a PO")} />
          <Field
            label="Verified"
            value={invoice.verified_at ? formatDate(invoice.verified_at) : null}
          />
        </dl>

        <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Subtotal" value={formatCurrency(toAmount(invoice.subtotal_amount))} />
          <Field label="Tax" value={formatCurrency(toAmount(invoice.tax_amount))} />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Total</dt>
            <dd className="mt-0.5 text-sm font-semibold text-text-primary">{formatCurrency(toAmount(invoice.total_amount))}</dd>
          </div>
          {summary && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Balance Due</dt>
              <dd className="mt-0.5 text-sm font-semibold text-text-primary">{formatCurrency(toAmount(summary.balance_amount))}</dd>
            </div>
          )}
        </dl>

        {invoice.remarks?.trim() && (
          <div className="border-t border-border pt-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Remarks</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-text-primary">{invoice.remarks}</dd>
          </div>
        )}

        <VendorInvoiceStatusActions invoice={invoice} onChanged={refreshAll} />
      </Panel>

      <VendorInvoiceItemsContainer invoiceId={invoice.vendor_invoice_id} purchaseOrderId={invoice.purchase_order_id} />

      <Link href="/sites/vendor-invoices" className="inline-block text-sm font-medium text-secondary hover:underline underline-offset-2">
        ← Back to Vendor Invoices
      </Link>
    </div>
  );
}
