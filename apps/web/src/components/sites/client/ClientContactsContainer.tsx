"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AlertCircleIcon, PlusIcon, UsersIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api-client";
import { createClientContact, getClientContacts, getContactTypeOptions } from "@/lib/sites/client-contacts-api";
import { ClientContactCreateForm } from "./ClientContactCreateForm";
import type { ClmClientContact, ClmClientContactCreateInput, ClmContactType } from "@/types/sites/contact";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; contacts: ClmClientContact[]; contactTypes: ClmContactType[] }
  | { kind: "error"; message: string };

type ClientContactsContainerProps = {
  clientId: string;
};

/**
 * Client 360 Contacts section. Same shape as ClientRequirementsContainer —
 * a list panel with a toggleable inline create form — backed by the real
 * nested GET/POST /clients/:clientId/contacts endpoints
 * (src/routes/clmClient.routes.js:49-56), plus the contact-type lookup
 * (GET /client-lookups/contact-types) the create form's dropdown needs.
 * Client Component because apiFetch's Bearer token only exists in a
 * browser session.
 */
export function ClientContactsContainer({ clientId }: ClientContactsContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [contacts, contactTypes] = await Promise.all([getClientContacts(clientId), getContactTypeOptions()]);
      setState({ kind: "success", contacts, contactTypes });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this client's contacts. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading contacts. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, clientId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  async function handleCreate(input: ClmClientContactCreateInput) {
    await createClientContact(clientId, input);
    setIsFormOpen(false);
    await load();
  }

  if (state.kind === "loading") {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  if (state.kind === "error") {
    return (
      <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
        <AlertCircleIcon className="h-8 w-8 text-danger" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load contacts</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  const { contacts, contactTypes } = state;
  const contactTypeLabel = (contactTypeId: string) =>
    contactTypes.find((type) => type.contact_type_id === contactTypeId)?.type_name ?? "—";

  return (
    <div className="space-y-2">
      <Panel className="bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Contacts</h3>
          <Button variant="ghost" onClick={() => setIsFormOpen((open) => !open)}>
            <PlusIcon className="h-4 w-4" />
            {isFormOpen ? "Cancel" : "Add Contact"}
          </Button>
        </div>

        {contacts.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-8 w-8" />}
            title="No contacts yet"
            description="Add contacts for this client to keep key people and communication details organized."
          />
        ) : (
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
                  <tr
                    key={contact.contact_id}
                    className="border-b border-border last:border-0 hover:bg-background/60"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">{contact.contact_name}</span>
                        {contact.is_primary_contact && <StatusBadge label="Primary" tone="success" />}
                      </div>
                      <div className="text-text-secondary">
                        {[contact.designation, contact.department].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                      {contactTypeLabel(contact.contact_type_id)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{contact.email ?? "—"}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{contact.phone ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {isFormOpen && (
        <ClientContactCreateForm
          contactTypes={contactTypes}
          onSubmit={handleCreate}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
