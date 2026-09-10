import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/supabase-errors";
import { couponDiscount } from "@/lib/coupons";

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ coupons: [] });
  }

  const code = new URL(request.url).searchParams.get("code");
  const supabase = createServerClient();

  if (code) {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", normalizeCode(code))
      .eq("active", true)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Invalid coupon" }, { status: 404 });
    }
    return NextResponse.json({ coupon: data });
  }

  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ coupons: [] });
  }
  return NextResponse.json({ coupons: data ?? [] });
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json();
  const code = normalizeCode(String(body.code || ""));
  if (!code || code.length < 3) {
    return NextResponse.json({ error: "Code must be at least 3 characters" }, { status: 400 });
  }

  const discountType = body.discountType === "amount" ? "amount" : "percent";
  const discountValue = Number(body.discountValue);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return NextResponse.json({ error: "Enter a discount value" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code,
      description: String(body.description || "").trim(),
      discount_type: discountType,
      discount_value: discountValue,
      min_order: Number(body.minOrder) || 0,
      active: body.active !== false,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return NextResponse.json({ error: "That code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
  }
  return NextResponse.json(data);
}
