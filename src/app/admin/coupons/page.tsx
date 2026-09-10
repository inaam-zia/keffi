"use client";

import { useEffect, useState } from "react";
import type { Coupon } from "@/lib/types";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [discountValue, setDiscountValue] = useState("10");
  const [minOrder, setMinOrder] = useState("0");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/coupons");
    const data = await res.json();
    setCoupons(data.coupons ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addCoupon(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        description,
        discountType,
        discountValue: Number(discountValue),
        minOrder: Number(minOrder) || 0,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save coupon");
      return;
    }
    setCode("");
    setDescription("");
    await load();
  }

  async function toggle(coupon: Coupon) {
    await fetch(`/api/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !coupon.active }),
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-heading">Coupons</h2>
        <p className="text-sm text-brand-muted">Guests enter a code at checkout. No paid service.</p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <form onSubmit={addCoupon} className="card grid gap-3 sm:grid-cols-2">
        <input
          className="input-field"
          placeholder="Code (WELCOME10)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
        />
        <input
          className="input-field"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select
          className="input-field"
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as "percent" | "amount")}
        >
          <option value="percent">Percent off</option>
          <option value="amount">₹ off</option>
        </select>
        <input
          className="input-field"
          type="number"
          min="0.01"
          step="0.01"
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
        />
        <input
          className="input-field"
          type="number"
          min="0"
          step="1"
          placeholder="Min order ₹"
          value={minOrder}
          onChange={(e) => setMinOrder(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          Add coupon
        </button>
      </form>
      <div className="space-y-2">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="card flex items-center justify-between gap-3">
            <div>
              <p className="font-bold">{coupon.code}</p>
              <p className="text-sm text-brand-muted">
                {coupon.discount_type === "percent"
                  ? `${coupon.discount_value}% off`
                  : `₹${coupon.discount_value} off`}
                {coupon.min_order > 0 ? ` · min ₹${coupon.min_order}` : ""}
              </p>
            </div>
            <button type="button" className="btn-secondary text-xs" onClick={() => toggle(coupon)}>
              {coupon.active ? "Disable" : "Enable"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
