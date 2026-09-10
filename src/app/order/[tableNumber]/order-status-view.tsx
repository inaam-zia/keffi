"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CafeBrandingBlock from "@/components/cafe-branding-block";
import DeveloperCredit from "@/components/developer-credit";
import TableHeading from "@/components/table-heading";
import ThermalReceipt from "@/components/thermal-receipt";
import { formatPrice } from "@/lib/format";
import { fetchMyActiveOrders, ORDER_STATUS_POLL_MS } from "@/lib/order-poll";
import { consolidateOrdersForBill, getOrderBillTotals, getOrderGrandTotal } from "@/lib/receipt";
import BillGstLines from "@/components/bill-gst-lines";
import { useCustomerLocale } from "@/components/customer-locale-provider";
import CustomerNav from "@/components/customer-nav";
import TableAssistButtons from "@/components/table-assist-buttons";
import {
  customerInputLang,
  displayMenuText,
  displaySpiceLabel,
  type CustomerCopy,
} from "@/lib/customer-copy";
import type { CafeBranding } from "@/lib/branding-types";
import type { OrderItem, OrderStatus, OrderWithItems } from "@/lib/types";

const STATUS_STEPS: OrderStatus[] = ["new", "preparing", "served"];

type DishFeedback = {
  order_item_id: string;
  order_id: string;
  item_name: string;
  rating: number;
  comment: string | null;
};

