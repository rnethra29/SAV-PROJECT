import { getRfqById } from "@/lib/fixtures/rfq";
import { getPurchaseOrderById } from "@/lib/fixtures/po";
import { getClientById } from "@/lib/sites/clients-api";
import { getVendorById } from "@/lib/sites/vendors-api";
import { getProcurementOrderById } from "@/lib/sites/procurement-orders-api";
import { getVendorInvoiceById } from "@/lib/sites/vendor-invoices-api";
import { getVendorPaymentById } from "@/lib/sites/vendor-payments-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import { devGetVendorById } from "@/lib/dev-preview/vendor-fixtures";
import { devGetProcurementOrderById } from "@/lib/dev-preview/procurement-fixtures";
import { devGetVendorInvoiceById } from "@/lib/dev-preview/vendor-invoice-fixtures";
import { devGetVendorPaymentById } from "@/lib/dev-preview/vendor-payment-fixtures";

/**
 * Centralized, route-aware breadcrumb source of truth. Add a route here
 * once and every page under it gets a correct breadcrumb for free — no
 * per-page breadcrumb JSX. Mirrors the actual app/(app) route tree; keep
 * the two in sync when routes change.
 */

export type DynamicLabelKey =
  | "rfqNumber"
  | "poNumber"
  | "clientName"
  | "vendorName"
  | "procurementPoNumber"
  | "vendorInvoiceNumber"
  | "vendorPaymentReferenceNumber";

type RouteNode = {
  // Static label for this segment. Omitted for dynamic (":id") nodes,
  // whose label is resolved at render time via dynamicKey instead.
  label?: string;
  dynamicKey?: DynamicLabelKey;
  children?: Record<string, RouteNode>;
  // Section-level nodes (e.g. "commercial") are already identified by the
  // sidebar's active-state highlighting — a breadcrumb crumb for them is
  // pure noise. `hidden` skips pushing a crumb for this segment while still
  // descending into its children, so deeper pages keep their real hierarchy.
  hidden?: boolean;
};

const RFQ_WORKSPACE_TABS: Record<string, RouteNode> = {
  items: { label: "Items" },
  documents: { label: "Documents" },
  approvals: { label: "Approvals" },
  audit: { label: "Audit" },
  revisions: { label: "Revisions" },
  estimation: { label: "Estimation" },
  "market-price": { label: "Market Price Analysis" },
  "actual-price": { label: "Actual Price" },
  comparison: { label: "Actual vs Quoted" },
  profit: { label: "Profit Analysis" },
  quotation: { label: "Quotation" },
  negotiation: { label: "Negotiation" },
  boq: { label: "BOQ" },
  po: { label: "Purchase Order" },
};

const ROUTE_TREE: Record<string, RouteNode> = {
  dashboard: { label: "Dashboard" },
  commercial: {
    label: "Commercial",
    hidden: true,
    children: {
      rfq: {
        label: "RFQ",
        children: {
          new: { label: "New RFQ" },
          ":id": { dynamicKey: "rfqNumber", children: RFQ_WORKSPACE_TABS },
        },
      },
      estimation: { label: "Estimation" },
      "market-price": { label: "Market Price Analysis" },
      "actual-vs-quoted": { label: "Actual vs Quoted" },
      "profit-analysis": { label: "Profit Analysis" },
      quotations: { label: "Quotations" },
      negotiations: { label: "Negotiations" },
      boq: { label: "BOQ" },
      po: {
        label: "Purchase Orders",
        children: {
          ":id": { dynamicKey: "poNumber" },
        },
      },
    },
  },
  sites: {
    label: "Sites",
    hidden: true,
    children: {
      clients: {
        label: "Clients",
        children: {
          new: { label: "New Client" },
          ":id": { dynamicKey: "clientName" },
        },
      },
      vendors: {
        label: "Vendors",
        children: {
          new: { label: "New Vendor" },
          ":id": { dynamicKey: "vendorName" },
        },
      },
      procurement: {
        label: "Purchase Orders",
        children: {
          new: { label: "New Purchase Order" },
          ":id": { dynamicKey: "procurementPoNumber" },
        },
      },
      "vendor-invoices": {
        label: "Vendor Invoices",
        children: {
          new: { label: "New Vendor Invoice" },
          ":id": { dynamicKey: "vendorInvoiceNumber" },
        },
      },
      "vendor-payments": {
        label: "Vendor Payments",
        children: {
          new: { label: "New Vendor Payment" },
          ":id": { dynamicKey: "vendorPaymentReferenceNumber" },
        },
      },
    },
  },
};

