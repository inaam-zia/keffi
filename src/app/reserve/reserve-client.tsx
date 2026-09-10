"use client";

import { useState } from "react";
import CafeBrandingBlock from "@/components/cafe-branding-block";
import DeveloperCredit from "@/components/developer-credit";
import { getDefaultBranding, type CafeBranding } from "@/lib/branding-types";

export default function ReserveClient({ branding }: { branding: CafeBranding }) {
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
      setError(data.error || "Could not book");
      return;
    }
    setOk(true);
  }

  return (
    <main className="order-bg mx-auto min-h-screen max-w-lg px-5 py-8">
      <CafeBrandingBlock branding={branding || getDefaultBranding()} logoSize="md" showTagline />
      <div className="order-hero-card mt-6">
        <h1 className="text-2xl font-bold text-brand-heading">Reserve a table</h1>
        {ok ? (
          <p className="mt-4 text-sm text-green-800">
            Reserved. We’ll confirm with you on WhatsApp or when you arrive.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <input
              className="order-input"
              placeholder="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
            />
            <input
              className="order-input"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <input
              className="order-input"
              type="number"
              min={1}
              max={20}
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
            />
            <input
              className="order-input"
              type="datetime-local"
              value={reservedFor}
              onChange={(e) => setReservedFor(e.target.value)}
              required
            />
            <textarea
              className="order-input"
              placeholder="Optional note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" className="order-btn w-full" disabled={submitting}>
              {submitting ? "Booking…" : "Book table"}
            </button>
          </form>
        )}
      </div>
      <DeveloperCredit className="mt-8" />
    </main>
  );
}
