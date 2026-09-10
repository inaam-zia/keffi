import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { buildFloorTables, type FloorOrderRow } from "@/lib/floor-map";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { getTableLabelMap } from "@/lib/tables";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ tables: [] });
  }

  const supabase = createServerClient();
  const [{ data: tables }, ordersRes, { data: requests }, labels] = await Promise.all([
    supabase.from("cafe_tables").select("id, table_number, label, enabled").order("table_number"),
    supabase
      .from("orders")
      .select("table_number, status, customer_name, order_type, payment_method, created_at")
      .in("status", ["new", "preparing", "served"]),
    supabase.from("table_requests").select("table_number, kind").eq("status", "open"),
    getTableLabelMap(),
  ]);

  let orders: FloorOrderRow[] = (ordersRes.data ?? []) as FloorOrderRow[];
  if (ordersRes.error) {
    const fallback = await supabase
      .from("orders")
      .select("table_number, status, customer_name, created_at")
      .in("status", ["new", "preparing", "served"]);
    orders = (fallback.data ?? []) as FloorOrderRow[];
  }

  return NextResponse.json({
    tables: buildFloorTables({
      tables: tables ?? [],
      orders: orders ?? [],
      requests: requests ?? [],
      labels,
    }),
  });
}
