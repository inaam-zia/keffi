import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ points: 0 });
  }

  const phone = (new URL(request.url).searchParams.get("phone") || "").replace(/\D/g, "");
  if (phone.length < 10) {
    return NextResponse.json({ points: 0 });
  }

  const supabase = createServerClient();
  const { data } = await supabase
    .from("loyalty_accounts")
    .select("points")
    .eq("phone", phone)
    .maybeSingle();

  return NextResponse.json({ points: Number(data?.points) || 0 });
}
