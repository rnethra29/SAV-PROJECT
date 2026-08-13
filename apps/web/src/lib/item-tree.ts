export type TreeNode<T> = T & { children: TreeNode<T>[] };

type Hierarchical = { id: string; parentItemId: string | null; sequenceNo: number };

// Shared by RFQ items and BOQ items — both are self-referencing hierarchies
// keyed on parentItemId with sequenceNo for sibling order (Phase 6 of the
// architecture doc: "recursive CTEs used to materialize the hierarchy").
export function buildItemTree<T extends Hierarchical>(items: T[]): TreeNode<T>[] {
  const map = new Map<string, TreeNode<T>>();
  items.forEach((item) => map.set(item.id, { ...item, children: [] }));

  const roots: TreeNode<T>[] = [];
  items.forEach((item) => {
    const node = map.get(item.id)!;
    const parent = item.parentItemId ? map.get(item.parentItemId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRecursive = (nodes: TreeNode<T>[]) => {
    nodes.sort((a, b) => a.sequenceNo - b.sequenceNo);
    nodes.forEach((node) => sortRecursive(node.children));
  };
  sortRecursive(roots);

  return roots;
}