function StatusTimeline({
  status,
  copy,
}: {
  status: OrderStatus;
  copy: CustomerCopy;
}) {
  if (status === "cancelled") {
    return (
      <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-700">
        {copy.orderCancelled}
      </p>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(status);
  const labels: Record<OrderStatus, string> = {
    new: copy.received,
    preparing: copy.preparing,
    served: copy.served,
    cancelled: copy.cancelled,
  };

  return (
    <div className="flex items-center justify-between gap-1">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? active
                    ? "ring-2 ring-[var(--brand-primary)] ring-offset-2"
                    : ""
                  : "opacity-40"
              }`}
              style={{
                backgroundColor: done ? "var(--brand-primary)" : "var(--brand-border)",
                color: done ? "var(--brand-button-text)" : "var(--brand-muted)",
              }}
            >
              {idx + 1}
            </div>
            <span
              className={`text-center text-[10px] font-medium leading-tight ${
                active ? "text-brand-heading" : "text-brand-subtle"
              }`}
            >
              {labels[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label="Rate this dish">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className={`text-xl leading-none transition ${
            star <= value ? "text-amber-500" : "text-cafe-300"
          } disabled:cursor-not-allowed`}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function DishFeedbackForm({
  item,
  tableNumber,
  existing,
  onSubmitted,
}: {
  item: OrderItem;
  tableNumber: number;
  existing?: DishFeedback;
  onSubmitted: (feedback: DishFeedback) => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { copy, locale } = useCustomerLocale();
  const submitted = Boolean(existing);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError(copy.selectStars);
      return;
    }

    setError("");
    setSubmitting(true);

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber,
        orderItemId: item.id,
        rating,
        comment,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Could not save feedback");
      return;
    }

    onSubmitted({
      order_item_id: item.id,
      order_id: item.order_id,
      item_name: item.item_name,
      rating,
      comment: comment.trim() || null,
    });
  }

  if (submitted) {
    return (
      <li className="rounded-xl bg-cafe-50 px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-brand-heading">
              {item.quantity}× {displayMenuText(item.item_name, locale)}
            </p>
            <p className="mt-1 text-xs text-green-700">{copy.thanksFeedback}</p>
          </div>
          <div className="text-amber-500" aria-label={`Rated ${existing!.rating} stars`}>
            {"★".repeat(existing!.rating)}
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-cafe-200 bg-cafe-50/80 px-3 py-3">
      <form onSubmit={handleSubmit}>
        <p className="text-sm font-medium text-brand-heading">
          {item.quantity}× {displayMenuText(item.item_name, locale)}
        </p>
        <p className="mt-1 text-xs text-brand-muted">{copy.howWasDish}</p>
        <div className="mt-2">
          <StarRating value={rating} disabled={submitting} onChange={setRating} />
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={copy.optionalComment}
          rows={2}
          className="order-input mt-2 min-h-[60px]"
          disabled={submitting}
          lang={customerInputLang(locale)}
          autoCapitalize="off"
          autoCorrect="off"
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || rating < 1}
          className="order-btn mt-3 w-full py-2.5 text-sm"
        >
          {submitting ? copy.saving : copy.submitFeedback}
        </button>
      </form>
    </li>
  );
}

function OrderStatusCard({
  order,
  branding,
  copy,
}: {
  order: OrderWithItems;
  branding: CafeBranding;
  copy: CustomerCopy;
}) {
  const { locale } = useCustomerLocale();
  const gst = {
    gstEnabled: branding.gstEnabled,
    cgstPercent: branding.cgstPercent,
    sgstPercent: branding.sgstPercent,
  };
  const labels: Record<OrderStatus, string> = {
    new: copy.received,
    preparing: copy.preparing,
    served: copy.served,
    cancelled: copy.cancelled,
  };
  const bill = getOrderBillTotals(order, gst);
  return (
    <div className="rounded-2xl border border-brand bg-brand-surface p-4 shadow-sm">
      <div className="mb-4">
        <StatusTimeline status={order.status} copy={copy} />
      </div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-heading">
          {labels[order.status]}
        </p>
        <p className="font-bold text-brand-heading">
          {formatPrice(bill.grandTotal)}
        </p>
      </div>
      <ul className="space-y-2 border-t border-brand pt-3">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <span className="text-brand-heading">
              {item.quantity}× {displayMenuText(item.item_name, locale)}
              {item.spice_level ? ` · ${displaySpiceLabel(item.spice_level, copy)}` : ""}
              {item.notes ? (
                <span className="mt-0.5 block text-xs text-amber-800">{item.notes}</span>
              ) : null}
            </span>
            <span className="text-brand-muted">
              {formatPrice(item.item_price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 space-y-1 border-t border-brand pt-3 text-sm">
        <div className="flex justify-between text-brand-muted">
          <span>{copy.subTotal}</span>
          <span>{formatPrice(bill.subTotal)}</span>
        </div>
        {bill.applyGst ? (
          <BillGstLines
            bill={bill}
            formatAmount={formatPrice}
            lineClassName="flex justify-between text-xs text-brand-muted"
            totalClassName="flex justify-between text-sm font-semibold text-brand-heading"
          />
        ) : null}
        <div className="flex justify-between font-bold text-brand-heading">
          <span>{copy.toPay}</span>
          <span>{formatPrice(bill.grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Merge all non-cancelled orders into a single bill. Returns null until every
 * non-cancelled order for the table has been served, so the customer sees one
 * consolidated bill (and one feedback section) instead of one per order.
 */
function buildConsolidatedOrder(orders: OrderWithItems[]): OrderWithItems | null {
  const billable = orders.filter((o) => o.status !== "cancelled");
  if (billable.length === 0 || !billable.every((o) => o.status === "served")) {
    return null;
  }
  return consolidateOrdersForBill(billable);
}

type Props = {
  tableNumber: number;
  tableName: string;
  customerName: string;
  branding: CafeBranding;
  onAddMore: () => void;
  onHome: () => void;
};

export default function OrderStatusView({
  tableNumber,
  tableName,
  customerName,
  branding,
  onAddMore,
  onHome,
}: Props) {
  const { copy, locale } = useCustomerLocale();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackByItemId, setFeedbackByItemId] = useState<Map<string, DishFeedback>>(
    new Map()
  );
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null);
  const [paymentQrLabel, setPaymentQrLabel] = useState<string | null>(null);
  const [paymentUpiId, setPaymentUpiId] = useState<string | null>(null);
  const [paymentPayeeName, setPaymentPayeeName] = useState<string | null>(null);
  /** Fresh branding for the bill (GST %, GSTIN) when all orders are served */
  const [billBranding, setBillBranding] = useState<CafeBranding>(branding);
  const [waitMinutes, setWaitMinutes] = useState(5);
  const [wifiSsid, setWifiSsid] = useState(branding.wifiSsid);
  const [wifiPassword, setWifiPassword] = useState(branding.wifiPassword);
  const [splitCount, setSplitCount] = useState(2);

  const loadPaymentQr = useCallback(async () => {
    const res = await fetch(`/api/payment-qr?_=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setPaymentQrUrl(data.qr?.imageUrl ?? null);
    setPaymentQrLabel(data.qr?.label ?? null);
    setPaymentUpiId(data.qr?.upiId ?? null);
    setPaymentPayeeName(data.qr?.payeeName ?? null);
  }, []);

  const loadBillBranding = useCallback(async () => {
    try {
      const res = await fetch(`/api/branding?_=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as CafeBranding;
      setBillBranding({
        ...branding,
        ...data,
        gstEnabled: Boolean(data.gstEnabled),
        gstin: data.gstin ?? null,
        cgstPercent: Number(data.cgstPercent) || 0,
        sgstPercent: Number(data.sgstPercent) || 0,
      });
    } catch {
      /* keep previous branding */
    }
  }, [branding]);

  const loadFeedback = useCallback(async () => {
    const res = await fetch(`/api/feedback?table=${tableNumber}&_=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    const map = new Map<string, DishFeedback>();
    for (const row of (data.feedback ?? []) as DishFeedback[]) {
      map.set(row.order_item_id, row);
    }
    setFeedbackByItemId(map);
  }, [tableNumber]);

  const loadOrders = useCallback(async () => {
    const { orders: nextOrders } = await fetchMyActiveOrders(tableNumber);
    setOrders(nextOrders);
    setLoading(false);
  }, [tableNumber]);

  useEffect(() => {
    void loadFeedback();
    void loadOrders();
    void loadPaymentQr();

    async function loadOps() {
      const res = await fetch("/api/cafe/ops", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setWaitMinutes(Number(data.waitMinutes) || 5);
      setWifiSsid(data.wifiSsid ?? null);
      setWifiPassword(data.wifiPassword ?? null);
    }
    void loadOps();

    function tick() {
      if (document.visibilityState === "hidden") return;
      void loadOrders();
      void loadFeedback();
      void loadPaymentQr();
    }

    const interval = setInterval(tick, ORDER_STATUS_POLL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") {
        void loadOrders();
        void loadFeedback();
        void loadPaymentQr();
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadOrders, loadFeedback, loadPaymentQr]);

  function handleFeedbackSubmitted(feedback: DishFeedback) {
    setFeedbackByItemId((prev) => {
      const next = new Map(prev);
      next.set(feedback.order_item_id, feedback);
      return next;
    });
  }

  const consolidatedOrder = useMemo(() => buildConsolidatedOrder(orders), [orders]);
  const allServed = consolidatedOrder !== null;
  const allCancelled =
    orders.length > 0 && orders.every((o) => o.status === "cancelled");

  const headlineStatus = useMemo((): OrderStatus | null => {
    if (!orders.length) return null;
    if (allCancelled) return "cancelled";
    if (allServed) return "served";
    if (orders.some((o) => o.status === "preparing")) return "preparing";
    if (orders.some((o) => o.status === "new")) return "new";
    return orders[0]?.status ?? null;
  }, [orders, allCancelled, allServed]);

  const firstName = customerName.trim().split(/\s+/)[0] || copy.there;
  const gst = {
    gstEnabled: billBranding.gstEnabled,
    cgstPercent: billBranding.cgstPercent,
    sgstPercent: billBranding.sgstPercent,
  };
  const billOrder =
    consolidatedOrder ||
    (orders.length
      ? {
          ...orders[0],
          total: orders.reduce((sum, o) => sum + o.total, 0),
          discount: orders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0),
          order_items: orders.flatMap((o) => o.order_items),
        }
      : null);
  const grandTotal = billOrder ? getOrderGrandTotal(billOrder, gst) : 0;
  const splits = Math.max(2, Math.min(12, Math.floor(splitCount) || 2));
  const eachPays = Math.round((grandTotal / splits) * 100) / 100;

  // When the bill is generated (all served), reload GST/CGST/SGST from admin settings
  useEffect(() => {
    if (!allServed || allCancelled) return;
    void loadBillBranding();
  }, [allServed, allCancelled, loadBillBranding]);

  return (
    <main className="order-bg mx-auto min-h-screen w-full max-w-lg px-5 py-8 md:max-w-5xl">
      <div className="mb-6">
        <CafeBrandingBlock branding={branding} logoSize="md" showTagline align="center" />
        <CustomerNav
          className="mt-4 justify-center"
          homeHref={`/order/${tableNumber}`}
          onHomeClick={onHome}
        />
      </div>

      <div className="order-hero-card space-y-6">
        <div className="text-center">
          {allServed && orders.length > 0 && !allCancelled ? (
            <>
              <div className="success-check">✓</div>
              <h1 className="text-2xl font-bold text-brand-heading">{copy.enjoyMeal}</h1>
              <p className="mt-2 text-sm text-brand-muted">
                {copy.billReady} {firstName}!
              </p>
            </>
          ) : allCancelled ? (
            <>
              <div className="status-hero status-hero--cancelled">!</div>
              <h1 className="text-2xl font-bold text-brand-heading">{copy.orderCancelled}</h1>
              <p className="mt-2 text-sm text-brand-muted">
                {copy.contactStaff} {firstName}.
              </p>
            </>
          ) : headlineStatus === "preparing" ? (
            <>
              <div className="status-hero status-hero--preparing" aria-hidden>
                <span className="status-hero__pulse" />
              </div>
              <h1 className="text-2xl font-bold text-brand-heading">{copy.kitchenOnIt}</h1>
              <p className="mt-2 text-sm text-brand-muted">
                {copy.hangTight} {firstName} {copy.wellBring}{" "}
                <TableHeading
                  tableNumber={tableNumber}
                  tableName={tableName}
                  size="sm"
                  tableWord={copy.table}
                />
              </p>
            </>
          ) : (
            <>
              <div className="status-hero status-hero--received" aria-hidden>
                ✓
              </div>
              <h1 className="text-2xl font-bold text-brand-heading">{copy.orderReceived}</h1>
              <p className="mt-2 text-sm text-brand-muted">
                {copy.thanks} {firstName} {copy.trackingOrder}{" "}
                <TableHeading
                  tableNumber={tableNumber}
                  tableName={tableName}
                  size="sm"
                  tableWord={copy.table}
                />
              </p>
            </>
          )}
        </div>

        {!allServed && !allCancelled ? (
          <p className="text-center text-sm text-brand-muted">
            {copy.waitTime} {waitMinutes} {copy.minutes}
          </p>
        ) : null}
        {wifiSsid ? (
          <p className="text-center text-xs text-brand-muted">
            {copy.wifi}: {wifiSsid}
            {wifiPassword ? ` · ${wifiPassword}` : ""}
          </p>
        ) : null}
        <TableAssistButtons
          tableNumber={tableNumber}
          canRequestBill={orders.length > 0 && !allCancelled}
          align="center"
          ready={!loading}
        />

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-subtle">
            {allServed && !allCancelled ? copy.yourBill : copy.orderDetails}
          </h2>
          {loading ? (
            <p className="text-center text-sm text-brand-muted">{copy.loadingStatus}</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-sm text-brand-muted">{copy.noActiveOrders}</p>
          ) : consolidatedOrder ? (
            <div className="rounded-2xl border border-brand bg-brand-surface p-4 shadow-sm">
              <ThermalReceipt
                order={consolidatedOrder}
                customerName={customerName}
                branding={billBranding}
                paymentQrUrl={paymentQrUrl}
                paymentQrLabel={paymentQrLabel}
                paymentUpiId={paymentUpiId}
                paymentPayeeName={paymentPayeeName}
                locale={locale}
              />
              <div className="mt-5 border-t border-brand pt-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-subtle">
                  {copy.rateDishes}
                </p>
                <ul className="space-y-2">
                  {consolidatedOrder.order_items.map((item) => (
                    <DishFeedbackForm
                      key={item.id}
                      item={item}
                      tableNumber={tableNumber}
                      existing={feedbackByItemId.get(item.id)}
                      onSubmitted={handleFeedbackSubmitted}
                    />
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            orders.map((order) => (
              <OrderStatusCard key={order.id} order={order} branding={billBranding} copy={copy} />
            ))
          )}
        </div>

        {allCancelled ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-800">
            {copy.orderCancelledHelp}
          </p>
        ) : null}

        {allServed && orders.length > 0 && !allCancelled ? (
          <p className="rounded-xl bg-green-50 px-4 py-3 text-center text-sm text-green-800">
            {copy.enjoyRate}
          </p>
        ) : null}

        {orders.length > 0 && !allCancelled && grandTotal > 0 ? (
          <div className="rounded-2xl border border-brand bg-brand-surface p-4">
            <p className="text-sm font-semibold text-brand-heading">{copy.splitBill}</p>
            <label className="mt-2 flex items-center justify-between gap-3 text-sm text-brand-muted">
              <span>{copy.splitBetween}</span>
              <input
                type="number"
                min={2}
                max={12}
                className="order-input w-20 py-1 text-right"
                value={splits}
                onChange={(e) => setSplitCount(Number(e.target.value) || 2)}
              />
            </label>
            <p className="mt-2 text-sm font-bold text-brand-heading">
              {copy.eachPays}: {formatPrice(eachPays)}
            </p>
          </div>
        ) : null}

        <button type="button" onClick={onAddMore} className="order-btn w-full">
          {allServed || allCancelled ? copy.orderMore : copy.addMore}
        </button>

        {!allServed && !allCancelled ? (
          <p className="text-center text-xs text-brand-subtle">
            {copy.statusAuto}
          </p>
        ) : null}
      </div>
      <DeveloperCredit className="mt-8" />
    </main>
  );
}
