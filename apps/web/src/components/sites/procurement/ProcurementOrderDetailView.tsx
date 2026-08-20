"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { ProcurementOrderStatusBadge, ProcurementOrderApprovalBadge } from "./ProcurementOrderStatusBadges";
import { ProcurementOrderItemsContainer } from "./ProcurementOrderItemsContainer";
import { ProcurementOrderDocumentsContainer } from "./ProcurementOrderDocumentsContainer";
import { ProcurementOrderStatusActions } from "./ProcurementOrderStatusActions";
import { getProcurementOrderById, getProcurementOrderItems } from "@/lib/sites/procurement-orders-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devGetProcurementOrderById, devGetProcurementOrderItems } from "@/lib/dev-preview/procurement-fixtures";
import { formatCurrency, formatDate } from "@/lib/format";
import type { VndPurchaseOrderDetail, VndPurchaseOrderItem } from "@/types/sites/procurement-order";
import type { VndVendor } from "@/types/sites/vendor";
import type { ClmProjectLookup } from "@/types/sites/project";

type ProcurementOrderDetailViewProps = {
  order: VndPurchaseOrderDetail;
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

function toAmount(value: string): number | null {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function ProcurementOrderDetailView({ order: initialOrder, vendors, projects }: ProcurementOrderDetailViewProps) {
  // Local copy, not the container's own load state: adding a line item
  // changes the header's trigger-maintained subtotal/tax/total on the real
  // backend, so this re-fetches just the PO header (not the whole page)
  // after every item write — see ProcurementOrderItemsContainer's
  // onItemsChanged.
  const [order, setOrder] = useState(initialOrder);
  // A second, lightweight copy of the items list, independent of
  // ProcurementOrderItemsContainer's own — needed here so
  // ProcurementOrderStatusActions can gate "Submit" on hasItems and feed
  // the Receive Goods dialog without reaching into a sibling component's
  // state.
  const [items, setItems] = useState<VndPurchaseOrderItem[]>([]);
  // See ProcurementOrderItemsContainer's refreshSignal prop: bumped on every
  // refreshAll so that container's own independent item fetch picks up
  // changes made by ProcurementOrderStatusActions (specifically Receive
  // Goods writing received_quantity), which it has no other way to learn
  // about — onItemsChanged only fires for changes the container itself made.
  const [itemsRefreshSignal, setItemsRefreshSignal] = useState(0);

  async function refreshOrder() {
    const refreshed = DEV_FIXTURE_MODE ? await devGetProcurementOrderById(order.po_id) : await getProcurementOrderById(order.po_id);
    setOrder(refreshed);
  }

  async function refreshItems() {
    const refreshed = DEV_FIXTURE_MODE
      ? await devGetProcurementOrderItems(order.po_id)
      : await getProcurementOrderItems(order.po_id);
    setItems(refreshed);
  }

  async function refreshAll() {
    await Promise.all([refreshOrder(), refreshItems()]);
    setItemsRefreshSignal((n) => n + 1);
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      refreshItems();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.po_id]);

  const vendor = vendors.find((v) => v.vendor_id === order.vendor_id);
  const project = projects.find((p) => p.project_id === order.project_id);

  return (
    <div className="space-y-6">
      <Panel className="space-y-5 bg-surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{order.po_number}</p>
            <h2 className="text-lg font-semibold text-text-primary">{vendor?.vendor_name ?? "—"}</h2>
            <p className="text-sm text-text-secondary">
              {project ? `${project.project_code} · ${project.project_name}` : "—"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ProcurementOrderStatusBadge status={order.status} />
            <ProcurementOrderApprovalBadge status={order.approval_status} />
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="PO Date" value={formatDate(order.po_date)} />
          <Field label="Expected Delivery" value={order.expected_delivery_date ? formatDate(order.expected_delivery_date) : null} />
          <Field label="Delivery Location" value={order.delivery_location} />
          <Field label="Payment Terms" value={order.payment_terms} />
        </dl>

        <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Subtotal" value={formatCurrency(toAmount(order.subtotal_amount))} />
          <Field label="Discount" value={formatCurrency(toAmount(order.discount_amount))} />
          <Field label="Tax" value={formatCurrency(toAmount(order.tax_amount))} />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Total</dt>
            <dd className="mt-0.5 text-sm font-semibold text-text-primary">{formatCurrency(toAmount(order.total_amount))}</dd>
          </div>
        </dl>

        {order.remarks?.trim() && (
          <div className="border-t border-border pt-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Remarks</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-text-primary">{order.remarks}</dd>
          </div>
        )}

        <ProcurementOrderStatusActions order={order} items={items} onChanged={refreshAll} />
      </Panel>

      <ProcurementOrderItemsContainer poId={order.po_id} onItemsChanged={refreshAll} refreshSignal={itemsRefreshSignal} />

      <ProcurementOrderDocumentsContainer poId={order.po_id} />

      <Link href="/sites/procurement" className="inline-block text-sm font-medium text-secondary hover:underline underline-offset-2">
        ← Back to Purchase Orders
      </Link>
    </div>
  );
}
