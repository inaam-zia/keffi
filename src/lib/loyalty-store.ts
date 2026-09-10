import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function adjustLoyalty(phone: string, delta: number): Promise<number> {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || !isSupabaseConfigured()) return 0;

  const supabase = createServerClient();
  const { data } = await supabase
    .from("loyalty_accounts")
    .select("points")
    .eq("phone", digits)
    .maybeSingle();

  const next = Math.max(0, (Number(data?.points) || 0) + delta);
  await supabase.from("loyalty_accounts").upsert({
    phone: digits,
    points: next,
    updated_at: new Date().toISOString(),
  });
  return next;
}
