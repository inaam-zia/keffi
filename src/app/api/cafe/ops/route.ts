import { NextResponse } from "next/server";
import { getBranding } from "@/lib/branding";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { estimateWaitMinutes } from "@/lib/wait-estimate";

export async function GET() {
  const branding = await getBranding();
  let waitMinutes = 5;
  let openKitchenOrders = 0;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      const { data } = await supabase
        .from("orders")
        .select("status")
        .in("status", ["new", "preparing"]);
      const rows = data ?? [];
      const newCount = rows.filter((o) => o.status === "new").length;
      const preparingCount = rows.filter((o) => o.status === "preparing").length;
      openKitchenOrders = rows.length;
      waitMinutes = estimateWaitMinutes(newCount, preparingCount);
    } catch {
      /* keep defaults */
    }
  }

  return NextResponse.json({
    busyMode: branding.busyMode,
    waitMinutes,
    openKitchenOrders,
    wifiSsid: branding.wifiSsid,
    wifiPassword: branding.wifiPassword,
  });
}
