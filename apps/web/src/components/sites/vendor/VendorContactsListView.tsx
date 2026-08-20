import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UsersIcon } from "@/components/ui/icons";
import type { VndVendorContact } from "@/types/sites/vendor-contact";

type VendorContactsListViewProps = {
  contacts: VndVendorContact[];
};

/**
 * Pure list/table rendering for the Vendor Contacts section, mirrors
 * ClientContactsListView's List/Detail split.
 */
export function VendorContactsListView({ contacts }: VendorContactsListViewProps) {
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon className="h-8 w-8" />}
        title="No contacts yet"
        description="Add contacts for this vendor to keep key people and communication details organized."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-secondary">
          <tr>
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-5 py-3 font-medium">Role</th>
            <th className="px-5 py-3 font-medium">Mobile</th>
            <th className="px-5 py-3 font-medium">Email</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.vendor_contact_id} className="border-b border-border last:border-0 hover:bg-background/60">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{contact.contact_name}</span>
                  {contact.is_primary_contact && <StatusBadge label="Primary" tone="success" />}
                </div>
                <div className="text-text-secondary">{contact.designation ?? "—"}</div>
              </td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{contact.contact_role}</td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{contact.mobile_number}</td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{contact.email ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
