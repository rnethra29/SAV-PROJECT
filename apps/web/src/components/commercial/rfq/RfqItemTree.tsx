import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayersIcon } from "@/components/ui/icons";
import { formatNumber } from "@/lib/format";
import { isHeaderRfqItem } from "@/lib/fixtures/rfq";
import type { RfqItemNode } from "@/lib/fixtures/rfq";

function ItemRow({ node, depth }: { node: RfqItemNode; depth: number }) {
  const isHeader = isHeaderRfqItem(node);
  return (
    <>
      <tr
        className={`border-b border-border transition-colors last:border-0 ${isHeader ? "bg-background" : "hover:bg-background/60"}`}
      >
        <td className="px-5 py-2.5" style={{ paddingLeft: `${1.25 + depth * 1.25}rem` }}>
          <span className={isHeader ? "font-semibold text-text-primary" : "font-medium text-text-primary"}>
            {node.itemCode}
          </span>
        </td>
        <td className={`px-5 py-2.5 ${isHeader ? "font-semibold text-text-primary" : "text-text-primary"}`}>
          {node.description}
        </td>
        <td className="px-5 py-2.5 text-text-secondary">{isHeader ? "—" : node.unit}</td>
        <td className="px-5 py-2.5 text-right text-text-secondary">
          {isHeader ? "—" : formatNumber(node.quantity, 3)}
        </td>
      </tr>
      {node.children.map((child) => (
        <ItemRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

type RfqItemTreeProps = {
  tree: RfqItemNode[];
};

export function RfqItemTree({ tree }: RfqItemTreeProps) {
  return (
    <Panel className="bg-surface">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary">RFQ Items</h2>
        <p className="mt-0.5 text-xs text-text-secondary">
          Hierarchical S.No structure — the traceability thread through every downstream commercial stage.
        </p>
      </div>
      {tree.length === 0 ? (
        <EmptyState
          icon={<LayersIcon className="h-8 w-8" />}
          title="No items entered yet"
          description="RFQ line items will appear here once the estimation engineer enters them."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">S.No</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 text-right font-medium">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {tree.map((node) => (
                <ItemRow key={node.id} node={node} depth={0} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
