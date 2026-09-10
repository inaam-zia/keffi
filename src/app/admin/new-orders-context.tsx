"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { playNewOrderSound, playTableRequestSound } from "@/lib/admin-notification-sound";
import { formatTableRef } from "@/lib/tables";
import { fetchJsonArray } from "@/lib/parse-api";
import type { OrderWithItems, TableRequest } from "@/lib/types";

const POLL_MS = 5000;
const REQUEST_POLL_MS = 2500;
const BASE_TITLE = "Cafe Admin";

type Snackbar = {
  id: string;
  message: string;
  href?: string;
  tone?: "order" | "request";
};

type NewOrdersContextValue = {
  newOrderCount: number;
  tableRequestCount: number;
  openRequests: TableRequest[];
  refreshNewOrders: () => Promise<void>;
  refreshTableRequests: () => Promise<void>;
};

const NewOrdersContext = createContext<NewOrdersContextValue | null>(null);

export function useNewOrders() {
  const ctx = useContext(NewOrdersContext);
  if (!ctx) {
    throw new Error("useNewOrders must be used within NewOrdersProvider");
  }
  return ctx;
}

function SnackbarStack({
  items,
  onDismiss,
}: {
  items: Snackbar[];
  onDismiss: (id: string) => void;
}) {
  if (!items.length) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2 [padding-top:env(safe-area-inset-top)]"
      aria-live="polite"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-lg ${
            item.tone === "request"
              ? "border-sky-200 bg-sky-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              item.tone === "request" ? "text-sky-950" : "text-amber-950"
            }`}
          >
            {item.message}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {item.href ? (
              <Link
                href={item.href}
                onClick={() => onDismiss(item.id)}
                className="text-xs font-semibold text-amber-800 underline-offset-2 hover:underline"
              >
                View
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="text-amber-600 hover:text-amber-900"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NewOrdersProvider({ children }: { children: React.ReactNode }) {
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [openRequests, setOpenRequests] = useState<TableRequest[]>([]);
  const [snackbars, setSnackbars] = useState<Snackbar[]>([]);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const knownRequestIdsRef = useRef<Set<string> | null>(null);
  const pollingRef = useRef(false);
  const requestPollingRef = useRef(false);

  const dismissSnackbar = useCallback((id: string) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const pushSnackbar = useCallback((message: string, href?: string, tone?: Snackbar["tone"]) => {
    const id = `snack-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setSnackbars((prev) => [...prev.slice(-2), { id, message, href, tone }]);
    setTimeout(() => dismissSnackbar(id), 8000);
  }, [dismissSnackbar]);

  const pushNativeNotification = useCallback((title: string, body: string, href = "/admin/orders") => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const notification = new Notification(title, {
      body,
      tag: `cafe-${title}-${Date.now()}`,
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = href;
      notification.close();
    };
  }, []);

  const refreshTableRequests = useCallback(async () => {
    if (requestPollingRef.current) return;
    requestPollingRef.current = true;
    try {
      const res = await fetch("/api/table-requests", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const requests = (data.requests ?? []) as TableRequest[];
      setOpenRequests(requests);

      const currentIds = new Set(requests.map((r) => r.id));
      if (knownRequestIdsRef.current === null) {
        knownRequestIdsRef.current = currentIds;
        return;
      }

      const fresh = requests.filter((r) => !knownRequestIdsRef.current!.has(r.id));
      if (fresh.length > 0) {
        playTableRequestSound();
        for (const req of fresh) {
          const kindLabel = req.kind === "bill" ? "Bill requested" : "Waiter called";
          const message = `${kindLabel} — Table ${req.table_number}`;
          pushSnackbar(message, "/admin/orders", "request");
          if (document.visibilityState !== "visible") {
            pushNativeNotification(kindLabel, message, "/admin/orders");
          }
        }
      }
      knownRequestIdsRef.current = currentIds;
    } catch {
      /* table may not exist yet */
    } finally {
      requestPollingRef.current = false;
    }
  }, [pushNativeNotification, pushSnackbar]);

  const refreshNewOrders = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;

    try {
      const { items } = await fetchJsonArray<OrderWithItems>("/api/orders?status=new");
      const orders = items;
      const count = orders.length;
      setNewOrderCount(count);

      const currentIds = new Set(orders.map((o) => o.id));

      if (knownIdsRef.current === null) {
        knownIdsRef.current = currentIds;
        return;
      }

      const newOrders = orders.filter((o) => !knownIdsRef.current!.has(o.id));
      if (newOrders.length > 0) {
        playNewOrderSound();
        for (const order of newOrders) {
          const name = order.customer_name?.trim() || "Guest";
          const tableRef = formatTableRef(order.table_number, order.table_label);
          const message = `New order — ${tableRef} · ${name}`;
          pushSnackbar(message, "/admin/orders");

          if (document.visibilityState !== "visible") {
            pushNativeNotification("New order received", message);
          }
        }
      }

      knownIdsRef.current = currentIds;
    } finally {
      pollingRef.current = false;
    }
  }, [pushNativeNotification, pushSnackbar]);

  const tableRequestCount = openRequests.length;
  const alertCount = newOrderCount + tableRequestCount;

  useEffect(() => {
    document.title =
      alertCount > 0 ? `(${alertCount}) ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [alertCount]);

  useEffect(() => {
    void refreshNewOrders();
    void refreshTableRequests();
    const orderInterval = setInterval(() => void refreshNewOrders(), POLL_MS);
    const requestInterval = setInterval(() => void refreshTableRequests(), REQUEST_POLL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") {
        void refreshNewOrders();
        void refreshTableRequests();
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(orderInterval);
      clearInterval(requestInterval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshNewOrders, refreshTableRequests]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  return (
    <NewOrdersContext.Provider
      value={{
        newOrderCount,
        tableRequestCount,
        openRequests,
        refreshNewOrders,
        refreshTableRequests,
      }}
    >
      {children}
      <SnackbarStack items={snackbars} onDismiss={dismissSnackbar} />
    </NewOrdersContext.Provider>
  );
}
