import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/supabase-errors";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ reservations: [] });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("reserved_for", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ reservations: [] });
  }
  return NextResponse.json({ reservations: data ?? [] });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const guestName = String(body.guestName || "").trim();
  const phone = String(body.phone || "").replace(/\D/g, "");
  const partySize = parseInt(String(body.partySize || ""), 10);
  const reservedFor = String(body.reservedFor || "").trim();
  const notes = String(body.notes || "").trim();

  if (!guestName || phone.length < 10 || !partySize || partySize < 1 || !reservedFor) {
    return NextResponse.json(
      { error: "Name, phone, party size, and time are required" },
      { status: 400 }
    );
  }

  const when = new Date(reservedFor);
  if (Number.isNaN(when.getTime()) || when.getTime() < Date.now() - 60_000) {
    return NextResponse.json({ error: "Pick a future date and time" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      guest_name: guestName,
      phone,
      party_size: partySize,
      reserved_for: when.toISOString(),
      notes,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
  }
  return NextResponse.json(data);
}
