import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UsersIcon } from "@/components/ui/icons";
import type { ClmClientContact, ClmContactType } from "@/types/sites/contact";

type ClientContactsListViewProps = {
  contacts: ClmClientContact[];
  contactTypes: ClmContactType[];
};

/**
 * Pure list/table rendering for the Contacts section, extracted out of
 * ClientContactsContainer so it can be reused wherever loaded contacts data
 * is already available (e.g. a development preview) — same List/Detail
 * split already used for ClientListContainer/ClientListView.
 */
export function ClientContactsListView({ contacts, contactTypes }: ClientContactsListViewProps) {
  const contactTypeLabel = (contactTypeId: string) =>
    contactTypes.find((type) => type.contact_type_id === contactTypeId)?.type_name ?? "—";

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon className="h-8 w-8" />}
        title="No contacts yet"
        description="Add contacts for this client to keep key people and communication details organized."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-secondary">
          <tr>
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-5 py-3 font-medium">Type</th>
            <th className="px-5 py-3 font-medium">Email</th>
            <th className="px-5 py-3 font-medium">Phone</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.contact_id} className="border-b border-border last:border-0 hover:bg-background/60">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{contact.contact_name}</span>
                  {contact.is_primary_contact && <StatusBadge label="Primary" tone="success" />}
                </div>
                <div className="text-text-secondary">
                  {[contact.designation, contact.department].filter(Boolean).join(" · ") || "—"}
                </div>
              </td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{contactTypeLabel(contact.contact_type_id)}</td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{contact.email ?? "—"}</td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{contact.phone ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
