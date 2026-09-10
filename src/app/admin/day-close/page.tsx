"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

type DayClose = {
  orderCount: number;
  cancelledCount: number;
  revenue: number;
  takeawayCount: number;
  dineInCount: number;
  byMethod: Record<string, { count: number; total: number }>;
  topItems: { name: string; quantity: number }[];
};

export default function DayClosePage() {
  const [data, setData] = useState<DayClose | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/day-close")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          setError(json.error || "Could not load day close");
          return;
        }
        setData(json);
      })
      .catch(() => setError("Could not load day close"));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-brand-muted">Loading today’s close…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-heading">Day close</h2>
        <p className="text-sm text-brand-muted">Today so far — refresh this page anytime.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs font-semibold uppercase text-brand-muted">Revenue</p>
          <p className="mt-1 text-2xl font-bold">{formatPrice(data.revenue)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold uppercase text-brand-muted">Orders</p>
          <p className="mt-1 text-2xl font-bold">{data.orderCount}</p>
          <p className="text-xs text-brand-muted">{data.cancelledCount} cancelled</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold uppercase text-brand-muted">Service</p>
          <p className="mt-1 text-sm">
            Dine-in {data.dineInCount} · Parcel {data.takeawayCount}
          </p>
        </div>
      </div>
      <div className="card space-y-2">
        <h3 className="font-bold">Payment mix</h3>
        {Object.keys(data.byMethod).length === 0 ? (
          <p className="text-sm text-brand-muted">No payments marked yet. Use Mark paid &amp; clear.</p>
        ) : (
          Object.entries(data.byMethod).map(([method, stats]) => (
            <p key={method} className="flex justify-between text-sm">
              <span className="capitalize">{method}</span>
              <span>
                {stats.count} · {formatPrice(stats.total)}
              </span>
            </p>
          ))
        )}
      </div>
      <div className="card space-y-2">
        <h3 className="font-bold">Top items today</h3>
        {data.topItems.length === 0 ? (
          <p className="text-sm text-brand-muted">No items yet.</p>
        ) : (
          data.topItems.map((item) => (
            <p key={item.name} className="flex justify-between text-sm">
              <span>{item.name}</span>
              <span>{item.quantity}</span>
            </p>
          ))
        )}
      </div>
    </div>
  );
}
