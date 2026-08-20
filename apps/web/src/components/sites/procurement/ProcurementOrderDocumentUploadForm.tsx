"use client";

import { useRef, useState, type FormEvent } from "react";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { AlertCircleIcon } from "@/components/ui/icons";
import type { DocumentCategory } from "@/types/sites/document";

type ProcurementOrderDocumentUploadFormProps = {
  categories: DocumentCategory[];
  onSubmit: (input: { file: File; documentCategoryId: string; description: string }) => Promise<void>;
  onCancel: () => void;
};

/**
 * Inline upload form for the PO's Documents section — same shape as
 * ClientDocumentUploadForm, real POST /documents (multipart/form-data) via
 * the caller's onSubmit. No fake success — errors thrown by onSubmit are
 * shown inline and the form stays open so the user can retry.
 */
export function ProcurementOrderDocumentUploadForm({ categories, onSubmit, onCancel }: ProcurementOrderDocumentUploadFormProps) {
  const [documentCategoryId, setDocumentCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ file?: string; documentCategoryId?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryOptions = categories.map((c) => ({ value: c.document_category_id, label: c.category_name }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const file = fileInputRef.current?.files?.[0] ?? null;
    const errors: { file?: string; documentCategoryId?: string } = {};
    if (!file) errors.file = "Choose a file to upload.";
    if (!documentCategoryId) errors.documentCategoryId = "Select a document category.";
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0 || !file) return;

    setStatus("submitting");
    try {
      await onSubmit({ file, documentCategoryId, description: description.trim() });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong while uploading. Try again.");
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 border-b border-border bg-background/40 p-5">
      {formError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-3.5 py-3">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm text-text-primary">{formError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="po-document-file" className="block text-sm font-medium text-text-primary">
            File
          </label>
          <input
            id="po-document-file"
            ref={fileInputRef}
            type="file"
            disabled={status === "submitting"}
            className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text-primary"
          />
          {fieldErrors.file && <p className="text-xs text-danger">{fieldErrors.file}</p>}
        </div>

        <Select
          id="po-document-category"
          label="Category"
          placeholder="Select a category"
          options={categoryOptions}
          value={documentCategoryId}
          onChange={(e) => setDocumentCategoryId(e.target.value)}
          error={fieldErrors.documentCategoryId}
          disabled={status === "submitting"}
          required
        />
      </div>

      <TextArea
        id="po-document-description"
        label="Description"
        placeholder="Optional"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={status === "submitting"}
        rows={2}
      />

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={status === "submitting"}>
          Cancel
        </Button>
        <Button type="submit" isLoading={status === "submitting"}>
          {status === "submitting" ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </form>
  );
}
