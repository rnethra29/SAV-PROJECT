export type ItemCategoryOption = {
  id: string;
  name: string;
};

/**
 * TEMPORARY FRONTEND FIXTURE — com_item_category (Phase 5.18) is a lookup
 * table the real backend owns. These are placeholder work-type categories
 * only; replace with real apiFetch("/item-categories") once that lookup
 * endpoint exists. Kept intentionally short per the instruction not to
 * invent an excessive category list — real company categories go here.
 */
const itemCategoryFixtures: ItemCategoryOption[] = [
  { id: "cat-earthwork", name: "Earthwork" },
  { id: "cat-civil", name: "Civil Works" },
  { id: "cat-concrete", name: "Concrete & Allied Works" },
  { id: "cat-structural", name: "Structural Works" },
  { id: "cat-electrical", name: "Electrical Works" },
  { id: "cat-road", name: "Road Works" },
  { id: "cat-general", name: "General Construction" },
];

export async function getItemCategoryOptions(): Promise<ItemCategoryOption[]> {
  return itemCategoryFixtures;
}
