export const LIVE_ORDERING_LIMIT = 12;
export const LIVE_ORDERING_SELECT_EVENT = "keffi:live-ordering-select";

export type LiveOrderingOrder = {
  table_number: number;
  created_at: string;
  order_items: { item_name: string | null }[];
};

/** Unique item names from other tables' active orders. Never includes quantity or table. */
export function uniqueLiveOrderItemNames(
  orders: LiveOrderingOrder[],
  excludeTableNumber: number,
  limit = LIVE_ORDERING_LIMIT
): string[] {
  const seen = new Set<string>();
  const names: string[] = [];

  const sorted = [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  for (const order of sorted) {
    if (order.table_number === excludeTableNumber) continue;

    for (const line of order.order_items || []) {
      const name = line.item_name?.trim();
      if (!name) continue;

      const key = name.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      names.push(name);
      if (names.length >= limit) return names;
    }
  }

  return names;
}

/** Short label for chips — combo lines store extra includes in parentheses. */
export function liveOrderingDisplayName(itemName: string): string {
  const combo = itemName.match(/^Combo:\s*(.+?)(?:\s*\(.*\))\s*$/i);
  if (combo) return combo[1].trim();
  return itemName;
}
