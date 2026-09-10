"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import { calculateBillTotals, formatPercentLabel, getGstDisplayLines } from "@/lib/receipt";

const SAMPLE_SUBTOTAL = 1000;

export default function AdminGstForm() {
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstin, setGstin] = useState("");
  const [cgstPercent, setCgstPercent] = useState("2.5");
  const [sgstPercent, setSgstPercent] = useState("2.5");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    const res = await fetch("/api/branding");
    if (!res.ok) return;
    const data = await res.json();
    setGstEnabled(Boolean(data.gstEnabled));
    setGstin(data.gstin || "");
    setCgstPercent(
      data.cgstPercent != null && Number(data.cgstPercent) > 0
        ? String(data.cgstPercent)
        : "2.5"
    );
    setSgstPercent(
      data.sgstPercent != null && Number(data.sgstPercent) > 0
        ? String(data.sgstPercent)
        : "2.5"
    );
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const preview = useMemo(() => {
    const cgst = Number(cgstPercent);
    const sgst = Number(sgstPercent);
    return calculateBillTotals(SAMPLE_SUBTOTAL, {
      gstEnabled,
      cgstPercent: Number.isFinite(cgst) ? cgst : 0,
      sgstPercent: Number.isFinite(sgst) ? sgst : 0,
    });
  }, [gstEnabled, cgstPercent, sgstPercent]);

  const previewLines = getGstDisplayLines(preview);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleaned = gstin.trim().toUpperCase().replace(/\s+/g, "");
    const cgst = Number(cgstPercent);
    const sgst = Number(sgstPercent);
    if (gstEnabled && cleaned && cleaned.length !== 15) {
      setError("GST number must be 15 characters (e.g. 22AAAAA0000A1Z5), or leave it blank.");
      return;
    }
    if (
      gstEnabled &&
      (!Number.isFinite(cgst) ||
        cgst < 0 ||
        cgst > 100 ||
        !Number.isFinite(sgst) ||
        sgst < 0 ||
        sgst > 100)
    ) {
      setError("Enter CGST % and SGST % separately, between 0 and 100 (e.g. 2.5 each).");
      return;
    }
    if (gstEnabled && cgst <= 0 && sgst <= 0) {
      setError("Set CGST % and SGST % (e.g. 2.5 and 2.5) to show tax on bills.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gstEnabled,
          gstin: cleaned || null,
          cgstPercent: Number.isFinite(cgst) ? cgst : 0,
          sgstPercent: Number.isFinite(sgst) ? sgst : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save GST settings");
        return;
      }
      setGstEnabled(Boolean(data.gstEnabled));
      setGstin(data.gstin || "");
      setCgstPercent(
        data.cgstPercent != null ? String(data.cgstPercent) : cgstPercent
      );
      setSgstPercent(
        data.sgstPercent != null ? String(data.sgstPercent) : sgstPercent
      );
      setSuccess(
        data.gstEnabled
          ? `GST on — bills show CGST ${data.cgstPercent}% + SGST ${data.sgstPercent}% = GST ${formatPercentLabel(Number(data.cgstPercent) + Number(data.sgstPercent))}%.`
          : "GST off — bills will not add tax."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-brand-muted">Loading GST settings…</p>;
  }

  return (
    <form onSubmit={onSave} className="card space-y-4">
      <div>
        <h3 className="font-bold text-brand-heading">GST</h3>
        <p className="mt-1 text-sm text-brand-muted">
          Turn GST on, enter your GST number, and set CGST and SGST separately.
          Every bill then shows CGST, SGST, and the combined GST % and amount.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brand bg-brand-surface px-4 py-3">
        <input
          type="checkbox"
          checked={gstEnabled}
          onChange={(e) => setGstEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-brand"
        />
        <span className="text-sm font-medium text-brand-heading">
          Enable GST on bills
        </span>
      </label>

      <div>
        <label className="mb-1 block text-sm font-medium text-brand-muted">
          GST number
        </label>
        <input
          type="text"
          value={gstin}
          onChange={(e) => setGstin(e.target.value.toUpperCase())}
          placeholder="22AAAAA0000A1Z5"
          maxLength={15}
          className="input-field font-mono tracking-wide"
          autoComplete="off"
        />
        <p className="mt-1 text-xs text-brand-muted">
          15-character GSTIN. Shown on the bill header when GST is enabled.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-muted">
            CGST %
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={cgstPercent}
              onChange={(e) => setCgstPercent(e.target.value)}
              placeholder="2.5"
              className="input-field pr-10"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-brand-muted">
              %
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-muted">
            SGST %
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={sgstPercent}
              onChange={(e) => setSgstPercent(e.target.value)}
              placeholder="2.5"
              className="input-field pr-10"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-brand-muted">
              %
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-brand-heading">
        Combined GST{" "}
        <span className="font-semibold">
          {formatPercentLabel(
            (Number(cgstPercent) || 0) + (Number(sgstPercent) || 0)
          )}
          %
        </span>{" "}
        ({formatPercentLabel(Number(cgstPercent) || 0)}% +{" "}
        {formatPercentLabel(Number(sgstPercent) || 0)}%)
      </p>

      {gstEnabled && previewLines.length > 0 ? (
        <div className="rounded-xl border border-brand bg-brand-surface px-4 py-3 text-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-muted">
            Bill preview on {formatPrice(SAMPLE_SUBTOTAL)}
          </p>
          {previewLines.map((line) => (
            <div
              key={line.key}
              className={`flex justify-between gap-3 ${
                line.emphasize ? "mt-1 font-semibold text-brand-heading" : "text-brand-muted"
              }`}
            >
              <span>{line.label}</span>
              <span className="shrink-0 tabular-nums">{formatPrice(line.amount)}</span>
            </div>
          ))}
        </div>
      ) : null}

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Saving…" : "Save GST settings"}
      </button>
    </form>
  );
}
