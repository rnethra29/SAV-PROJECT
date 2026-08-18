import type { ReactNode } from "react";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { FolderIcon } from "@/components/ui/icons";
import { DocumentStatusBadge } from "./StatusBadges";
import { formatDate, formatFileSize } from "@/lib/format";
import type { CommercialDocument } from "@/types/commercial/shared";

type DocumentsPanelProps = {
  documents: CommercialDocument[];
  title?: string;
  // Both optional, both additive — omitting them keeps every existing
  // caller's rendered output identical (upload stays disabled, no Actions
  // column). Only a caller with a real, wired document API (e.g. Client
  // Management's GET/POST /documents) passes these.
  onUploadClick?: () => void;
  renderActions?: (doc: CommercialDocument) => ReactNode;
  // Rendered above the table/empty-state when onUploadClick is provided —
  // e.g. an inline upload form toggled by the button.
  uploadSlot?: ReactNode;
};

// Upload is disabled by default — no Supabase Storage integration exists
// yet on the frontend for the Commercial callers of this component (see
// MODULE-1-COMMERCIAL-LIFECYCLE.md Phase 12). Nothing here pretends a file
// was actually persisted unless a caller explicitly wires onUploadClick to
// a real, working upload endpoint.
export function DocumentsPanel({ documents, title = "Documents", onUploadClick, renderActions, uploadSlot }: DocumentsPanelProps) {
  return (
    <Panel className="bg-surface">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        {onUploadClick ? (
          <button
            type="button"
            onClick={onUploadClick}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary transition hover:bg-background"
          >
            Upload Document
          </button>
        ) : (
          <button
            type="button"
            disabled
            title="Document upload — coming soon, no storage backend connected yet"
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Upload Document
          </button>
        )}
      </div>
      {uploadSlot}
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
                {renderActions && <th className="px-5 py-3 font-medium">Actions</th>}
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
                  {renderActions && <td className="px-5 py-3">{renderActions(doc)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
