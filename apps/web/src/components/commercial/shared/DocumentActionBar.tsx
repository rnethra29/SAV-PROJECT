"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PrinterIcon, DownloadIcon, ShareIcon } from "@/components/ui/icons";
import { ServiceUnavailableNotice } from "@/components/commercial/shared/ServiceUnavailableNotice";
import {
  printDocument,
  exportDocument,
  shareDocument,
  type CommercialDocumentEntity,
  type ExportFormat,
} from "@/lib/commercial/document-export";

type DocumentActionBarProps = {
  entity: CommercialDocumentEntity;
  documentNumber: string;
  shareUrl?: string;
};

type Pending = ExportFormat | "share" | null;

// Reused by every Commercial document preview (BOQ/RFQ/Quotation/PO) —
// pages call through this + lib/commercial/document-export.ts rather than
// embedding print/export/share logic inline. `print:hidden` so the bar never
// shows up in the printed/exported output itself.
export function DocumentActionBar({ entity, documentNumber, shareUrl }: DocumentActionBarProps) {
  const [pending, setPending] = useState<Pending>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleExport(format: ExportFormat) {
    setNotice(null);
    setPending(format);
    const result = await exportDocument(entity, format, documentNumber);
    setPending(null);
    if (!result.ok) setNotice(result.message);
  }

  async function handleShare() {
    setNotice(null);
    setPending("share");
    const result = await shareDocument(entity, documentNumber, shareUrl);
    setPending(null);
    if (!result.ok && result.kind === "unavailable") setNotice(result.message);
  }

  return (
    <div className="space-y-3 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" onClick={printDocument}>
          <PrinterIcon className="h-4 w-4" />
          Print
        </Button>
        <Button type="button" variant="ghost" onClick={() => handleExport("pdf")} disabled={pending !== null}>
          <DownloadIcon className="h-4 w-4" />
          {pending === "pdf" ? "Exporting…" : "Export PDF"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => handleExport("excel")} disabled={pending !== null}>
          <DownloadIcon className="h-4 w-4" />
          {pending === "excel" ? "Exporting…" : "Export Excel"}
        </Button>
        <Button type="button" variant="ghost" onClick={handleShare} disabled={pending !== null}>
          <ShareIcon className="h-4 w-4" />
          {pending === "share" ? "Sharing…" : "Share"}
        </Button>
      </div>
      {notice && <ServiceUnavailableNotice message={notice} />}
    </div>
  );
}
