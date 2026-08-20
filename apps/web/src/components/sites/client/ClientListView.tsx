"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { SearchIcon, UsersIcon, PlusIcon, ArrowRightIcon } from "@/components/ui/icons";
import { ClientStatusBadge } from "./ClientStatusBadge";
import type { ClmClient } from "@/types/sites/client";

type ClientListViewProps = {
  clients: ClmClient[];
};

export function ClientListView({ clients }: ClientListViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const visibleClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (client) =>
        client.client_code.toLowerCase().includes(term) ||
        client.display_name.toLowerCase().includes(term) ||
        client.legal_name.toLowerCase().includes(term),
    );
  }, [clients, search]);

  if (clients.length === 0) {
    return (
      <Panel className="bg-surface">
        <EmptyState
          icon={<UsersIcon className="h-8 w-8" />}
          title="No clients yet"
          description="Create your first client to start managing client relationships."
          action={
            <Link href="/sites/clients/new">
              <Button>
                <PlusIcon className="h-4 w-4" />
                Add Client
              </Button>
            </Link>
          }
        />
      </Panel>
    );
  }

  return (
    <Panel className="bg-surface">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client code, name…"
            aria-label="Search clients"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {visibleClients.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-8 w-8" />}
          title="No clients match your search"
          description="Try a different search term."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">Client Code</th>
                <th className="px-5 py-3 font-medium">Client Name</th>
                <th className="px-5 py-3 font-medium">Primary Contact</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleClients.map((client) => (
                <tr
                  key={client.client_id}
                  onClick={() => router.push(`/sites/clients/${client.client_id}`)}
                  className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-background/60"
                >
                  <td className="px-5 py-3 font-medium text-text-primary">
                    <Link
                      href={`/sites/clients/${client.client_id}`}
                      className="hover:text-secondary hover:underline underline-offset-2"
                    >
                      {client.client_code}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/sites/clients/${client.client_id}`} className="flex items-center gap-1.5">
                      <div>
                        <div className="text-text-primary group-hover:text-secondary group-hover:underline underline-offset-2">
                          {client.display_name}
                        </div>
                        <div className="text-text-secondary">{client.legal_name}</div>
                      </div>
                      <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                    <div>{client.primary_email}</div>
                    <div>{client.primary_phone}</div>
                  </td>
                  <td className="px-5 py-3">
                    <ClientStatusBadge status={client.client_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
