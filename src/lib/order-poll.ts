import type { OrderWithItems } from "@/lib/types";

export const ORDER_STATUS_POLL_MS = 2000;
export const OTHERS_ORDERING_POLL_MS = 5000;

const noStore: RequestInit = { cache: "no-store" };

export async function fetchMyActiveOrders(
  tableNumber: number
): Promise<{ orders: OrderWithItems[]; error?: string }> {
  const res = await fetch(`/api/orders/my-active?table=${tableNumber}&_=${Date.now()}`, noStore);

  if (!res.ok) {
    let error = "Could not load order status";
    try {
      const data = await res.json();
      error = data.error || error;
    } catch {
      // ignore
    }
    return { orders: [], error };
  }

  const data = await res.json();
  return { orders: (data.orders ?? []) as OrderWithItems[] };
}

/** Item names only — no quantities, no table numbers. */
export async function fetchOthersOrdering(
  tableNumber: number
): Promise<string[]> {
  try {
    const res = await fetch(
      `/api/orders/others-ordering?table=${tableNumber}&_=${Date.now()}`,
      noStore
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.items;
    if (!Array.isArray(items)) return [];
    return items
      .map((name: unknown) => String(name || "").trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
