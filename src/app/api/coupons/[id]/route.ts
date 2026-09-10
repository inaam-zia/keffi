import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/supabase-errors";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.active === "boolean") updates.active = body.active;
  if (typeof body.description === "string") updates.description = body.description.trim();

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("coupons")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("coupons").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
