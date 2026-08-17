import { getRfqById } from "@/modules/commercial-lifecycle/fixtures/rfq";
import { getPurchaseOrderById } from "@/modules/commercial-lifecycle/fixtures/po";

/**
 * Centralized, route-aware breadcrumb source of truth. Add a route here
 * once and every page under it gets a correct breadcrumb for free — no
 * per-page breadcrumb JSX. Mirrors the actual app/(app) route tree; keep
 * the two in sync when routes change.
 */

export type DynamicLabelKey = "rfqNumber" | "poNumber";

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
};

export async function resolveDynamicLabel(key: DynamicLabelKey, id: string): Promise<string | null> {
  return DYNAMIC_LABEL_RESOLVERS[key](id);
}
