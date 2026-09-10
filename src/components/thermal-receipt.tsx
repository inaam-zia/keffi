import type { CafeBranding } from "@/lib/branding-types";
import CafeLogo from "@/components/cafe-logo";
import { getReceiptConfig } from "@/lib/receipt-config";
import {
  calculateBillTotals,
  formatReceiptAmount,
  formatReceiptDate,
  formatReceiptGrandTotal,
  formatReceiptTime,
  formatTaxLineLabel,
  getBillNumber,
} from "@/lib/receipt";
import type { OrderItem, OrderWithItems } from "@/lib/types";
import UpiPayPanel from "@/components/upi-pay-panel";
import { displayMenuText, displaySpiceLabel, getCustomerCopy, type CustomerLocale } from "@/lib/customer-copy";

type Props = {
  order: OrderWithItems;
  customerName: string;
  branding: CafeBranding;
  paymentQrUrl?: string | null;
  paymentQrLabel?: string | null;
  paymentUpiId?: string | null;
  paymentPayeeName?: string | null;
  locale?: CustomerLocale;
};

export default function ThermalReceipt({
  order,
  customerName,
  branding,
  paymentQrUrl,
  paymentQrLabel,
  paymentUpiId,
  paymentPayeeName,
  locale = "en",
}: Props) {
  const receipt = getReceiptConfig(branding.appName);
  const billNumber = getBillNumber(order.id);
  const displayName = order.customer_name?.trim() || customerName.trim() || "Guest";
  const totalQty = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsTotal = order.order_items.reduce(
    (sum, item) => sum + item.item_price * item.quantity,
    0
  );
  const discount = Math.max(0, Number(order.discount) || 0);
  const subTotal = Math.max(0, itemsTotal - discount);
  const bill = calculateBillTotals(subTotal, {
    gstEnabled: branding.gstEnabled,
    cgstPercent: branding.cgstPercent,
    sgstPercent: branding.sgstPercent,
  });

  return (
    <article className="thermal-receipt" aria-label="Bill receipt">
      <header className="thermal-receipt__header">
        {branding.logoUrl ? (
          <CafeLogo branding={branding} size="md" className="thermal-receipt__logo" />
        ) : null}
        <h2 className="thermal-receipt__brand">{receipt.cafeName}</h2>
        {receipt.addressLines.map((line) => (
          <p key={line} className="thermal-receipt__address">
            {line}
          </p>
        ))}
        {branding.gstEnabled && branding.gstin ? (
          <p className="thermal-receipt__gst">GSTIN: {branding.gstin}</p>
        ) : null}
      </header>

      <hr className="thermal-receipt__rule" />

      <div className="thermal-receipt__name-row">
        <span>Name:</span>
        <span className="thermal-receipt__name-value">{displayName}</span>
      </div>

      <hr className="thermal-receipt__rule" />

      <div className="thermal-receipt__meta">
        <div className="thermal-receipt__meta-col">
          <p>
            <span className="thermal-receipt__meta-label">Date:</span>{" "}
            {formatReceiptDate(order.created_at)}
          </p>
          <p>
            <span className="thermal-receipt__meta-label">Time:</span>{" "}
            {formatReceiptTime(order.created_at)}
          </p>
          <p>
            <span className="thermal-receipt__meta-label">Cashier:</span> {receipt.cashier}
          </p>
        </div>
        <div className="thermal-receipt__meta-col thermal-receipt__meta-col--right">
          <p>
            <span className="thermal-receipt__meta-label">
              {order.order_type === "takeaway" ? "Parcel:" : "Dine In:"}
            </span>{" "}
            <strong>TB NO. {order.table_number}</strong>
          </p>
          <p>
            <span className="thermal-receipt__meta-label">Bill No.:</span> {billNumber}
          </p>
        </div>
      </div>

      <hr className="thermal-receipt__rule" />

      <table className="thermal-receipt__table">
        <thead>
          <tr>
            <th className="thermal-receipt__th-item">Item</th>
            <th className="thermal-receipt__th-num">Qty.</th>
            <th className="thermal-receipt__th-num">Price</th>
            <th className="thermal-receipt__th-num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((item) => (
            <ReceiptLine key={item.id} item={item} locale={locale} />
          ))}
        </tbody>
      </table>

      <hr className="thermal-receipt__rule thermal-receipt__rule--thick" />

      <div className="thermal-receipt__totals-block">
        <div className="thermal-receipt__qty-subtotal-row">
          <span className="thermal-receipt__qty-line">Total Qty: {totalQty}</span>
          <div className="thermal-receipt__subtotal">
            <span>Items</span>
            <span>{formatReceiptAmount(itemsTotal)}</span>
          </div>
        </div>
        {discount > 0 ? (
          <div className="thermal-receipt__qty-subtotal-row">
            <span className="thermal-receipt__qty-line">
              {order.coupon_code ? `Coupon ${order.coupon_code}` : "Discount"}
            </span>
            <div className="thermal-receipt__subtotal">
              <span>Less</span>
              <span>-{formatReceiptAmount(discount)}</span>
            </div>
          </div>
        ) : null}
        <div className="thermal-receipt__qty-subtotal-row">
          <span className="thermal-receipt__qty-line" />
          <div className="thermal-receipt__subtotal">
            <span>Sub Total</span>
            <span>{formatReceiptAmount(bill.subTotal)}</span>
          </div>
        </div>

        {bill.applyGst ? (
          <div className="thermal-receipt__tax-lines">
            {bill.cgstPercent > 0 ? (
              <div className="thermal-receipt__gst-line">
                <span>
                  {formatTaxLineLabel("CGST", bill.cgstPercent, bill.subTotal)}
                </span>
                <span>{formatReceiptAmount(bill.cgstAmount)}</span>
              </div>
            ) : null}
            {bill.sgstPercent > 0 ? (
              <div className="thermal-receipt__gst-line">
                <span>
                  {formatTaxLineLabel("SGST", bill.sgstPercent, bill.subTotal)}
                </span>
                <span>{formatReceiptAmount(bill.sgstAmount)}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <hr className="thermal-receipt__rule thermal-receipt__rule--thick" />

      <div className="thermal-receipt__grand-total">
        <span>Grand Total</span>
        <span>{formatReceiptGrandTotal(bill.grandTotal)}</span>
      </div>

      <hr className="thermal-receipt__rule thermal-receipt__rule--thick" />

      {paymentUpiId ? (
        <UpiPayPanel
          upi={{
            upiId: paymentUpiId,
            payeeName: paymentPayeeName || receipt.cafeName,
            amount: bill.grandTotal,
            note: `Bill ${billNumber}`,
          }}
          fallbackQrUrl={paymentQrUrl}
          fallbackQrLabel={paymentQrLabel}
        />
      ) : paymentQrUrl ? (
        <div className="thermal-receipt__pay">
          <p className="thermal-receipt__pay-title">Scan to pay</p>
          {paymentQrLabel ? (
            <p className="thermal-receipt__pay-label">{paymentQrLabel}</p>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={paymentQrUrl}
            alt="Payment QR code"
            className="thermal-receipt__pay-qr"
          />
          <p className="thermal-receipt__pay-amount">
            Pay {formatReceiptGrandTotal(bill.grandTotal)}
          </p>
        </div>
      ) : null}

      <hr className="thermal-receipt__rule" />

      <p className="thermal-receipt__thanks">Thanks</p>
    </article>
  );
}

function ReceiptLine({ item, locale }: { item: OrderItem; locale: CustomerLocale }) {
  const amount = item.item_price * item.quantity;
  const copy = getCustomerCopy(locale);
  const spice = displaySpiceLabel(item.spice_level || undefined, copy);

  return (
    <tr>
      <td className="thermal-receipt__item-name">
        {displayMenuText(item.item_name, locale)}
        {spice || item.notes ? (
          <span className="block text-[10px] font-normal opacity-80">
            {[spice, item.notes].filter(Boolean).join(" · ")}
          </span>
        ) : null}
      </td>
      <td className="thermal-receipt__num">{item.quantity}</td>
      <td className="thermal-receipt__num">{formatReceiptAmount(item.item_price)}</td>
      <td className="thermal-receipt__num">{formatReceiptAmount(amount)}</td>
    </tr>
  );
}
