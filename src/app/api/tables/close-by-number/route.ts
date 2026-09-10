import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { newSessionId } from "@/lib/table-session";
import { formatTableRef } from "@/lib/tables";

type CloseResult = {
  tableNumber: number;
  ok: boolean;
  message: string;
};

async function closeOneTable(
  supabase: ReturnType<typeof createServerClient>,
  tableNumber: number,
  paymentMethod: string
): Promise<CloseResult> {
  const sessionId = newSessionId();
  const { data, error } = await supabase
    .from("cafe_tables")
    .update({ session_id: sessionId })
    .eq("table_number", tableNumber)
    .select("id, table_number, label, session_id")
    .maybeSingle();

  if (error) {
    if (error.message.includes("session_id")) {
      return {
        tableNumber,
        ok: false,
        message: "Run supabase/add-table-session.sql in Supabase SQL editor to enable table sessions.",
      };
    }
    return { tableNumber, ok: false, message: formatSupabaseError(error) };
  }

  if (!data) {
    return {
      tableNumber,
      ok: false,
      message: `No table configured for number ${tableNumber}`,
    };
  }

  if (paymentMethod === "upi" || paymentMethod === "cash" || paymentMethod === "card") {
    await supabase
      .from("orders")
      .update({ payment_method: paymentMethod })
      .eq("table_number", tableNumber)
      .in("status", ["served", "new", "preparing"]);
  }

  return {
    tableNumber,
    ok: true,
    message: `${formatTableRef(data.table_number, data.label)} closed — previous guests must scan the QR again.`,
  };
}

function parseTableNumbers(body: { tableNumber?: unknown; tableNumbers?: unknown }): number[] {
  const raw = Array.isArray(body.tableNumbers)
    ? body.tableNumbers
    : body.tableNumber != null
      ? [body.tableNumber]
      : [];
  const unique = new Set<number>();
  for (const value of raw) {
    const tableNumber = parseInt(String(value), 10);
    if (!Number.isNaN(tableNumber) && tableNumber >= 1 && tableNumber <= 99) {
      unique.add(tableNumber);
    }
  }
  return Array.from(unique);
}

/**
 * Staff “Close table” — rotate session so previous guests at that number
 * cannot keep ordering from a bookmarked /order/N page.
 */
export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const tableNumbers = parseTableNumbers(body);
    const paymentMethod = String(body.paymentMethod || "").trim().toLowerCase();

    if (!tableNumbers.length) {
      return NextResponse.json({ error: "Invalid table number" }, { status: 400 });
    }

    const supabase = createServerClient();
    const results: CloseResult[] = [];
    for (const tableNumber of tableNumbers) {
      results.push(await closeOneTable(supabase, tableNumber, paymentMethod));
    }

    const closed = results.filter((row) => row.ok);
    const failed = results.filter((row) => !row.ok);

    if (!closed.length) {
      return NextResponse.json(
        { error: failed[0]?.message || "Could not close table", results },
        { status: failed[0]?.message?.includes("add-table-session") ? 503 : 404 }
      );
    }

    const message =
      closed.length === 1
        ? closed[0].message
        : `${closed.length} tables cleared${failed.length ? ` · ${failed.length} failed` : ""}.`;

    return NextResponse.json({
      ok: failed.length === 0,
      message,
      closed: closed.map((row) => row.tableNumber),
      failed,
      results,
    });
  } catch (err) {
    return NextResponse.json({ error: formatSupabaseError(err) }, { status: 500 });
  }
}
