import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { FolderIcon } from "@/components/ui/icons";
import { DocumentStatusBadge } from "./StatusBadges";
import { formatDate } from "@/lib/format";
import type { CommercialDocument } from "@/types/commercial/shared";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type DocumentsPanelProps = {
  documents: CommercialDocument[];
  title?: string;
};

// Upload is intentionally disabled — no Supabase Storage integration exists
// yet on the frontend (see MODULE-1-COMMERCIAL-LIFECYCLE.md Phase 12).
// Nothing here pretends a file was actually persisted.
export function DocumentsPanel({ documents, title = "Documents" }: DocumentsPanelProps) {
  return (
    <Panel className="bg-surface">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        <button
          type="button"
          disabled
          title="Document upload — coming soon, no storage backend connected yet"
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Upload Document
        </button>
      </div>
      {documents.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="h-8 w-8" />}
          title="No documents yet"
          description="Documents attached to this record will appear here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">File</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">Size</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-border transition-colors last:border-0 hover:bg-background/60">
                  <td className="px-5 py-3">
                    <div className="font-medium text-text-primary">{doc.fileName}</div>
                    {doc.description && <div className="text-text-secondary">{doc.description}</div>}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">v{doc.versionNo}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                    {formatFileSize(doc.fileSizeBytes)}
                  </td>
                  <td className="px-5 py-3">
                    <DocumentStatusBadge status={doc.status} />
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{formatDate(doc.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
