import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { ClientStatusBadge } from "./ClientStatusBadge";
import { ClientDocumentsContainer } from "./ClientDocumentsContainer";
import { ClientRequirementsContainer } from "./ClientRequirementsContainer";
import { ClientContactsContainer } from "./ClientContactsContainer";
import { ClientBillingContainer } from "./ClientBillingContainer";
import { ClientRfqProjectsSection } from "./ClientRfqProjectsSection";
import { formatDate } from "@/lib/format";
import type { ClmClientDetail, ClmClientType, ClmIndustry } from "@/types/sites/client";

type ClientDetailViewProps = {
  client: ClmClientDetail;
  clientTypes: ClmClientType[];
  industries: ClmIndustry[];
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

export function ClientDetailView({ client, clientTypes, industries }: ClientDetailViewProps) {
  const clientTypeLabel = clientTypes.find((t) => t.client_type_id === client.client_type_id)?.type_name ?? null;
  const industryLabel = industries.find((i) => i.industry_id === client.industry_id)?.industry_name ?? null;

  return (
    <div className="space-y-6">
      <Panel className="space-y-5 bg-surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{client.client_code}</p>
            <h2 className="text-lg font-semibold text-text-primary">{client.display_name}</h2>
            <p className="text-sm text-text-secondary">{client.legal_name}</p>
          </div>
          <ClientStatusBadge status={client.client_status} />
        </div>

        <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Client Type" value={clientTypeLabel} />
          <Field label="Industry" value={industryLabel} />
          <Field label="Primary Email" value={client.primary_email} />
          <Field label="Primary Phone" value={client.primary_phone} />
          <Field label="GSTIN" value={client.gstin} />
          <Field label="PAN" value={client.pan} />
          <Field label="Onboarding Date" value={client.onboarding_date ? formatDate(client.onboarding_date) : null} />
          <Field label="Created" value={formatDate(client.created_at)} />
        </dl>

        <div className="border-t border-border pt-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Billing Address</dt>
          <dd className="mt-0.5 text-sm text-text-primary">
            {[client.billing_address_line1, client.billing_address_line2, client.billing_city, client.billing_state, client.billing_pincode, client.billing_country]
              .filter(Boolean)
              .join(", ")}
          </dd>
        </div>

        {client.notes?.trim() && (
          <div className="border-t border-border pt-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">Notes</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-text-primary">{client.notes}</dd>
          </div>
        )}
      </Panel>

      <ClientRequirementsContainer clientId={client.client_id} />

      <ClientContactsContainer clientId={client.client_id} />

      <ClientBillingContainer clientId={client.client_id} />

      <ClientDocumentsContainer clientId={client.client_id} />

      <ClientRfqProjectsSection />

      <Link href="/sites/clients" className="inline-block text-sm font-medium text-secondary hover:underline underline-offset-2">
        ← Back to Clients
      </Link>
    </div>
  );
}
