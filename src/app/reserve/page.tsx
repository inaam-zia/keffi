import { getBranding } from "@/lib/branding";
import ReserveClient from "./reserve-client";

export const dynamic = "force-dynamic";

export default async function ReservePage() {
  const branding = await getBranding();
  return <ReserveClient branding={branding} />;
}
