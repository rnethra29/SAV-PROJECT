"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon, DownloadIcon } from "@/components/ui/icons";
import { DocumentsPanel } from "@/components/commercial/shared/DocumentsPanel";
import { ApiError } from "@/lib/api-client";
import {
  getClientDocumentDownloadUrl,
  getClientDocuments,
  getDocumentCategoryOptions,
  uploadClientDocument,
} from "@/lib/sites/client-documents-api";
import { ClientDocumentUploadForm } from "./ClientDocumentUploadForm";
import type { CommercialDocument } from "@/types/commercial/shared";
import type { DocumentCategory } from "@/types/sites/document";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; documents: CommercialDocument[]; categories: DocumentCategory[] }
  | { kind: "error"; message: string };

type ClientDocumentsContainerProps = {
  clientId: string;
};

/**
 * Client 360 Documents section. Reuses the existing shared DocumentsPanel
 * (@/components/commercial/shared/DocumentsPanel) for the list/table/empty
 * state — same component the RFQ documents screen uses — with real
 * GET /documents?entityType=Client&entityId=<clientId> data
 * (@/lib/sites/client-documents-api.ts) instead of Commercial's fixtures.
 * Client Component for the same reason as every other Client 360 section:
 * apiFetch's Bearer token only exists in a browser session.
 */
export function ClientDocumentsContainer({ clientId }: ClientDocumentsContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [documents, categories] = await Promise.all([
        getClientDocuments(clientId),
        getDocumentCategoryOptions(),
      ]);
      setState({ kind: "success", documents, categories });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this client's documents. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading documents. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, clientId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  async function handleUpload(input: { file: File; documentCategoryId: string; description: string }) {
    await uploadClientDocument(clientId, input);
    setIsUploadFormOpen(false);
    await load();
  }

  async function handleDownload(doc: CommercialDocument) {
    setDownloadError(null);
    setDownloadingId(doc.id);
    try {
      const url = await getClientDocumentDownloadUrl(doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setDownloadError("Couldn't generate a download link. Try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  if (state.kind === "loading") {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  if (state.kind === "error") {
    return (
      <Panel className="flex flex-col items-center gap-3 bg-surface px-6 py-12 text-center">
        <AlertCircleIcon className="h-8 w-8 text-danger" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary">Couldn&apos;t load documents</p>
          <p className="text-sm text-text-secondary">{state.message}</p>
        </div>
        <Button onClick={load}>Try again</Button>
      </Panel>
    );
  }

  return (
    <div className="space-y-2">
      {downloadError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-3.5 py-3">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm text-text-primary">{downloadError}</p>
        </div>
      )}
      <DocumentsPanel
        documents={state.documents}
        onUploadClick={() => setIsUploadFormOpen((open) => !open)}
        uploadSlot={
          isUploadFormOpen ? (
            <ClientDocumentUploadForm
              categories={state.categories}
              onSubmit={handleUpload}
              onCancel={() => setIsUploadFormOpen(false)}
            />
          ) : undefined
        }
        renderActions={(doc) => (
          <Button
            variant="ghost"
            onClick={() => handleDownload(doc)}
            isLoading={downloadingId === doc.id}
            disabled={downloadingId !== null && downloadingId !== doc.id}
          >
            <DownloadIcon className="h-4 w-4" />
            Download
          </Button>
        )}
      />
    </div>
  );
}
