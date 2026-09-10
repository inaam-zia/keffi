import type { SupabaseClient } from "@supabase/supabase-js";

type OrderInsert = {
  table_number: number;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  total: number;
  status: "new";
  notes?: string | null;
  order_type?: string | null;
  coupon_code?: string | null;
  discount?: number | null;
  loyalty_redeemed?: number | null;
};

export async function insertOrder(supabase: SupabaseClient, payload: OrderInsert) {
  const result = await supabase.from("orders").insert(payload).select().single();

  if (
    result.error?.message?.includes("coupon_code") ||
    result.error?.message?.includes("order_type") ||
    result.error?.message?.includes("loyalty_redeemed") ||
    result.error?.message?.includes("discount") ||
    result.error?.message?.includes("notes")
  ) {
    const {
      notes: _n,
      order_type: _t,
      coupon_code: _c,
      discount: _d,
      loyalty_redeemed: _l,
      ...rest
    } = payload;
    return insertOrder(supabase, rest);
  }

  if (result.error?.message?.includes("customer_phone")) {
    const { customer_phone: _p, customer_email: _e, ...rest } = payload;
    const name = payload.customer_email
      ? `${payload.customer_name} · +91 ${payload.customer_phone} · ${payload.customer_email}`
      : `${payload.customer_name} · +91 ${payload.customer_phone || ""}`;
    return supabase
      .from("orders")
      .insert({ ...rest, customer_name: name.trim() })
      .select()
      .single();
  }

  if (result.error?.message?.includes("customer_email")) {
    const { customer_email: _e, ...withoutEmail } = payload;
    return supabase.from("orders").insert(withoutEmail).select().single();
  }

  return result;
}
