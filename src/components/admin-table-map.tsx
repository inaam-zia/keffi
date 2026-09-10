"use client";

import type { FloorTable, FloorTableState } from "@/lib/floor-map";
import { floorStateLabel } from "@/lib/floor-map";

const TILE: Record<FloorTableState, string> = {
  free: "border-green-200 bg-green-50 text-green-950",
  new: "border-amber-300 bg-amber-50 text-amber-950",
  preparing: "border-orange-300 bg-orange-50 text-orange-950",
  kitchen: "border-amber-400 bg-amber-100 text-amber-950",
  served: "border-blue-300 bg-blue-50 text-blue-950",
  disabled: "border-gray-200 bg-gray-100 text-gray-500",
};

function guestLine(table: FloorTable): string {
  if (!table.guests.length) return "";
  if (table.guests.length === 1) return table.guests[0];
  if (table.guests.length === 2) return table.guests.join(", ");
  return `${table.guests[0]} +${table.guests.length - 1}`;
}

export default function AdminTableMap({
  tables,
  selectedTable,
  onSelect,
  loading = false,
}: {
  tables: FloorTable[];
  selectedTable?: number | null;
  onSelect?: (tableNumber: number | null) => void;
  loading?: boolean;
}) {
  const interactive = typeof onSelect === "function";
  const busy = tables.filter((t) => t.state !== "free" && t.state !== "disabled").length;
  const alerts = tables.filter((t) => t.waiter || t.bill).length;

  if (!loading && tables.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-brand px-4 py-8 text-center text-sm text-brand-muted">
        No tables yet. Add them under Table QR so the map can show the floor.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-brand-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" /> Free
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> New
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> Preparing
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" /> Served unpaid
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300" /> Off
        </span>
        {busy > 0 ? <span className="text-brand-heading">{busy} occupied</span> : null}
        {alerts > 0 ? <span className="text-sky-800">{alerts} need staff</span> : null}
      </div>

      {loading && tables.length === 0 ? (
        <p className="text-sm text-brand-muted">Loading table map…</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {tables.map((table) => {
            const selected = selectedTable === table.tableNumber;
            const needsStaff = table.waiter || table.bill;
            const title = table.label?.trim() || `Table ${table.tableNumber}`;
            const guests = guestLine(table);
            const className = [
              "rounded-2xl border p-3 text-left transition",
              TILE[table.state],
              interactive ? "cursor-pointer hover:brightness-[0.98] active:scale-[0.99]" : "",
              selected ? "ring-2 ring-[var(--brand-primary)] ring-offset-2" : "",
              needsStaff ? "ring-2 ring-sky-500" : "",
            ]
              .filter(Boolean)
              .join(" ");

            const body = (
              <>
                <div className="flex items-start justify-between gap-1">
                  <p className="text-sm font-bold leading-tight">{title}</p>
                  <span className="text-[10px] font-semibold opacity-70">#{table.tableNumber}</span>
                </div>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-80">
                  {floorStateLabel(table.state)}
                </p>
                {table.ticketCount > 0 ? (
                  <p className="mt-0.5 text-[11px]">
                    {table.ticketCount} ticket{table.ticketCount === 1 ? "" : "s"}
                    {table.newCount && table.preparingCount
                      ? ` · ${table.newCount} new / ${table.preparingCount} prep`
                      : ""}
                  </p>
                ) : null}
                {guests ? <p className="mt-0.5 truncate text-[11px] opacity-80">{guests}</p> : null}
                <div className="mt-2 flex flex-wrap gap-1">
                  {table.waiter ? (
                    <span className="rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold">
                      Waiter
                    </span>
                  ) : null}
                  {table.bill ? (
                    <span className="rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold">
                      Bill
                    </span>
                  ) : null}
                  {table.takeawayCount > 0 ? (
                    <span className="rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold">
                      Parcel
                    </span>
                  ) : null}
                  {table.orphan ? (
                    <span className="rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold">
                      Unlisted
                    </span>
                  ) : null}
                  {!table.enabled && table.state !== "disabled" ? (
                    <span className="rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold">
                      Off
                    </span>
                  ) : null}
                </div>
              </>
            );

            if (!interactive) {
              return (
                <div key={table.id} className={className}>
                  {body}
                </div>
              );
            }

            return (
              <button
                key={table.id}
                type="button"
                className={className}
                aria-pressed={selected}
                onClick={() => onSelect?.(selected ? null : table.tableNumber)}
              >
                {body}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
