"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useCustomerLocale } from "@/components/customer-locale-provider";
import {
  formatCooldown,
  readWaiterCooldownUntil,
  startWaiterCooldown,
  WAITER_COOLDOWN_MS,
} from "@/lib/waiter-cooldown";

type NoteTone = "ok" | "wait" | "error";

export default function TableAssistButtons({
  tableNumber,
  canRequestBill,
  extra,
  align = "start",
  ready = true,
}: {
  tableNumber: number;
  canRequestBill: boolean;
  extra?: ReactNode;
  align?: "start" | "center";
  ready?: boolean;
}) {
  const { copy } = useCustomerLocale();
  const [now, setNow] = useState(() => Date.now());
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [busy, setBusy] = useState<"waiter" | "bill" | null>(null);
  const [flash, setFlash] = useState<"waiter" | "bill" | null>(null);
  const [note, setNote] = useState<{ text: string; tone: NoteTone } | null>(null);

  useEffect(() => {
    setCooldownUntil(readWaiterCooldownUntil(tableNumber));
  }, [tableNumber]);

  const remainingMs = Math.max(0, cooldownUntil - now);
  const waiterLocked = remainingMs > 0;

  useEffect(() => {
    if (!waiterLocked) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [waiterLocked]);

  function showNote(text: string, tone: NoteTone) {
    setNote({ text, tone });
  }

  function pulse(kind: "waiter" | "bill") {
    setFlash(kind);
    window.setTimeout(() => setFlash((prev) => (prev === kind ? null : prev)), 1600);
    try {
      navigator.vibrate?.(40);
    } catch {
      /* ignore */
    }
  }

  async function callWaiter() {
    if (busy) return;
    if (waiterLocked) {
      showNote(copy.waiterWait.replace("{time}", formatCooldown(remainingMs)), "wait");
      return;
    }

    setBusy("waiter");
    showNote(copy.callingWaiter, "wait");
    try {
      const res = await fetch("/api/table-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber, kind: "waiter" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        retryAfterMs?: number;
        error?: string;
      };

      if (res.status === 429) {
        const wait = Number(data.retryAfterMs) || remainingMs || WAITER_COOLDOWN_MS;
        const until = startWaiterCooldown(tableNumber, wait);
        setCooldownUntil(until);
        setNow(Date.now());
        showNote(copy.waiterWait.replace("{time}", formatCooldown(wait)), "wait");
        return;
      }

      if (!res.ok) {
        showNote(data.error || copy.couldNotSend, "error");
        return;
      }

      const until = startWaiterCooldown(tableNumber);
      setCooldownUntil(until);
      setNow(Date.now());
      pulse("waiter");
      showNote(copy.waiterSent, "ok");
    } finally {
      setBusy(null);
    }
  }

  async function requestBill() {
    if (busy) return;
    if (!canRequestBill) {
      showNote(copy.billNeedsOrder, "wait");
      return;
    }

    setBusy("bill");
    showNote(copy.requestingBill, "wait");
    try {
      const res = await fetch("/api/table-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber, kind: "bill" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (res.status === 409) {
        showNote(copy.billNeedsOrder, "wait");
        return;
      }
      if (!res.ok) {
        showNote(data.error || copy.couldNotSend, "error");
        return;
      }

      pulse("bill");
      showNote(copy.billSent, "ok");
    } finally {
      setBusy(null);
    }
  }

  const waiterLabel = waiterLocked
    ? `${copy.callWaiter} · ${formatCooldown(remainingMs)}`
    : busy === "waiter"
      ? copy.callingWaiter
      : copy.callWaiter;

  const billLabel = busy === "bill" ? copy.requestingBill : copy.requestBill;

  return (
    <>
      <div
        className={`flex flex-wrap gap-2 ${align === "center" ? "justify-center" : ""}`}
      >
        <button
          type="button"
          className={`table-assist-btn ${flash === "waiter" ? "table-assist-btn--success" : ""} ${
            waiterLocked ? "table-assist-btn--cooling" : ""
          }`}
          onClick={() => void callWaiter()}
          aria-disabled={waiterLocked || busy === "waiter"}
          aria-live="polite"
        >
          {flash === "waiter" ? `✓ ${copy.waiterSent}` : waiterLabel}
        </button>
        <button
          type="button"
          className={`table-assist-btn ${flash === "bill" ? "table-assist-btn--success" : ""} ${
            !canRequestBill ? "table-assist-btn--disabled" : ""
          }`}
          onClick={() => void requestBill()}
          aria-disabled={!canRequestBill || busy === "bill"}
          title={!canRequestBill ? copy.billNeedsOrder : undefined}
        >
          {flash === "bill" ? `✓ ${copy.billSent}` : billLabel}
        </button>
        {extra}
      </div>
      {note ? (
        <p
          className={`table-assist-note table-assist-note--${note.tone} ${
            align === "center" ? "text-center" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          {note.text}
        </p>
      ) : ready && !canRequestBill ? (
        <p
          className={`table-assist-note table-assist-note--muted ${
            align === "center" ? "text-center" : ""
          }`}
        >
          {copy.billNeedsOrder}
        </p>
      ) : null}
    </>
  );
}
