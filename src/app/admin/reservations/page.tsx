"use client";

import { useCallback, useEffect, useState } from "react";
import type { Reservation } from "@/lib/types";

export default function ReservationsAdminPage() {
  const [rows, setRows] = useState<Reservation[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/reservations");
    const data = await res.json();
    setRows(data.reservations ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: Reservation["status"]) {
    await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-heading">Reservations</h2>
        <p className="text-sm text-brand-muted">Guests book from /reserve — no paid booking tool.</p>
      </div>
      {rows.length === 0 ? (
        <p className="card py-10 text-center text-brand-muted">No reservations yet.</p>
      ) : (
        rows.map((row) => (
          <div key={row.id} className="card space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">{row.guest_name}</p>
                <p className="text-sm text-brand-muted">
                  +91 {row.phone} · {row.party_size} guests
                </p>
                <p className="text-sm">
                  {new Date(row.reserved_for).toLocaleString()}
                </p>
                {row.notes ? <p className="text-sm text-brand-muted">{row.notes}</p> : null}
              </div>
              <span className="rounded-full bg-cafe-100 px-2 py-0.5 text-xs font-semibold capitalize">
                {row.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary text-xs" onClick={() => setStatus(row.id, "seated")}>
                Seat
              </button>
              <button type="button" className="btn-secondary text-xs" onClick={() => setStatus(row.id, "completed")}>
                Done
              </button>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => setStatus(row.id, "cancelled")}
              >
                Cancel
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
