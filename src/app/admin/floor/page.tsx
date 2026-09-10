"use client";

import { useCallback, useEffect, useState } from "react";
import AdminTableMap from "@/components/admin-table-map";
import type { FloorTable } from "@/lib/floor-map";

export default function FloorPage() {
  const [tables, setTables] = useState<FloorTable[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/floor", { cache: "no-store" });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTables(data.tables ?? []);
    setLoading(false);
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
          Live floor status. Paid or cleared tables go back to free. Unlisted tiles are orders
          on a number that is not in Table QR.
        </p>
      </div>
      <AdminTableMap tables={tables} loading={loading} />
    </div>
  );
}
