"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Status = {
  adminPasswordCustomized: boolean;
  paymentQrPasswordCustomized: boolean;
  kitchenPasswordCustomized: boolean;
  cashierPasswordCustomized: boolean;
  envAdminFallback: boolean;
  envPaymentQrFallback: boolean;
};

const emptyAdminForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const emptyPaymentForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function SettingsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstin, setGstin] = useState("");
  const [cgstPercent, setCgstPercent] = useState("2.5");
  const [sgstPercent, setSgstPercent] = useState("2.5");
  const [savingGst, setSavingGst] = useState(false);
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [busyMode, setBusyMode] = useState(false);
  const [savingOps, setSavingOps] = useState(false);
  const [kitchenForm, setKitchenForm] = useState(emptyAdminForm);
  const [cashierForm, setCashierForm] = useState(emptyAdminForm);
  const [savingKitchen, setSavingKitchen] = useState(false);
  const [savingCashier, setSavingCashier] = useState(false);

  async function loadStatus() {
    const res = await fetch("/api/admin/passwords");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load settings");
      return;
    }
    setStatus(data);
  }

  async function loadGst() {
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
    setWifiSsid(data.wifiSsid || "");
    setWifiPassword(data.wifiPassword || "");
    setBusyMode(Boolean(data.busyMode));
  }

  useEffect(() => {
    Promise.all([loadStatus(), loadGst()]).finally(() => setLoading(false));
  }, []);

  async function changePassword(
    kind: "admin" | "payment_qr" | "kitchen" | "cashier",
    form: typeof emptyAdminForm
  ) {
    setError("");
    setSuccess("");

    const res = await fetch("/api/admin/passwords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not update password");
      return { ok: false as const, logout: false };
    }
    setSuccess(data.message || "Password updated.");
    if (!data.logout) {
      await loadStatus();
    }
    return { ok: true as const, logout: Boolean(data.logout) };
  }

  async function onSaveAdmin(e: React.FormEvent) {
    e.preventDefault();
    setSavingAdmin(true);
    try {
      const result = await changePassword("admin", adminForm);
      if (result.ok) {
        setAdminForm(emptyAdminForm);
        if (result.logout) {
          router.replace("/admin/login");
          router.refresh();
          return;
        }
      }
    } finally {
      setSavingAdmin(false);
    }
  }

  async function onSavePayment(e: React.FormEvent) {
    e.preventDefault();
    setSavingPayment(true);
    try {
      const result = await changePassword("payment_qr", paymentForm);
      if (result.ok) setPaymentForm(emptyPaymentForm);
    } finally {
      setSavingPayment(false);
    }
  }

  async function onSaveGst(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleaned = gstin.trim().toUpperCase().replace(/\s+/g, "");
    const cgst = Number(cgstPercent);
    const sgst = Number(sgstPercent);
    if (gstEnabled && cleaned && cleaned.length !== 15) {
      setError("GSTIN must be 15 characters (e.g. 22AAAAA0000A1Z5), or leave it blank.");
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
      setError("Enter CGST % and SGST % between 0 and 100 (e.g. 2.5 each).");
      return;
    }
    if (gstEnabled && cgst <= 0 && sgst <= 0) {
      setError("Set CGST % and/or SGST % (e.g. 2.5 and 2.5) to show tax on bills.");
      return;
    }

    setSavingGst(true);
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
          ? `GST enabled — CGST ${data.cgstPercent}% + SGST ${data.sgstPercent}% on bills.`
          : "GST disabled on bills."
      );
    } finally {
      setSavingGst(false);
    }
  }

  if (loading) {
    return <p className="text-brand-muted">Loading settings…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-heading">Settings</h2>
        <p className="text-brand-muted">
          Passwords, GST on bills, and security options for the admin panel.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={onSaveGst} className="card space-y-4">
        <div>
          <h3 className="font-bold text-brand-heading">GST</h3>
          <p className="mt-1 text-sm text-brand-muted">
            When enabled, bills add CGST + SGST lines on the subtotal
            (same style as a tax invoice).
          </p>
        </div>

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
            GSTIN number
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
            Optional 15-character GSTIN. Shown on the bill header when set.
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
        <p className="text-xs text-brand-muted">
          Example: subtotal ₹198 + CGST 2.5% (₹4.95) + SGST 2.5% (₹4.95) = Bill
          Total ₹207.90
        </p>

        <button type="submit" className="btn-primary" disabled={savingGst}>
          {savingGst ? "Saving…" : "Save GST settings"}
        </button>
      </form>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSavingOps(true);
          setError("");
          setSuccess("");
          const res = await fetch("/api/branding", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wifiSsid, wifiPassword, busyMode }),
          });
          const data = await res.json();
          setSavingOps(false);
          if (!res.ok) {
            setError(data.error || "Could not save");
            return;
          }
          setSuccess(
            data.busyMode
              ? "Busy mode on — customers cannot place new orders."
              : "Floor settings saved."
          );
        }}
        className="card space-y-4"
      >
        <div>
          <h3 className="font-bold text-brand-heading">Floor</h3>
          <p className="mt-1 text-sm text-brand-muted">
            Wi-Fi is shown on the customer order screen. Busy mode pauses new orders.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brand bg-brand-surface px-4 py-3">
          <input
            type="checkbox"
            checked={busyMode}
            onChange={(e) => setBusyMode(e.target.checked)}
            className="h-4 w-4 rounded border-brand"
          />
          <span className="text-sm font-medium text-brand-heading">Busy mode — pause new orders</span>
        </label>
        <input
          className="input-field"
          placeholder="Wi-Fi name (SSID)"
          value={wifiSsid}
          onChange={(e) => setWifiSsid(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Wi-Fi password"
          value={wifiPassword}
          onChange={(e) => setWifiPassword(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={savingOps}>
          {savingOps ? "Saving…" : "Save floor settings"}
        </button>
      </form>

      <form onSubmit={onSaveAdmin} className="card space-y-4">
        <div>
          <h3 className="font-bold text-brand-heading">Admin login password</h3>
          <p className="mt-1 text-sm text-brand-muted">
            Used to sign in to the admin panel.
            {status?.adminPasswordCustomized
              ? " Currently using a password saved from Settings."
              : status?.envAdminFallback
                ? " Currently using the password from server environment (ADMIN_PASSWORD)."
                : " No password configured yet."}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-muted">
            Current password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={adminForm.currentPassword}
            onChange={(e) =>
              setAdminForm({ ...adminForm, currentPassword: e.target.value })
            }
            className="input-field"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-muted">
              New password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={adminForm.newPassword}
              onChange={(e) =>
                setAdminForm({ ...adminForm, newPassword: e.target.value })
              }
              className="input-field"
              minLength={4}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-muted">
              Confirm new password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={adminForm.confirmPassword}
              onChange={(e) =>
                setAdminForm({ ...adminForm, confirmPassword: e.target.value })
              }
              className="input-field"
              minLength={4}
              required
            />
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={savingAdmin}>
          {savingAdmin ? "Saving…" : "Update admin password"}
        </button>
      </form>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSavingKitchen(true);
          await changePassword("kitchen", kitchenForm);
          setKitchenForm(emptyAdminForm);
          setSavingKitchen(false);
        }}
        className="card space-y-3"
      >
        <h3 className="font-bold text-brand-heading">Kitchen password</h3>
        <p className="text-sm text-brand-muted">
          Separate login for kitchen display. Use the same admin login page.
          {status?.kitchenPasswordCustomized ? " A kitchen password is set." : " Not set yet."}
        </p>
        <input
          type="password"
          className="input-field"
          placeholder="Current admin password"
          value={kitchenForm.currentPassword}
          onChange={(e) => setKitchenForm({ ...kitchenForm, currentPassword: e.target.value })}
          required
        />
        <input
          type="password"
          className="input-field"
          placeholder="New kitchen password"
          value={kitchenForm.newPassword}
          onChange={(e) => setKitchenForm({ ...kitchenForm, newPassword: e.target.value })}
          minLength={4}
          required
        />
        <input
          type="password"
          className="input-field"
          placeholder="Confirm kitchen password"
          value={kitchenForm.confirmPassword}
          onChange={(e) => setKitchenForm({ ...kitchenForm, confirmPassword: e.target.value })}
          minLength={4}
          required
        />
        <button type="submit" className="btn-primary" disabled={savingKitchen}>
          {savingKitchen ? "Saving…" : "Save kitchen password"}
        </button>
      </form>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSavingCashier(true);
          await changePassword("cashier", cashierForm);
          setCashierForm(emptyAdminForm);
          setSavingCashier(false);
        }}
        className="card space-y-3"
      >
        <h3 className="font-bold text-brand-heading">Cashier password</h3>
        <p className="text-sm text-brand-muted">
          Login for bills, table map, and day close.
          {status?.cashierPasswordCustomized ? " A cashier password is set." : " Not set yet."}
        </p>
        <input
          type="password"
          className="input-field"
          placeholder="Current admin password"
          value={cashierForm.currentPassword}
          onChange={(e) => setCashierForm({ ...cashierForm, currentPassword: e.target.value })}
          required
        />
        <input
          type="password"
          className="input-field"
          placeholder="New cashier password"
          value={cashierForm.newPassword}
          onChange={(e) => setCashierForm({ ...cashierForm, newPassword: e.target.value })}
          minLength={4}
          required
        />
        <input
          type="password"
          className="input-field"
          placeholder="Confirm cashier password"
          value={cashierForm.confirmPassword}
          onChange={(e) => setCashierForm({ ...cashierForm, confirmPassword: e.target.value })}
          minLength={4}
          required
        />
        <button type="submit" className="btn-primary" disabled={savingCashier}>
          {savingCashier ? "Saving…" : "Save cashier password"}
        </button>
      </form>

      <form onSubmit={onSavePayment} className="card space-y-4">
        <div>
          <h3 className="font-bold text-brand-heading">Payment QR password</h3>
          <p className="mt-1 text-sm text-brand-muted">
            Optional extra password for Payment QR. Admin sections are no longer
            locked behind this password after login.
            {status?.paymentQrPasswordCustomized
              ? " Currently using a password saved from Settings."
              : " If not set here, the admin password (or PAYMENT_QR_PASSWORD env) is used."}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-muted">
            Current password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={paymentForm.currentPassword}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, currentPassword: e.target.value })
            }
            className="input-field"
            required
          />
          <p className="mt-1 text-xs text-brand-muted">
            Enter the current Payment QR password, or the admin password if you
            haven&apos;t set a separate one yet.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-muted">
              New password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={paymentForm.newPassword}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, newPassword: e.target.value })
              }
              className="input-field"
              minLength={4}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-muted">
              Confirm new password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={paymentForm.confirmPassword}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  confirmPassword: e.target.value,
                })
              }
              className="input-field"
              minLength={4}
              required
            />
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={savingPayment}>
          {savingPayment ? "Saving…" : "Update Payment QR password"}
        </button>
      </form>
    </div>
  );
}
