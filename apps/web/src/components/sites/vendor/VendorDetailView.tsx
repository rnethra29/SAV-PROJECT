import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { VendorStatusBadge } from "./VendorStatusBadge";
import { VendorContactsContainer } from "./VendorContactsContainer";
import { VendorBankAccountsContainer } from "./VendorBankAccountsContainer";
import { VendorMaterialsContainer } from "./VendorMaterialsContainer";
import { VendorPerformanceContainer } from "./VendorPerformanceContainer";
import { VendorLaterSections } from "./VendorLaterSections";
import { formatDate } from "@/lib/format";
import type { VndVendorDetail, VndVendorType } from "@/types/sites/vendor";

type VendorDetailViewProps = {
  vendor: VndVendorDetail;
  vendorTypes: VndVendorType[];
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

export function VendorDetailView({ vendor, vendorTypes }: VendorDetailViewProps) {
  const vendorTypeLabel = vendorTypes.find((t) => t.vendor_type_id === vendor.vendor_type_id)?.type_name ?? null;

  return (
    <div className="space-y-6">
      <Panel className="space-y-5 bg-surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{vendor.vendor_code}</p>
            <h2 className="text-lg font-semibold text-text-primary">{vendor.vendor_name}</h2>
            <p className="text-sm text-text-secondary">{[vendor.city, vendor.state].filter(Boolean).join(", ")}</p>
          </div>
          <VendorStatusBadge status={vendor.vendor_status} />
        </div>

        <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Vendor Type" value={vendorTypeLabel} />
          <Field label="Company Type" value={vendor.company_type} />
          <Field label="GSTIN" value={vendor.gst_number} />
          <Field label="PAN" value={vendor.pan_number} />
          <Field label="MSME Registered" value={vendor.msme_status ? (vendor.msme_number ?? "Yes") : "No"} />
          <Field label="TDS Applicable" value={vendor.tds_applicable ? (vendor.tds_category ?? "Yes") : "No"} />
          <Field label="Registration Date" value={vendor.registration_date ? formatDate(vendor.registration_date) : null} />
          <Field label="Created" value={formatDate(vendor.created_at)} />
        </dl>

        <div className="border-t border-border pt-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Address</dt>
          <dd className="mt-0.5 text-sm text-text-primary">
            {[vendor.address_line1, vendor.address_line2, vendor.city, vendor.state, vendor.pincode, vendor.country]
              .filter(Boolean)
              .join(", ")}
          </dd>
        </div>

        {vendor.website?.trim() && (
          <div className="border-t border-border pt-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Website</dt>
            <dd className="mt-0.5 text-sm text-text-primary">{vendor.website}</dd>
          </div>
        )}

        {vendor.notes?.trim() && (
          <div className="border-t border-border pt-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Notes</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-text-primary">{vendor.notes}</dd>
          </div>
        )}
      </Panel>

      <VendorContactsContainer vendorId={vendor.vendor_id} />

      <VendorBankAccountsContainer vendorId={vendor.vendor_id} />

      <VendorMaterialsContainer vendorId={vendor.vendor_id} />

      <VendorPerformanceContainer vendorId={vendor.vendor_id} />

      <VendorLaterSections />

      <Link href="/sites/vendors" className="inline-block text-sm font-medium text-secondary hover:underline underline-offset-2">
        ← Back to Vendors
      </Link>
    </div>
  );
}
