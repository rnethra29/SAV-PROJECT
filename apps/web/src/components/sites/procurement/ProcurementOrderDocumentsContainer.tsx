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
  getProcurementOrderDocumentDownloadUrl,
  getProcurementOrderDocuments,
  uploadProcurementOrderDocument,
} from "@/lib/sites/procurement-order-documents-api";
import { getDocumentCategoryOptions } from "@/lib/sites/client-documents-api";
import { DEV_FIXTURE_MODE } from "@/lib/dev-preview/dev-mode";
import {
  devGetProcurementOrderDocumentDownloadUrl,
  devGetProcurementOrderDocuments,
  devUploadProcurementOrderDocument,
} from "@/lib/dev-preview/procurement-fixtures";
import { devGetDocumentCategoryOptions } from "@/lib/dev-preview/client-fixtures";
import { ProcurementOrderDocumentUploadForm } from "./ProcurementOrderDocumentUploadForm";
import type { CommercialDocument } from "@/types/commercial/shared";
import type { DocumentCategory } from "@/types/sites/document";

type LoadState =
  | { kind: "loading" }
  | { kind: "success"; documents: CommercialDocument[]; categories: DocumentCategory[] }
  | { kind: "error"; message: string };

type ProcurementOrderDocumentsContainerProps = {
  poId: string;
};

/**
 * PO workspace Documents section. Reuses the existing shared DocumentsPanel
 * (@/components/commercial/shared/DocumentsPanel) for the list/table/empty
 * state — same component Client 360 and the RFQ documents screen already
 * use — with entity_type='ProcurementPO' data
 * (@/lib/sites/procurement-order-documents-api.ts). document-category
 * lookup is shared across every entity type (com_document_category), so
 * this reuses getDocumentCategoryOptions/devGetDocumentCategoryOptions
 * rather than duplicating it.
 */
export function ProcurementOrderDocumentsContainer({ poId }: ProcurementOrderDocumentsContainerProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [documents, categories] = DEV_FIXTURE_MODE
        ? await Promise.all([devGetProcurementOrderDocuments(poId), devGetDocumentCategoryOptions()])
        : await Promise.all([getProcurementOrderDocuments(poId), getDocumentCategoryOptions()]);
      setState({ kind: "success", documents, categories });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setState({
          kind: "error",
          message: "Your account doesn't have permission to view this purchase order's documents. Contact an administrator.",
        });
        return;
      }
      setState({
        kind: "error",
        message: "Something went wrong while loading documents. Try again, and contact support if the problem continues.",
      });
    }
  }, [router, poId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  async function handleUpload(input: { file: File; documentCategoryId: string; description: string }) {
    if (DEV_FIXTURE_MODE) {
      await devUploadProcurementOrderDocument(poId, input);
    } else {
      await uploadProcurementOrderDocument(poId, input);
    }
    setIsUploadFormOpen(false);
    await load();
  }

  async function handleDownload(doc: CommercialDocument) {
    setDownloadError(null);
    setDownloadingId(doc.id);
    try {
      const url = DEV_FIXTURE_MODE
        ? await devGetProcurementOrderDocumentDownloadUrl()
        : await getProcurementOrderDocumentDownloadUrl(doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setDownloadError(
        DEV_FIXTURE_MODE
          ? "Document download isn't available in development fixture mode — no file storage is connected."
          : "Couldn't generate a download link. Try again.",
      );
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
            <ProcurementOrderDocumentUploadForm
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
