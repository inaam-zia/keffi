"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CafeBranding } from "@/lib/branding-types";
import { getDefaultBranding } from "@/lib/branding-types";
import { formatDateShort, formatPrice } from "@/lib/format";
import { fetchJsonArray } from "@/lib/parse-api";
import {
  consolidateOrdersForBill,
  getOrderBillTotals,
  getOrderGrandTotal,
  type BillTotals,
} from "@/lib/receipt";
import BillGstLines from "@/components/bill-gst-lines";
import type { OrderStatus, OrderWithItems } from "@/lib/types";
import TableHeading from "@/components/table-heading";
import AdminTableMap from "@/components/admin-table-map";
import type { FloorTable } from "@/lib/floor-map";
import { useNewOrders } from "../new-orders-context";

const statusLabels: Record<OrderStatus, string> = {
  new: "New",
  preparing: "Preparing",
  served: "Served",
  cancelled: "Cancelled",
};

const statusColors: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  preparing: "bg-blue-100 text-blue-800",
  served: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
};

function PreparingIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 13h12" />
      <path d="M6 17h12" />
      <path d="M8 9V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
      <path d="M4 21h16" />
    </svg>
  );
}

function ServedIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function LiveOrdersPage() {
  const { refreshNewOrders, refreshTableRequests } = useNewOrders();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [servedOrders, setServedOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [closingTable, setClosingTable] = useState<number | null>(null);
  const [closingBulk, setClosingBulk] = useState(false);
  const [clearedTables, setClearedTables] = useState<number[]>([]);
  const [lowStock, setLowStock] = useState<
    { id: string; name: string; quantity: number; unit: string }[]
  >([]);
  const [branding, setBranding] = useState<CafeBranding>(getDefaultBranding());
  const [requests, setRequests] = useState<
    { id: string; table_number: number; kind: string }[]
  >([]);
  const [floorTables, setFloorTables] = useState<FloorTable[]>([]);
  const [floorLoading, setFloorLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [expandedPayable, setExpandedPayable] = useState<number | null>(null);
  const [selectedBills, setSelectedBills] = useState<number[]>([]);

  const gst = useMemo(
    () => ({
      gstEnabled: branding.gstEnabled,
      cgstPercent: branding.cgstPercent,
      sgstPercent: branding.sgstPercent,
    }),
    [branding]
  );

  async function loadOrders() {
    const from = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const [active, served] = await Promise.all([
      fetchJsonArray<OrderWithItems>("/api/orders?status=new,preparing"),
      fetchJsonArray<OrderWithItems>(
        `/api/orders?status=served&from=${encodeURIComponent(from)}`
      ),
    ]);
    setOrders(active.items);
    setServedOrders(served.items);
    setError(active.error || served.error);
    setLoading(false);
  }

  async function loadRequests() {
    const res = await fetch("/api/table-requests", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setRequests(data.requests ?? []);
  }

  async function loadFloor() {
    try {
      const res = await fetch("/api/admin/floor", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setFloorTables(data.tables ?? []);
    } finally {
      setFloorLoading(false);
    }
  }

  async function loadLowStock() {
    try {
      const res = await fetch("/api/admin/inventory/alerts");
      if (!res.ok) return;
      const data = await res.json();
      setLowStock(data.items ?? []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadOrders();
    loadLowStock();
    loadRequests();
    loadFloor();
    fetch(`/api/branding?_=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: CafeBranding) =>
        setBranding({
          ...getDefaultBranding(),
          ...data,
          gstEnabled: Boolean(data.gstEnabled),
          cgstPercent: Number(data.cgstPercent) || 0,
          sgstPercent: Number(data.sgstPercent) || 0,
        })
      )
      .catch(() => {});
    const interval = setInterval(() => {
      loadOrders();
      loadRequests();
      loadFloor();
    }, 8000);
    const stockInterval = setInterval(loadLowStock, 30000);
    return () => {
      clearInterval(interval);
      clearInterval(stockInterval);
    };
  }, []);

  const openTables = useMemo(() => {
    const map = new Map<
      number,
      { tableNumber: number; tableLabel: string | null | undefined; count: number }
    >();
    for (const order of orders) {
      const existing = map.get(order.table_number);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(order.table_number, {
          tableNumber: order.table_number,
          tableLabel: order.table_label,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.tableNumber - b.tableNumber);
  }, [orders]);

  /** Tables that finished food (served) but may still need payment / session clear. */
  const payableTables = useMemo(() => {
    const kitchenTables = new Set(orders.map((o) => o.table_number));
    const cleared = new Set(clearedTables);
    const grouped = new Map<number, OrderWithItems[]>();

    for (const order of servedOrders) {
      if (kitchenTables.has(order.table_number)) continue;
      if (cleared.has(order.table_number)) continue;
      if (order.payment_method?.trim()) continue;
      if (!grouped.has(order.table_number)) grouped.set(order.table_number, []);
      grouped.get(order.table_number)!.push(order);
    }

    const rows: {
      tableNumber: number;
      tableLabel: string | null | undefined;
      guests: string;
      bill: OrderWithItems;
      totals: BillTotals;
      itemsTotal: number;
      discount: number;
    }[] = [];

    for (const [tableNumber, tableOrders] of Array.from(grouped.entries())) {
      const bill = consolidateOrdersForBill(tableOrders);
      if (!bill || !bill.order_items.length) continue;
      const totals = getOrderBillTotals(bill, gst);
      const guests = Array.from(
        new Set(
          tableOrders
            .map((order) => order.customer_name?.trim())
            .filter((name): name is string => Boolean(name))
        )
      );
      rows.push({
        tableNumber,
        tableLabel: tableOrders[0]?.table_label,
        guests: guests.length ? guests.join(", ") : "Guest",
        bill,
        totals,
        itemsTotal: bill.order_items.reduce(
          (sum, item) => sum + item.item_price * item.quantity,
          0
        ),
        discount: Number(bill.discount) || 0,
      });
    }

    return rows.sort((a, b) => a.tableNumber - b.tableNumber);
  }, [orders, servedOrders, clearedTables, gst]);

  const mapTables = useMemo(() => {
    const kitchenTables = new Set(orders.map((o) => o.table_number));
    const cleared = new Set(clearedTables);
    return floorTables.map((table) => {
      if (!cleared.has(table.tableNumber) || kitchenTables.has(table.tableNumber)) {
        return table;
      }
      return {
        ...table,
        state: table.enabled ? "free" : "disabled",
        servedCount: 0,
        ticketCount: table.newCount + table.preparingCount,
        bill: false,
      } satisfies FloorTable;
    });
  }, [floorTables, clearedTables, orders]);

  const visibleOrders = useMemo(
    () =>
      selectedTable == null
        ? orders
        : orders.filter((order) => order.table_number === selectedTable),
    [orders, selectedTable]
  );

  const visiblePayable = useMemo(
    () =>
      selectedTable == null
        ? payableTables
        : payableTables.filter((table) => table.tableNumber === selectedTable),
    [payableTables, selectedTable]
  );

  const visibleOpenTables = useMemo(
    () =>
      selectedTable == null
        ? openTables
        : openTables.filter((table) => table.tableNumber === selectedTable),
    [openTables, selectedTable]
  );

  const selectedMeta = selectedTable == null
    ? null
    : mapTables.find((table) => table.tableNumber === selectedTable) || {
        tableNumber: selectedTable,
        label: null as string | null,
        state: "free" as const,
      };

  const selectedPayable = useMemo(
    () => visiblePayable.filter((table) => selectedBills.includes(table.tableNumber)),
    [visiblePayable, selectedBills]
  );
  const selectedPayableTotal = selectedPayable.reduce(
    (sum, table) => sum + table.totals.grandTotal,
    0
  );
  const allVisibleSelected =
    visiblePayable.length > 0 && selectedPayable.length === visiblePayable.length;
  const billsBusy = closingBulk || closingTable != null;

  useEffect(() => {
    const allowed = new Set(visiblePayable.map((table) => table.tableNumber));
    setSelectedBills((prev) => {
      const next = prev.filter((n) => allowed.has(n));
      return next.length === prev.length ? prev : next;
    });
  }, [visiblePayable]);

  function selectTable(tableNumber: number | null) {
    setSelectedTable(tableNumber);
    if (tableNumber != null) {
      window.requestAnimationFrame(() => {
        document.getElementById("live-order-list")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    setSuccess("");
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadOrders();
      await loadFloor();
      await refreshNewOrders();
    } finally {
      setUpdatingId(null);
    }
  }

  async function closeTables(
    tables: { tableNumber: number; tableLabel?: string | null }[],
    paymentMethod?: string
  ) {
    if (!tables.length) return;
    const titles = tables.map(
      (table) => table.tableLabel?.trim() || `Table ${table.tableNumber}`
    );
    const confirmText =
      tables.length === 1
        ? `Mark “${titles[0]}” paid & clear?\n\nPrevious guests will be locked out. They must scan the table QR again. Use this after payment when the party leaves.`
        : `Mark ${tables.length} bills paid & clear?\n\n${titles.join(", ")}\n\nPrevious guests will be locked out. They must scan the table QR again.`;
    if (!confirm(confirmText)) return;

    const numbers = tables.map((table) => table.tableNumber);
    if (tables.length === 1) setClosingTable(numbers[0]);
    else setClosingBulk(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/tables/close-by-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumbers: numbers, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not close table");
        return;
      }
      const closed = Array.isArray(data.closed) ? (data.closed as number[]) : numbers;
      setSuccess(data.message || `${closed.length} table${closed.length === 1 ? "" : "s"} cleared.`);
      setClearedTables((prev) => Array.from(new Set([...prev, ...closed])));
      setSelectedBills((prev) => prev.filter((n) => !closed.includes(n)));
      await loadOrders();
      await loadFloor();
    } finally {
      setClosingTable(null);
      setClosingBulk(false);
    }
  }

  function closeTable(
    tableNumber: number,
    tableLabel?: string | null,
    paymentMethod?: string
  ) {
    return closeTables([{ tableNumber, tableLabel }], paymentMethod);
  }

  function toggleBill(tableNumber: number) {
    setSelectedBills((prev) =>
      prev.includes(tableNumber)
        ? prev.filter((n) => n !== tableNumber)
        : [...prev, tableNumber]
    );
  }

  function toggleAllVisibleBills() {
    if (allVisibleSelected) {
      setSelectedBills([]);
      return;
    }
    setSelectedBills(visiblePayable.map((table) => table.tableNumber));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-cafe-900">Live orders</h2>
        <p className="text-cafe-600">
          Kitchen queue, then mark paid &amp; clear when guests leave
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="card space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-cafe-500">
              Table map
            </h3>
            <p className="text-sm text-cafe-600">
              Tap a table to jump to its tickets. Tap again to show all.
            </p>
          </div>
          {selectedTable != null ? (
            <button
              type="button"
              className="text-xs font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
              onClick={() => selectTable(null)}
            >
              Show all tables
            </button>
          ) : null}
        </div>
        <AdminTableMap
          tables={mapTables}
          selectedTable={selectedTable}
          onSelect={selectTable}
          loading={floorLoading}
        />
        {selectedMeta ? (
          <p className="text-xs font-medium text-cafe-600">
            Showing {selectedMeta.label?.trim() || `Table ${selectedMeta.tableNumber}`}
            {selectedMeta.state === "free" ? " — free right now" : ""}.
          </p>
        ) : null}
      </div>

      {requests.length > 0 && (
        <div className="card space-y-2 border border-amber-300 bg-amber-50">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900">
            Table requests
          </h3>
          {requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                <button
                  type="button"
                  className="underline-offset-2 hover:underline"
                  onClick={() => selectTable(req.table_number)}
                >
                  Table {req.table_number}
                </button>
                {" · "}
                {req.kind === "bill" ? "Wants the bill" : "Call waiter"}
              </p>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={async () => {
                  await fetch(`/api/table-requests/${req.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "done" }),
                  });
                  await loadRequests();
                  await loadFloor();
                  await refreshTableRequests();
                }}
              >
                Done
              </button>
            </div>
          ))}
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">
            Inventory warning — buy{" "}
            {lowStock
              .slice(0, 4)
              .map((i) => i.name)
              .join(", ")}
            {lowStock.length > 4 ? ` +${lowStock.length - 4} more` : ""}
          </p>
          <Link
            href="/admin/inventory"
            className="mt-1 inline-block font-medium underline underline-offset-2"
          >
            Open inventory
          </Link>
        </div>
      )}

      {visiblePayable.length > 0 && (
        <div className="card space-y-3 border border-green-200 bg-green-50/40">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-green-800">
                Served — mark paid &amp; clear
              </h3>
              <p className="text-sm text-cafe-600">
                Food is done. After you confirm UPI/cash, clear the table so the next party can
                scan fresh. Select several bills to clear them together.
              </p>
            </div>
            {visiblePayable.length > 1 ? (
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-green-900">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--brand-primary)]"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisibleBills}
                />
                Select all
              </label>
            ) : null}
          </div>
          {selectedPayable.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-green-300 bg-white px-3 py-2">
              <p className="text-sm font-semibold text-green-900">
                {selectedPayable.length} selected · {formatPrice(selectedPayableTotal)}
              </p>
              <div className="flex flex-wrap gap-1">
                {(["upi", "cash", "card"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() =>
                      closeTables(
                        selectedPayable.map((table) => ({
                          tableNumber: table.tableNumber,
                          tableLabel: table.tableLabel,
                        })),
                        method
                      )
                    }
                    disabled={billsBusy}
                    className="btn-primary text-xs capitalize disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {closingBulk ? "Clearing…" : `Clear ${method}`}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            {visiblePayable.map((table) => {
              const expanded = expandedPayable === table.tableNumber;
              const checked = selectedBills.includes(table.tableNumber);
              const rowBusy = billsBusy && (closingBulk || closingTable === table.tableNumber);
              return (
                <div
                  key={table.tableNumber}
                  className={`rounded-xl border bg-white px-3 py-2.5 ${
                    checked ? "border-[var(--brand-primary)]" : "border-green-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <label className="flex min-w-0 cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand-primary)]"
                        checked={checked}
                        onChange={() => toggleBill(table.tableNumber)}
                        aria-label={`Select ${table.tableLabel?.trim() || `Table ${table.tableNumber}`}`}
                      />
                      <span>
                        <TableHeading
                          tableNumber={table.tableNumber}
                          tableName={table.tableLabel}
                          size="md"
                        />
                        <span className="mt-0.5 block text-xs text-cafe-500">
                          {table.guests} · To pay {formatPrice(table.totals.grandTotal)}
                        </span>
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {(["upi", "cash", "card"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() =>
                            closeTable(table.tableNumber, table.tableLabel, method)
                          }
                          disabled={billsBusy}
                          className="btn-primary text-xs capitalize disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {rowBusy ? "Clearing…" : method}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
                    onClick={() =>
                      setExpandedPayable(expanded ? null : table.tableNumber)
                    }
                    aria-expanded={expanded}
                  >
                    {expanded ? "Hide order" : "View order"}
                  </button>
                  {expanded ? (
                    <div className="mt-2 border-t border-green-100 pt-2">
                      <ul className="space-y-1 text-sm">
                        {table.bill.order_items.map((item) => (
                          <li
                            key={`${item.item_name}-${item.item_price}-${item.notes}-${item.spice_level}`}
                            className="flex justify-between gap-3"
                          >
                            <span>
                              {item.quantity}× {item.item_name}
                              {item.spice_level ? ` · ${item.spice_level}` : ""}
                              {item.notes ? (
                                <span className="block text-xs text-amber-800">
                                  {item.notes}
                                </span>
                              ) : null}
                            </span>
                            <span className="shrink-0 text-cafe-600">
                              {formatPrice(item.item_price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <dl className="mt-2 space-y-0.5 border-t border-green-100 pt-2 text-xs text-cafe-600">
                        <div className="flex justify-between">
                          <dt>Items</dt>
                          <dd>{formatPrice(table.itemsTotal)}</dd>
                        </div>
                        {table.discount > 0 ? (
                          <div className="flex justify-between">
                            <dt>Discount</dt>
                            <dd>−{formatPrice(table.discount)}</dd>
                          </div>
                        ) : null}
                        {table.totals.applyGst ? (
                          <>
                            {branding.gstin ? (
                              <div className="flex justify-between text-cafe-500">
                                <dt>GSTIN</dt>
                                <dd className="font-mono">{branding.gstin}</dd>
                              </div>
                            ) : null}
                            <BillGstLines
                              bill={table.totals}
                              formatAmount={formatPrice}
                              lineClassName="flex justify-between"
                              totalClassName="flex justify-between font-semibold text-cafe-800"
                            />
                          </>
                        ) : null}
                        <div className="flex justify-between pt-1 text-sm font-bold text-cafe-900">
                          <dt>To pay</dt>
                          <dd>{formatPrice(table.totals.grandTotal)}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {visibleOpenTables.length > 0 && (
        <div className="card space-y-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-cafe-500">
              Open tables (kitchen active)
            </h3>
            <p className="text-sm text-cafe-600">
              Close early only if guests leave before finishing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleOpenTables.map((table) => (
              <button
                key={table.tableNumber}
                type="button"
                onClick={() => closeTable(table.tableNumber, table.tableLabel)}
                disabled={closingTable === table.tableNumber}
                className="btn-secondary text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {closingTable === table.tableNumber
                  ? "Closing…"
                  : `Clear ${table.tableLabel?.trim() || `Table ${table.tableNumber}`}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div id="live-order-list">
      {loading ? (
        <p className="text-cafe-500">Loading…</p>
      ) : visibleOrders.length === 0 ? (
        <div className="card py-12 text-center text-cafe-500">
          {selectedTable != null ? (
            <>
              No kitchen tickets for{" "}
              {selectedMeta?.label?.trim() || `Table ${selectedTable}`}.{" "}
              {visiblePayable.length > 0
                ? "Use Mark paid & clear above if guests are settling."
                : "This table is free."}
            </>
          ) : payableTables.length > 0 ? (
            <>
              No kitchen orders right now. Use{" "}
              <span className="font-semibold text-cafe-800">Mark paid &amp; clear</span> above
              when guests settle, or{" "}
              <Link href="/admin/tables" className="underline underline-offset-2">
                Table QR → New guests
              </Link>
              .
            </>
          ) : (
            <>
              No active orders — waiting for customers. To clear any table anytime, open{" "}
              <Link href="/admin/tables" className="underline underline-offset-2">
                Table QR → New guests
              </Link>
              .
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => (
            <div key={order.id} className="card space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="m-0">
                      <TableHeading
                        tableNumber={order.table_number}
                        tableName={order.table_label}
                        size="lg"
                      />
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                    {order.order_type === "takeaway" ? (
                      <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
                        Parcel
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-cafe-500">
                    {order.customer_name || "Guest"}
                    {order.customer_phone && ` · +91 ${order.customer_phone}`}
                    {order.customer_email && ` · ${order.customer_email}`}
                    {" · "}
                    {formatDateShort(order.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => closeTable(order.table_number, order.table_label)}
                  disabled={closingTable === order.table_number}
                  className="text-xs font-medium text-cafe-700 underline underline-offset-2 disabled:opacity-50"
                >
                  Clear table
                </button>
              </div>

              <ul className="space-y-1 rounded-xl bg-cafe-50 px-4 py-3">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}× {item.item_name}
                      {item.spice_level ? ` · ${item.spice_level}` : ""}
                      {item.notes ? (
                        <span className="block text-xs text-amber-800">Note: {item.notes}</span>
                      ) : null}
                    </span>
                    <span className="text-cafe-600">
                      {formatPrice(item.item_price * item.quantity)}
                    </span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-cafe-200 pt-2 text-sm font-bold text-cafe-900">
                  <span>Total</span>
                  <span>{formatPrice(getOrderGrandTotal(order, gst))}</span>
                </li>
              </ul>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateStatus(order.id, "preparing")}
                  disabled={order.status !== "new" || updatingId === order.id}
                  className="btn-secondary inline-flex items-center gap-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PreparingIcon />
                  Mark preparing
                </button>
                <button
                  onClick={() => updateStatus(order.id, "served")}
                  disabled={updatingId === order.id}
                  className="btn-primary inline-flex items-center gap-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ServedIcon />
                  Mark served
                </button>
                <button
                  onClick={() => updateStatus(order.id, "cancelled")}
                  className="text-xs text-red-600 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
