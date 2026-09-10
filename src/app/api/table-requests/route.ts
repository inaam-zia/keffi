import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { validateTableAccess } from "@/lib/table-session";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ requests: [] });
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("table_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      return NextResponse.json({ requests: [] });
    }
    return NextResponse.json({ requests: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: formatSupabaseError(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const tableNumber = parseInt(String(body.tableNumber ?? ""), 10);
  const kind = body.kind === "bill" ? "bill" : body.kind === "waiter" ? "waiter" : null;

  if (!tableNumber || !kind) {
    return NextResponse.json({ error: "Table and request type required" }, { status: 400 });
  }

  const sessionCheck = await validateTableAccess(tableNumber);
  if (!sessionCheck.ok && sessionCheck.sessionsEnabled) {
    return NextResponse.json({ error: "Please scan the table QR" }, { status: 403 });
  }

  try {
    const supabase = createServerClient();
    const { data: existing } = await supabase
      .from("table_requests")
      .select("id")
      .eq("table_number", tableNumber)
      .eq("kind", kind)
      .eq("status", "open")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, id: existing.id, duplicate: true });
    }

    const { data, error } = await supabase
      .from("table_requests")
      .insert({ table_number: tableNumber, kind, status: "open" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
    }
    return NextResponse.json({ ok: true, request: data });
  } catch (err) {
    return NextResponse.json({ error: formatSupabaseError(err) }, { status: 500 });
  }
}
