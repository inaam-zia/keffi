import { NextResponse } from "next/server";
import { uniqueLiveOrderItemNames } from "@/lib/live-ordering";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { validateTableAccess } from "@/lib/table-session";

/**
 * Customer-facing: item names currently on other tables' active orders.
 * Response is names only — no quantities, table numbers, or guest details.
 */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [] });
  }

  const tableParam = new URL(request.url).searchParams.get("table");
  const tableNumber = tableParam ? parseInt(tableParam, 10) : NaN;

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
      .select("table_number, created_at, order_items(item_name)")
      .in("status", ["new", "preparing"])
      .neq("table_number", tableNumber)
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) {
      return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
    }

    const items = uniqueLiveOrderItemNames(data ?? [], tableNumber);

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
