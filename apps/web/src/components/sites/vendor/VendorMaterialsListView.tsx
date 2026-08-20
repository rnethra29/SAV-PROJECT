import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LayersIcon } from "@/components/ui/icons";
import { formatCurrency } from "@/lib/format";
import type { VndMaterialCategory, VndMaterialService } from "@/types/sites/material-service";

type VendorMaterialsListViewProps = {
  materials: VndMaterialService[];
  categories: VndMaterialCategory[];
};

function toAmount(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Pure list/table rendering for the Vendor Materials/Services catalog. */
export function VendorMaterialsListView({ materials, categories }: VendorMaterialsListViewProps) {
  const categoryLabel = (categoryId: string | null) =>
    categories.find((c) => c.material_category_id === categoryId)?.category_name ?? "—";

  if (materials.length === 0) {
    return (
      <EmptyState
        icon={<LayersIcon className="h-8 w-8" />}
        title="No materials or services yet"
        description="Add what this vendor supplies to build their catalog for procurement."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-secondary">
          <tr>
            <th className="px-5 py-3 font-medium">Item</th>
            <th className="px-5 py-3 font-medium">Category</th>
            <th className="px-5 py-3 font-medium">Unit</th>
            <th className="px-5 py-3 text-right font-medium">Standard Rate</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((material) => (
            <tr key={material.material_service_id} className="border-b border-border last:border-0 hover:bg-background/60">
              <td className="px-5 py-3">
                <div className="font-medium text-text-primary">{material.item_name}</div>
                {material.description && <div className="text-text-secondary">{material.description}</div>}
              </td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                {categoryLabel(material.material_category_id)}
              </td>
              <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{material.unit}</td>
              <td className="px-5 py-3 text-right text-text-secondary">
                {formatCurrency(toAmount(material.standard_rate))}
              </td>
              <td className="px-5 py-3">
                <StatusBadge label={material.is_active ? "Active" : "Inactive"} tone={material.is_active ? "success" : "inactive"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
