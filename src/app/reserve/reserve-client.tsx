"use client";

import { useState } from "react";
import CafeBrandingBlock from "@/components/cafe-branding-block";
import CustomerNav from "@/components/customer-nav";
import DeveloperCredit from "@/components/developer-credit";
import { useCustomerLocale } from "@/components/customer-locale-provider";
import { getDefaultBranding, type CafeBranding } from "@/lib/branding-types";
import { customerInputLang } from "@/lib/customer-copy";

export default function ReserveClient({ branding }: { branding: CafeBranding }) {
  const { copy, locale } = useCustomerLocale();
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [reservedFor, setReservedFor] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestName, phone, partySize, reservedFor, notes }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || copy.couldNotBook);
      return;
    }
    setOk(true);
  }

  return (
    <main className="order-bg mx-auto min-h-screen max-w-lg px-5 py-8">
      <CafeBrandingBlock branding={branding || getDefaultBranding()} logoSize="md" showTagline />
      <CustomerNav className="mt-4" />
      <div className="order-hero-card mt-6 w-full min-w-0 overflow-x-hidden">
        <h1 className="text-2xl font-bold text-brand-heading">{copy.reserveTitle}</h1>
        {ok ? (
          <p className="mt-4 text-sm text-green-800">{copy.reserveOk}</p>
        ) : (
          <form onSubmit={submit} className="mt-4 w-full min-w-0 space-y-3">
            <label className="block w-full min-w-0">
              <span className="order-label">{copy.guestName}</span>
              <input
                className="order-input mt-1"
                placeholder={copy.guestName}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            </label>
            <label className="block w-full min-w-0">
              <span className="order-label">{copy.phone}</span>
              <input
                className="order-input mt-1"
                placeholder={copy.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>
            <label className="block w-full min-w-0">
              <span className="order-label">{copy.partySize}</span>
              <input
                className="order-input mt-1"
                type="number"
                min={1}
                max={20}
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
              />
            </label>
            <label className="block w-full min-w-0">
              <span className="order-label">{copy.dateTime}</span>
              <div className="relative mt-1 w-full min-w-0">
                {!reservedFor ? (
                  <span className="pointer-events-none absolute left-4 top-1/2 z-[1] -translate-y-1/2 text-sm text-cafe-400">
                    {copy.datePlaceholder}
                  </span>
                ) : null}
                <input
                  className={`datetime-field order-input ${!reservedFor ? "datetime-field--empty" : ""}`}
                  type="datetime-local"
                  value={reservedFor}
                  onChange={(e) => setReservedFor(e.target.value)}
                  required
                  aria-label={copy.datePlaceholder}
                />
              </div>
            </label>
            <label className="block w-full min-w-0">
              <span className="order-label">{copy.optionalNote}</span>
              <textarea
                className="order-input mt-1"
                placeholder={copy.optionalNote}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                lang={customerInputLang(locale)}
                autoCapitalize="off"
                autoCorrect="off"
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" className="order-btn w-full" disabled={submitting}>
              {submitting ? copy.booking : copy.bookTable}
            </button>
          </form>
        )}
      </div>
      <DeveloperCredit className="mt-8" />
    </main>
  );
}
