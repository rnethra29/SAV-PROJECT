"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { LayersIcon, TrashIcon, CopyIcon, ArrowUpIcon, ArrowDownIcon, PlusIcon } from "@/components/ui/icons";
import type { ItemCategoryOption } from "@/modules/commercial-lifecycle/fixtures/item-categories";

// Mirrors com_rfq_items (Phase 5.2) minus id/rfqId, which are assigned on
// save. "Header" rows (S.No like "2", "3" grouping child items) carry no
// quantity — same isHeaderRfqItem() convention already used to render the
// read-only item tree (lib/fixtures/rfq.ts).
export type DraftRfqItem = {
  key: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  categoryId: string | null;
  remarks: string;
  isHeader: boolean;
};

export function newDraftItem(overrides: Partial<DraftRfqItem> = {}): DraftRfqItem {
  return {
    key: `item-${Math.random().toString(36).slice(2, 10)}`,
    itemCode: "",
    description: "",
    unit: "",
    quantity: 0,
    categoryId: null,
    remarks: "",
    isHeader: false,
    ...overrides,
  };
}

type RfqItemsEditorProps = {
  items: DraftRfqItem[];
  categories: ItemCategoryOption[];
  onChange: (items: DraftRfqItem[]) => void;
};

const fieldClasses =
  "w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-secondary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-background disabled:opacity-60";

export function RfqItemsEditor({ items, categories, onChange }: RfqItemsEditorProps) {
  function updateItem(key: string, patch: Partial<DraftRfqItem>) {
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function addItem(isHeader: boolean) {
    onChange([...items, newDraftItem({ isHeader })]);
  }

  function duplicateItem(key: string) {
    const index = items.findIndex((item) => item.key === key);
    if (index === -1) return;
    const clone = newDraftItem({ ...items[index], key: undefined });
    const next = [...items];
    next.splice(index + 1, 0, clone);
    onChange(next);
  }

  function removeItem(key: string) {
    onChange(items.filter((item) => item.key !== key));
  }

  function moveItem(key: string, direction: -1 | 1) {
    const index = items.findIndex((item) => item.key === key);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Scope / Items</h3>
          <p className="mt-0.5 text-xs text-text-secondary">
            Add each line item from the client&apos;s RFQ. Use a header row to group related items under one S.No
            section.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="ghost" onClick={() => addItem(true)}>
            <PlusIcon className="h-4 w-4" />
            Header Row
          </Button>
          <Button type="button" variant="ghost" onClick={() => addItem(false)}>
            <PlusIcon className="h-4 w-4" />
            Item
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-background">
          <EmptyState
            icon={<LayersIcon className="h-8 w-8" />}
            title="No items added yet"
            description="Add a header row to group items, or add an item directly."
            action={
              <Button type="button" onClick={() => addItem(false)}>
                <PlusIcon className="h-4 w-4" />
                Add First Item
              </Button>
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-background text-text-secondary">
              <tr>
                <th className="w-28 px-3 py-2.5 font-medium">S.No / Code</th>
                <th className="px-3 py-2.5 font-medium">Description</th>
                <th className="w-36 px-3 py-2.5 font-medium">Category</th>
                <th className="w-20 px-3 py-2.5 font-medium">Unit</th>
                <th className="w-24 px-3 py-2.5 text-right font-medium">Quantity</th>
                <th className="w-40 px-3 py-2.5 font-medium">Remarks</th>
                <th className="w-32 px-3 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.key} className={`border-b border-border last:border-0 ${item.isHeader ? "bg-background/60" : ""}`}>
                  <td className="px-3 py-2 align-top">
                    <input
                      className={fieldClasses}
                      value={item.itemCode}
                      onChange={(e) => updateItem(item.key, { itemCode: e.target.value })}
                      placeholder={item.isHeader ? "2" : "2.1(a)"}
                      aria-label="Item code"
                    />
                    <label className="mt-1.5 flex items-center gap-1.5 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={item.isHeader}
                        onChange={(e) =>
                          updateItem(item.key, {
                            isHeader: e.target.checked,
                            quantity: e.target.checked ? 0 : item.quantity,
                          })
                        }
                      />
                      Header row
                    </label>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <textarea
                      className={`${fieldClasses} resize-y`}
                      rows={2}
                      value={item.description}
                      onChange={(e) => updateItem(item.key, { description: e.target.value })}
                      placeholder="Item description / scope"
                      aria-label="Description"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <select
                      className={fieldClasses}
                      value={item.categoryId ?? ""}
                      onChange={(e) => updateItem(item.key, { categoryId: e.target.value || null })}
                      aria-label="Category / work type"
                    >
                      <option value="">—</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      className={fieldClasses}
                      value={item.unit}
                      onChange={(e) => updateItem(item.key, { unit: e.target.value })}
                      placeholder="m3"
                      disabled={item.isHeader}
                      aria-label="Unit"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      type="number"
                      className={`${fieldClasses} text-right`}
                      value={item.isHeader ? 0 : item.quantity}
                      onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) || 0 })}
                      disabled={item.isHeader}
                      aria-label="Quantity"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      className={fieldClasses}
                      value={item.remarks}
                      onChange={(e) => updateItem(item.key, { remarks: e.target.value })}
                      aria-label="Remarks"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => moveItem(item.key, -1)}
                        disabled={index === 0}
                        title="Move up"
                        className="rounded-md border border-border p-1.5 text-text-secondary transition hover:border-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUpIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(item.key, 1)}
                        disabled={index === items.length - 1}
                        title="Move down"
                        className="rounded-md border border-border p-1.5 text-text-secondary transition hover:border-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowDownIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateItem(item.key)}
                        title="Duplicate"
                        className="rounded-md border border-border p-1.5 text-text-secondary transition hover:border-secondary hover:text-text-primary"
                      >
                        <CopyIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        title="Delete"
                        className="rounded-md border border-border p-1.5 text-text-secondary transition hover:border-danger hover:text-danger"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
