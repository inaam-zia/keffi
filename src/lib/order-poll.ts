import type { OrderWithItems } from "@/lib/types";

export const ORDER_STATUS_POLL_MS = 2000;
export const LIVE_ORDERING_POLL_MS = 8000;

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

export async function fetchLiveOrderingItems(
  tableNumber?: number | null
): Promise<string[]> {
  const qs = tableNumber ? `table=${tableNumber}&` : "";
  const res = await fetch(`/api/orders/live-activity?${qs}_=${Date.now()}`, noStore);

  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data.items)
    ? data.items.filter((name: unknown): name is string => typeof name === "string" && name.trim().length > 0)
    : [];
}