export type BreadcrumbCrumb = {
  label: string;
  href: string;
  dynamicKey?: DynamicLabelKey;
  id?: string;
};

function fallbackLabelForId(segment: string): string {
  // Fixture ids are lowercase mirrors of their human-readable business
  // number (e.g. "rfq-2026-0042" / "RFQ-2026-0042") — uppercasing gives an
  // honest, readable label to show for the instant before the async
  // fixture lookup resolves (or if it never resolves, e.g. a bad id).
  return segment.toUpperCase();
}

/** Pure, framework-agnostic: builds the crumb trail for a pathname. */
export function buildBreadcrumbTrail(pathname: string): BreadcrumbCrumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ label: "Dashboard", href: "/dashboard" }];
  }

  const crumbs: BreadcrumbCrumb[] = [];
  let nodes: Record<string, RouteNode> | undefined = ROUTE_TREE;
  let hrefAcc = "";

  for (const segment of segments) {
    if (!nodes) break;
    const key = segment in nodes ? segment : ":id" in nodes ? ":id" : undefined;
    if (!key) break;

    const node: RouteNode = nodes[key];
    hrefAcc += `/${segment}`;

    if (!node.hidden) {
      if (key === ":id") {
        crumbs.push({
          label: fallbackLabelForId(segment),
          href: hrefAcc,
          dynamicKey: node.dynamicKey,
          id: segment,
        });
      } else {
        crumbs.push({ label: node.label ?? segment, href: hrefAcc });
      }
    }

    nodes = node.children;
  }

  // "/commercial" alone has no further segment, but still needs a final
  // "Overview" crumb distinct from the "Commercial" section crumb.
  if (pathname === "/commercial") {
    crumbs.push({ label: "Overview", href: "/commercial" });
  }

  return crumbs;
}

const DYNAMIC_LABEL_RESOLVERS: Record<DynamicLabelKey, (id: string) => Promise<string | null>> = {
  rfqNumber: async (id) => (await getRfqById(id))?.rfqNumber ?? null,
  poNumber: async (id) => (await getPurchaseOrderById(id))?.poNumber ?? null,
  // Real backend call (GET /clients/:id), unlike the fixture-backed
  // resolvers above — clm_client has no fixture layer by design (see
  // lib/sites/clients-api.ts). A failed/unauthenticated lookup here just
  // means the fallback uppercased-id label stays up; the page body's own
  // ClientDetailContainer is the one place that surfaces that failure.
  clientName: async (id) => {
    try {
      const client = await getClientById(id);
      return client.display_name;
    } catch {
      return null;
    }
  },
  // Fixture-aware like clientName, but checks DEV_FIXTURE_MODE first rather
  // than always hitting the real backend — the fixture store never throws
  // on a real-looking id the way an unauthenticated real call would, so
  // checking the mode first avoids a pointless network attempt in dev.
  vendorName: async (id) => {
    try {
      const vendor = DEV_FIXTURE_MODE ? await devGetVendorById(id) : await getVendorById(id);
      return vendor.vendor_name;
    } catch {
      return null;
    }
  },
  procurementPoNumber: async (id) => {
    try {
      const order = DEV_FIXTURE_MODE ? await devGetProcurementOrderById(id) : await getProcurementOrderById(id);
      return order.po_number;
    } catch {
      return null;
    }
  },
  vendorInvoiceNumber: async (id) => {
    try {
      const invoice = DEV_FIXTURE_MODE ? await devGetVendorInvoiceById(id) : await getVendorInvoiceById(id);
      return invoice.invoice_number;
    } catch {
      return null;
    }
  },
  vendorPaymentReferenceNumber: async (id) => {
    try {
      const payment = DEV_FIXTURE_MODE ? await devGetVendorPaymentById(id) : await getVendorPaymentById(id);
      return payment.payment_reference_number;
    } catch {
      return null;
    }
  },
};

export async function resolveDynamicLabel(key: DynamicLabelKey, id: string): Promise<string | null> {
  return DYNAMIC_LABEL_RESOLVERS[key](id);
}
