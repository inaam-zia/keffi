import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { validateTableAccess } from "@/lib/table-session";

const MAX_ITEMS = 8;

type LiveOrderRow = {
  created_at: string;
  table_number: number;
  order_items: { item_name: string | null }[] | null;
};

/**
 * Customer-facing: item names currently being ordered at other tables.
 * Never returns quantities or table numbers.
 */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [] });
  }

  const tableParam = new URL(request.url).searchParams.get("table");
  const tableNumber = tableParam ? parseInt(tableParam, 10) : null;

  if (!tableNumber || isNaN(tableNumber)) {
    return NextResponse.json({ error: "Table number required" }, { status: 400 });
  }

  const sessionCheck = await validateTableAccess(tableNumber);
  if (!sessionCheck.ok && sessionCheck.sessionsEnabled) {
    return NextResponse.json({ error: "Please scan the table QR" }, { status: 403 });
  }

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("orders")
      .select("created_at, table_number, order_items(item_name)")
      .in("status", ["new", "preparing"])
      .neq("table_number", tableNumber)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) {
      return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
    }

    const seen = new Set<string>();
    const items: string[] = [];

    for (const order of (data ?? []) as LiveOrderRow[]) {
      for (const line of order.order_items ?? []) {
        const name = String(line.item_name || "").trim();
        if (!name || seen.has(name)) continue;
        seen.add(name);
        items.push(name);
        if (items.length >= MAX_ITEMS) break;
      }
      if (items.length >= MAX_ITEMS) break;
    }

    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ error: formatSupabaseError(err) }, { status: 500 });
  }
}
