import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
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
  const [{ data: tables }, { data: orders }, { data: requests }] = await Promise.all([
    supabase.from("cafe_tables").select("id, table_number, label, enabled").order("table_number"),
    supabase.from("orders").select("table_number, status, total").in("status", ["new", "preparing", "served"]),
    supabase.from("table_requests").select("table_number, kind").eq("status", "open"),
  ]);

  const labels = await getTableLabelMap();
  const byTable = new Map<
    number,
    { kitchen: number; served: number; waiter: boolean; bill: boolean }
  >();

  for (const order of orders ?? []) {
    const entry = byTable.get(order.table_number) ?? {
      kitchen: 0,
      served: 0,
      waiter: false,
      bill: false,
    };
    if (order.status === "served") entry.served += 1;
    else entry.kitchen += 1;
    byTable.set(order.table_number, entry);
  }
  for (const req of requests ?? []) {
    const entry = byTable.get(req.table_number) ?? {
      kitchen: 0,
      served: 0,
      waiter: false,
      bill: false,
    };
    if (req.kind === "waiter") entry.waiter = true;
    if (req.kind === "bill") entry.bill = true;
    byTable.set(req.table_number, entry);
  }

  const result = (tables ?? []).map((table) => {
    const stats = byTable.get(table.table_number);
    let state: "free" | "kitchen" | "served" | "disabled" = "free";
    if (!table.enabled) state = "disabled";
    else if (stats?.kitchen) state = "kitchen";
    else if (stats?.served) state = "served";

    return {
      id: table.id,
      tableNumber: table.table_number,
      label: labels.get(table.table_number) || table.label || null,
      enabled: table.enabled,
      state,
      waiter: Boolean(stats?.waiter),
      bill: Boolean(stats?.bill),
    };
  });

  return NextResponse.json({ tables: result });
}
