"use client";

import { useCallback, useEffect, useState } from "react";
import type { OrderWithItems } from "@/lib/types";
import TableHeading from "@/components/table-heading";

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/orders?status=new,preparing", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 2500);
    return () => clearInterval(interval);
  }, [load]);

  async function bump(order: OrderWithItems) {
    const next = order.status === "new" ? "preparing" : "served";
    setUpdatingId(order.id);
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    await load();
    setUpdatingId(null);
  }

  async function eightySix(itemName: string) {
    if (!confirm(`Mark “${itemName}” sold out on the customer menu?`)) return;
    const res = await fetch("/api/menu");
    const data = await res.json();
    const match = (data.items || []).find(
      (item: { name: string }) => item.name.toLowerCase() === itemName.toLowerCase()
    );
    if (!match) return;
    await fetch(`/api/menu/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: false }),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-heading">Kitchen display</h2>
        <p className="text-sm text-brand-muted">Tap a ticket to bump it. 86 sells out an item.</p>
      </div>
      {orders.length === 0 ? (
        <p className="card py-12 text-center text-brand-muted">No tickets — kitchen is clear.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              disabled={updatingId === order.id}
              onClick={() => bump(order)}
              className={`rounded-2xl border p-5 text-left shadow-sm ${
                order.status === "new"
                  ? "border-amber-300 bg-amber-50"
                  : "border-blue-300 bg-blue-50"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <TableHeading
                  tableNumber={order.table_number}
                  tableName={order.table_label}
                  size="lg"
                />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {order.status === "new" ? "New — tap to prep" : "Preparing — tap served"}
                </span>
              </div>
              {order.order_type === "takeaway" ? (
                <p className="mb-2 text-xs font-semibold text-amber-800">Takeaway / parcel</p>
              ) : null}
              <ul className="space-y-2">
                {order.order_items.map((item) => (
                  <li key={item.id} className="text-base font-semibold text-cafe-900">
                    {item.quantity}× {item.item_name}
                    {item.spice_level ? (
                      <span className="ml-1 text-sm font-medium text-red-700">
                        · {item.spice_level}
                      </span>
                    ) : null}
                    {item.notes ? (
                      <p className="text-sm font-medium text-amber-800">Note: {item.notes}</p>
                    ) : null}
                    <button
                      type="button"
                      className="ml-2 text-xs font-medium text-red-700 underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        void eightySix(item.item_name);
                      }}
                    >
                      86
                    </button>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
