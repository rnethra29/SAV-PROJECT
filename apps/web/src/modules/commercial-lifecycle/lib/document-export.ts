/**
 * Frontend export/share service boundary for Commercial document previews
 * (BOQ/RFQ/Quotation/PO). This is the one seam every document preview calls
 * through — no page component talks to `window.print`/export/share logic
 * directly. Print is implemented for real using the browser's native print
 * (paired with each document's `print:hidden` chrome and the `.print-document`
 * rules in globals.css). PDF/Excel export and Share have no backend or
 * document-generation service to call yet, so they honestly report
 * unavailable instead of faking a download — swap the bodies of
 * `exportDocument`/`shareDocument` for real calls (a document-generation API,
 * a native share/email/WhatsApp integration) later without touching any
 * caller.
 */

export type CommercialDocumentEntity = "boq" | "rfq" | "quotation" | "po";
export type ExportFormat = "pdf" | "excel";

export type ExportResult = { ok: true } | { ok: false; kind: "service-unavailable"; message: string };
export type ShareResult =
  | { ok: true; via: "web-share" }
  | { ok: false; kind: "cancelled" }
  | { ok: false; kind: "unavailable"; message: string };

const FORMAT_LABEL: Record<ExportFormat, string> = { pdf: "PDF", excel: "Excel" };

export function printDocument(): void {
  if (typeof window !== "undefined") window.print();
}

// TEMPORARY — no document-generation backend exists yet (Module 1 backend
// not built). Replace with a real call once a document-generation service
// exists, e.g. apiFetch(`/${entity}/${documentNumber}/export.${format}`).
export async function exportDocument(
  entity: CommercialDocumentEntity,
  format: ExportFormat,
  documentNumber: string,
): Promise<ExportResult> {
  void entity;
  void documentNumber;
  return {
    ok: false,
    kind: "service-unavailable",
    message: `${FORMAT_LABEL[format]} export isn't connected yet — generating a ${FORMAT_LABEL[format]} file requires a backend document-generation service that hasn't been built. Use Print for now.`,
  };
}

// Uses the Web Share API where the browser supports it (mobile Chrome/Safari,
// some desktop browsers); otherwise reports unavailable rather than faking a
// share sheet, email, or WhatsApp send that doesn't exist yet.
export async function shareDocument(
  entity: CommercialDocumentEntity,
  documentNumber: string,
  url?: string,
): Promise<ShareResult> {
  void entity;
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: documentNumber, url: url ?? window.location.href });
      return { ok: true, via: "web-share" };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { ok: false, kind: "cancelled" };
      }
      return { ok: false, kind: "unavailable", message: "Sharing failed — no other share destination is connected yet." };
    }
  }
  return {
    ok: false,
    kind: "unavailable",
    message:
      "Sharing isn't connected yet — this browser doesn't support native sharing, and no document link/email/WhatsApp/portal service is available yet.",
  };
}
