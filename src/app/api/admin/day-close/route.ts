import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { getOrderGrandTotal } from "@/lib/receipt";
import { getBranding } from "@/lib/branding";
import type { OrderWithItems } from "@/lib/types";

function startOfLocalDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const branding = await getBranding();
  const gst = {
    gstEnabled: branding.gstEnabled,
    cgstPercent: branding.cgstPercent,
    sgstPercent: branding.sgstPercent,
  };

  const from = startOfLocalDay().toISOString();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .gte("created_at", from)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (data ?? []) as OrderWithItems[];
  const active = orders.filter((o) => o.status !== "cancelled");
  const cancelled = orders.filter((o) => o.status === "cancelled");
  const revenue = active.reduce((sum, o) => sum + getOrderGrandTotal(o, gst), 0);

  const byMethod: Record<string, { count: number; total: number }> = {};
  for (const order of active) {
    const method = order.payment_method?.trim() || "unmarked";
    const entry = byMethod[method] ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += getOrderGrandTotal(order, gst);
    byMethod[method] = entry;
  }

  const itemCounts = new Map<string, number>();
  for (const order of active) {
    for (const line of order.order_items || []) {
      itemCounts.set(line.item_name, (itemCounts.get(line.item_name) ?? 0) + line.quantity);
    }
  }

  const topItems = Array.from(itemCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, quantity]) => ({ name, quantity }));

  return NextResponse.json({
    from,
    orderCount: active.length,
    cancelledCount: cancelled.length,
    revenue,
    byMethod,
    topItems,
    takeawayCount: active.filter((o) => o.order_type === "takeaway").length,
    dineInCount: active.filter((o) => o.order_type !== "takeaway").length,
  });
}
