import { formatPrice } from "@/lib/format";
import type { OrderWithItems } from "@/lib/types";

export function buildWhatsAppBillText(
  order: OrderWithItems,
  cafeName: string,
  grandTotal: number
): string {
  const lines = [
    `${cafeName}`,
    `Bill · Table ${order.table_number}`,
    "",
    ...order.order_items.map((item) => {
      const note = item.notes?.trim() ? ` (${item.notes.trim()})` : "";
      const spice = item.spice_level ? ` [${item.spice_level}]` : "";
      return `${item.quantity}× ${item.item_name}${spice}${note} — ${formatPrice(item.item_price * item.quantity)}`;
    }),
    "",
    `Total: ${formatPrice(grandTotal)}`,
  ];
  return lines.join("\n");
}

export function whatsappBillUrl(
  phoneDigits: string | null | undefined,
  text: string
): string {
  const digits = (phoneDigits || "").replace(/\D/g, "");
  const withCountry =
    digits.length === 10 ? `91${digits}` : digits.startsWith("91") ? digits : digits;
  const encoded = encodeURIComponent(text);
  if (withCountry.length >= 11) {
    return `https://wa.me/${withCountry}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}
