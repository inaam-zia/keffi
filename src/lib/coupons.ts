export type CouponDiscountInput = {
  discount_type: string;
  discount_value: number;
  min_order: number;
};

export function couponDiscount(coupon: CouponDiscountInput, subtotal: number): number {
  if (subtotal < Number(coupon.min_order || 0)) return 0;
  const value = Number(coupon.discount_value) || 0;
  if (coupon.discount_type === "amount") {
    return Math.min(subtotal, Math.max(0, value));
  }
  return Math.min(subtotal, Math.round(((subtotal * value) / 100) * 100) / 100);
}
