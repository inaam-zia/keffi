"use client";

import { useCallback, useEffect, useState } from "react";

type FloorTable = {
  id: string;
  tableNumber: number;
  label: string | null;
  enabled: boolean;
  state: "free" | "kitchen" | "served" | "disabled";
  waiter: boolean;
  bill: boolean;
};

const colors: Record<FloorTable["state"], string> = {
  free: "bg-green-50 border-green-200 text-green-900",
  kitchen: "bg-amber-50 border-amber-300 text-amber-950",
  served: "bg-blue-50 border-blue-300 text-blue-950",
  disabled: "bg-gray-100 border-gray-200 text-gray-500",
};

export default function FloorPage() {
  const [tables, setTables] = useState<FloorTable[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/floor", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setTables(data.tables ?? []);
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 4000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-heading">Table map</h2>
        <p className="text-sm text-brand-muted">
          Green free · Amber in kitchen · Blue served / unpaid · Bell = waiter · Bill = requested
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`rounded-2xl border p-4 ${colors[table.state]}`}
          >
            <p className="text-lg font-bold">
              {table.label?.trim() || `Table ${table.tableNumber}`}
            </p>
            <p className="text-xs uppercase tracking-wide opacity-80">
              {table.state === "free"
                ? "Free"
                : table.state === "kitchen"
                  ? "In kitchen"
                  : table.state === "served"
                    ? "Served · unpaid"
                    : "Disabled"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {table.waiter ? (
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">
                  Waiter
                </span>
              ) : null}
              {table.bill ? (
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">
                  Bill
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
