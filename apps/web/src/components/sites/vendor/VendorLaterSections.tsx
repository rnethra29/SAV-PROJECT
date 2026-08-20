import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { ArrowRightIcon } from "@/components/ui/icons";

type RelatedRecordsLink = {
  title: string;
  description: string;
  href: string;
};

// Purchase Orders, Vendor Invoices and Vendor Payments (doc §6.11-6.16)
// each have their own full list/detail/create workspace under Sites — not
// embedded as Vendor 360 tabs, matching the real nested-vs-top-level REST
// shape (GET /vendors/:vendorId/{contacts,bank-accounts,materials,ratings}
// are nested; procurement-orders/vendor-invoices/vendor-payments are their
// own top-level resources, src/routes/index.js). This links out rather
// than duplicating those screens inline. (Performance/Ratings, previously
// listed here as not-yet-built, is now a real Vendor 360 section above —
// see VendorPerformanceContainer.)
const LINKS: RelatedRecordsLink[] = [
  {
    title: "Purchase Orders",
    description: "vnd_purchase_order — procurement PO history across all vendors, filterable by vendor.",
    href: "/sites/procurement",
  },
  {
    title: "Vendor Invoices",
    description: "vnd_vendor_invoice — invoices received from vendors, filterable by vendor.",
    href: "/sites/vendor-invoices",
  },
  {
    title: "Vendor Payments",
    description: "vnd_vendor_payment — payments made to vendors, filterable by vendor.",
    href: "/sites/vendor-payments",
  },
];

export function VendorLaterSections() {
  return (
    <Panel className="bg-surface">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-text-primary">Related Records</h3>
      </div>
      <ul className="divide-y divide-border">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="group flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-background/60">
              <div>
                <p className="text-sm font-medium text-text-primary group-hover:text-secondary">{link.title}</p>
                <p className="text-xs text-text-secondary">{link.description}</p>
              </div>
              <ArrowRightIcon className="h-4 w-4 shrink-0 text-text-secondary transition group-hover:translate-x-0.5 group-hover:text-secondary" />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
